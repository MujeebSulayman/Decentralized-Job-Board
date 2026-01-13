// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.28 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract JobBoardUpgradeable is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private totalJobs;
    CountersUpgradeable.Counter private totalApplications;

    uint256 public serviceFee;

    bytes32 public constant EMPLOYER_ROLE = keccak256("EMPLOYER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public paymaster;
    bool public paymasterEnabled;

    mapping(address => bool) public sponsoredUsers;
    mapping(bytes32 => bool) public sponsoredTransactions;

    mapping(address => address) public sponsoredUserForCaller;

    mapping(uint256 => JobStruct) public jobs;
    mapping(uint256 => ApplicationStruct[]) jobApplications;
    mapping(address => uint256[]) public employerJobs;

    mapping(uint256 => mapping(address => ApplicationState))
        public applicationStates;

    event JobPosted(
        uint256 indexed jobId,
        address indexed employer,
        string title,
        string orgName
    );

    event ApplicationSubmitted(
        uint256 indexed jobId,
        address indexed application,
        string name,
        WorkMode workMode,
        string email
    );

    event ServiceFeeUpdated(uint256 oldFee, uint256 newFee);
    event JobExpired(uint256 indexed jobId, address indexed employer);
    event PaymasterSet(address indexed paymaster, bool enabled);
    event TransactionSponsored(
        address indexed user,
        string operation,
        address indexed sponsor
    );
    event ApplicationStateChanged(
        uint256 indexed jobId,
        address indexed applicant,
        ApplicationState newState
    );

    enum WorkMode {
        Remote,
        Onsite,
        Hybrid
    }

    enum JobType {
        FullTime,
        PartTime,
        Internship,
        Freelance,
        Contract
    }

    enum ApplicationState {
        PENDING,
        SHORTLISTED,
        REJECTED,
        HIRED
    }

    struct CustomField {
        string fieldName;
        bool isRequired;
    }

    struct JobStruct {
        uint256 id;
        address employer;
        string orgName;
        string title;
        string description;
        string orgEmail;
        CustomField[] customField;
        string logoCID;
        bool isOpen;
        bool deleted;
        uint256 startTime;
        uint256 endTime;
        uint256 expirationTime;
        bool expired;
        JobType jobType;
        WorkMode workMode;
        string minimumSalary;
        string maximumSalary;
    }

    struct ApplicationStruct {
        uint256 jobId;
        address applicant;
        string name;
        string email;
        string phoneNumber;
        string location;
        string[] fieldResponse;
        string cvCID;
        string portfolioLink;
        string experience;
        string expectedSalary;
        string github;
        WorkMode workMode;
        JobType jobType;
        string minimumSalary;
        string maximumSalary;
        uint256 applicationTimestamp;
        ApplicationState currentState;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _serviceFee) public initializer {
        require(_serviceFee > 0, "Invalid fee");

        __Ownable_init();
        __ReentrancyGuard_init();
        __AccessControl_init();

        serviceFee = _serviceFee;
        paymasterEnabled = false;

        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMPLOYER_ROLE, msg.sender);
    }

    function updateServiceFee(uint256 _newFee) public onlyOwner {
        uint256 oldFee = serviceFee;
        serviceFee = _newFee;
        emit ServiceFeeUpdated(oldFee, _newFee);
    }

    function setPaymaster(address _paymaster, bool _enabled) public onlyOwner {
        require(_paymaster != address(0) || !_enabled, "Invalid paymaster");
        paymaster = _paymaster;
        paymasterEnabled = _enabled;
        emit PaymasterSet(_paymaster, _enabled);
    }

    function isSponsoredTransaction() internal view returns (bool) {
        return
            paymasterEnabled &&
            paymaster != address(0) &&
            msg.sender == paymaster;
    }

    function setSponsoredUser(address user) external {
        require(
            isSponsoredTransaction(),
            "Only paymaster can set sponsored user"
        );
        sponsoredUserForCaller[msg.sender] = user;
    }

    function getSponsoredUser() internal view returns (address) {
        if (isSponsoredTransaction()) {
            address user = sponsoredUserForCaller[msg.sender];
            require(user != address(0), "Sponsored user not set");
            return user;
        }
        return msg.sender;
    }

    function _grantEmployerRole(address employer) internal {
        if (!hasRole(EMPLOYER_ROLE, employer)) {
            _grantRole(EMPLOYER_ROLE, employer);
        }
    }

    function grantEmployerRole(address employer) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "Only admin can grant employer role"
        );
        _grantEmployerRole(employer);
    }

    function postJob(
        string memory orgName,
        string memory title,
        string memory description,
        string memory orgEmail,
        string memory logoCID,
        string[] memory fieldName,
        bool[] memory isRequired,
        JobType jobType,
        WorkMode workMode,
        string memory minimumSalary,
        string memory maximumSalary,
        uint256 expirationDays
    ) public payable nonReentrant returns (uint256) {
        require(
            msg.sender == tx.origin ||
                hasRole(ADMIN_ROLE, msg.sender) ||
                isSponsoredTransaction(),
            "Unauthorized"
        );

        bool isSponsored = isSponsoredTransaction();
        if (!isSponsored) {
            require(msg.value >= serviceFee, "Insufficient fund");
        }

        require(expirationDays > 0, "Invalid expiration");
        require(bytes(orgName).length > 0, "Empty orgName");
        require(bytes(title).length > 0, "Empty title");
        require(bytes(description).length > 0, "Empty description");
        require(bytes(logoCID).length > 0, "Empty logo");

        address jobEmployer;
        if (isSponsored) {
            jobEmployer = getSponsoredUser();
            sponsoredUsers[jobEmployer] = true;
            emit TransactionSponsored(jobEmployer, "postJob", msg.sender);
            delete sponsoredUserForCaller[msg.sender];
        } else {
            jobEmployer = hasRole(ADMIN_ROLE, msg.sender)
                ? tx.origin
                : msg.sender;
        }

        CustomField[] memory customField = new CustomField[](fieldName.length);
        for (uint i = 0; i < fieldName.length; i++) {
            customField[i] = CustomField({
                fieldName: fieldName[i],
                isRequired: isRequired[i]
            });
        }

        totalJobs.increment();
        uint256 currentJobId = totalJobs.current();

        jobs[currentJobId] = JobStruct({
            id: currentJobId,
            employer: jobEmployer,
            title: title,
            orgName: orgName,
            description: description,
            orgEmail: orgEmail,
            customField: customField,
            logoCID: logoCID,
            isOpen: true,
            deleted: false,
            startTime: block.timestamp,
            endTime: block.timestamp + 45 days,
            expirationTime: block.timestamp + (expirationDays * 1 days),
            expired: false,
            jobType: jobType,
            workMode: workMode,
            minimumSalary: minimumSalary,
            maximumSalary: maximumSalary
        });

        employerJobs[jobEmployer].push(currentJobId);
        _grantEmployerRole(jobEmployer);

        emit JobPosted(currentJobId, jobEmployer, title, orgName);
        return currentJobId;
    }

    function editJob(
        uint256 id,
        string memory orgName,
        string memory title,
        string memory description,
        string memory orgEmail,
        string memory logoCID,
        string[] memory fieldName,
        bool[] memory isRequired,
        bool isOpen,
        JobType jobType,
        WorkMode workMode,
        string memory minimumSalary,
        string memory maximumSalary
    ) public nonReentrant {
        require(
            msg.sender == jobs[id].employer || hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized"
        );

        require(!jobs[id].deleted, "Deleted");
        require(bytes(orgName).length > 0, "Empty orgName");
        require(bytes(title).length > 0, "Empty title");
        require(bytes(description).length > 0, "Empty description");
        require(bytes(logoCID).length > 0, "Empty logo");

        uint256 calculatedEndTime = block.timestamp + 45 days;
        require(calculatedEndTime > block.timestamp, "Invalid duration");

        CustomField[] memory customField = new CustomField[](fieldName.length);
        for (uint i = 0; i < fieldName.length; i++) {
            customField[i] = CustomField({
                fieldName: fieldName[i],
                isRequired: isRequired[i]
            });
        }

        jobs[id].orgName = orgName;
        jobs[id].title = title;
        jobs[id].description = description;
        jobs[id].orgEmail = orgEmail;
        jobs[id].logoCID = logoCID;
        jobs[id].customField = customField;
        jobs[id].endTime = calculatedEndTime;
        jobs[id].isOpen = isOpen;
        jobs[id].jobType = jobType;
        jobs[id].workMode = workMode;
        jobs[id].minimumSalary = minimumSalary;
        jobs[id].maximumSalary = maximumSalary;
    }

    function deleteJob(uint256 id) public {
        require(
            msg.sender == jobs[id].employer || hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized"
        );
        require(!jobs[id].deleted, "Already deleted");
        jobs[id].deleted = true;
    }

    function isJobExpired(uint256 jobId) public view returns (bool) {
        require(jobId > 0 && jobId <= totalJobs.current(), "Invalid job ID");
        return
            jobs[jobId].deleted || block.timestamp > jobs[jobId].expirationTime;
    }

    function checkJobExpiration(uint256 jobId) public {
        require(jobId > 0 && jobId <= totalJobs.current(), "Invalid job ID");
        if (
            block.timestamp > jobs[jobId].expirationTime &&
            !jobs[jobId].deleted &&
            !jobs[jobId].expired
        ) {
            jobs[jobId].expired = true;
            emit JobExpired(jobId, jobs[jobId].employer);
        }
    }

    function expireJob(uint256 jobId) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(EMPLOYER_ROLE, msg.sender),
            "Unauthorized"
        );
        require(!jobs[jobId].deleted, "Deleted");
        jobs[jobId].expirationTime = block.timestamp;
        emit JobExpired(jobId, jobs[jobId].employer);
    }

    function submitApplication(
        uint256 jobId,
        string memory name,
        string memory email,
        string memory phoneNumber,
        string memory location,
        string[] memory fieldResponses,
        string memory cvCID,
        string memory portfolioLink,
        string memory experience,
        string memory expectedSalary,
        string memory github
    ) public payable nonReentrant {
        require(!isJobExpired(jobId), "Expired");
        require(jobs[jobId].isOpen, "Closed");

        require(bytes(name).length > 0, "Empty name");
        require(bytes(email).length > 0, "Empty email");
        require(bytes(cvCID).length > 0, "Empty CV");

        JobStruct memory job = jobs[jobId];
        require(
            fieldResponses.length == job.customField.length,
            "Incomplete fields"
        );
        for (uint i = 0; i < job.customField.length; i++) {
            if (job.customField[i].isRequired) {
                require(
                    bytes(fieldResponses[i]).length > 0,
                    "Required field empty"
                );
            }
        }

        address applicant;
        bool isSponsored = isSponsoredTransaction();
        if (isSponsored) {
            applicant = getSponsoredUser();
            sponsoredUsers[applicant] = true;
            emit TransactionSponsored(
                applicant,
                "submitApplication",
                msg.sender
            );
            delete sponsoredUserForCaller[msg.sender];
        } else {
            applicant = msg.sender;
        }

        require(
            applicationStates[jobId][applicant] == ApplicationState.PENDING,
            "Already applied"
        );

        totalApplications.increment();

        ApplicationStruct memory newApplication = ApplicationStruct({
            jobId: jobId,
            applicant: applicant,
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            location: location,
            fieldResponse: fieldResponses,
            cvCID: cvCID,
            portfolioLink: portfolioLink,
            experience: experience,
            expectedSalary: expectedSalary,
            github: github,
            workMode: job.workMode,
            jobType: job.jobType,
            minimumSalary: job.minimumSalary,
            maximumSalary: job.maximumSalary,
            applicationTimestamp: block.timestamp,
            currentState: ApplicationState.PENDING
        });

        jobApplications[jobId].push(newApplication);
        applicationStates[jobId][applicant] = ApplicationState.PENDING;

        emit ApplicationSubmitted(jobId, applicant, name, job.workMode, email);
    }

    function updateApplicationStatus(
        uint256 jobId,
        address applicant,
        ApplicationState newState
    ) public {
        require(jobs[jobId].id > 0 && !jobs[jobId].deleted, "Invalid job");
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(EMPLOYER_ROLE, msg.sender),
            "Unauthorized"
        );

        bool applicantFound = false;
        for (uint i = 0; i < jobApplications[jobId].length; i++) {
            if (jobApplications[jobId][i].applicant == applicant) {
                applicationStates[jobId][applicant] = newState;
                jobApplications[jobId][i].currentState = newState;
                emit ApplicationStateChanged(jobId, applicant, newState);
                applicantFound = true;
                break;
            }
        }
        require(applicantFound, "Applicant not found");
    }

    function closeJob(uint256 jobId) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(EMPLOYER_ROLE, msg.sender),
            "Unauthorized"
        );
        jobs[jobId].isOpen = false;
    }

    function getJob(uint256 jobId) public view returns (JobStruct memory) {
        require(!isJobExpired(jobId), "Expired");
        return jobs[jobId];
    }

    function getAllJobs() public view returns (JobStruct[] memory) {
        uint256 allAvailableJobs = 0;
        for (uint i = 1; i <= totalJobs.current(); i++) {
            if (!isJobExpired(i)) {
                allAvailableJobs++;
            }
        }

        JobStruct[] memory availableJobs = new JobStruct[](allAvailableJobs);
        uint256 index = 0;
        for (uint i = 1; i <= totalJobs.current(); i++) {
            if (!isJobExpired(i)) {
                availableJobs[index] = jobs[i];
                index++;
            }
        }
        return availableJobs;
    }

    function getMyJobs() public view returns (JobStruct[] memory) {
        uint256[] memory jobIds = employerJobs[msg.sender];
        JobStruct[] memory myJobs = new JobStruct[](jobIds.length);
        for (uint i = 0; i < jobIds.length; i++) {
            myJobs[i] = jobs[jobIds[i]];
        }
        return myJobs;
    }

    function getJobApplicants(
        uint256 jobId
    ) public view returns (address[] memory) {
        address[] memory applicants = new address[](
            jobApplications[jobId].length
        );
        for (uint i = 0; i < jobApplications[jobId].length; i++) {
            applicants[i] = jobApplications[jobId][i].applicant;
        }
        return applicants;
    }

    function getJobApplicantDetails(
        uint256 jobId,
        uint256 applicantIndex
    ) public view returns (ApplicationStruct memory) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(EMPLOYER_ROLE, msg.sender),
            "Unauthorized"
        );
        require(
            jobs[jobId].id != 0 && !jobs[jobId].deleted,
            "Job does not exist"
        );
        require(
            applicantIndex < jobApplications[jobId].length,
            "Invalid index"
        );
        return jobApplications[jobId][applicantIndex];
    }

    function getJobApplicationCount(
        uint256 jobId
    ) public view returns (uint256) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(EMPLOYER_ROLE, msg.sender),
            "Unauthorized"
        );
        return jobApplications[jobId].length;
    }

    function getJobApplications(
        uint256 jobId
    ) public view returns (ApplicationStruct[] memory) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(EMPLOYER_ROLE, msg.sender),
            "Unauthorized"
        );
        return jobApplications[jobId];
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficient funds");
        payable(owner()).transfer(balance);
    }
}
