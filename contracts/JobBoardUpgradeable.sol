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

    error InvalidFee();
    error InvalidPaymaster();
    error NotAuthorized();
    error SponsoredUserNotSet();
    error InsufficientFund();
    error InvalidExpiration();
    error EmptyString();
    error Unauthorized();
    error Deleted();
    error AlreadyDeleted();
    error InvalidJobID();
    error InvalidDuration();
    error Expired();
    error Closed();
    error IncompleteFields();
    error RequiredFieldEmpty();
    error AlreadyApplied();
    error InvalidJob();
    error ApplicantNotFound();
    error InsufficientFunds();
    error JobDoesNotExist();
    error InvalidIndex();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _serviceFee) public initializer {
        if (_serviceFee == 0) revert InvalidFee();

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
        if (_paymaster == address(0) && _enabled) revert InvalidPaymaster();
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
        if (!isSponsoredTransaction()) revert NotAuthorized();
        sponsoredUserForCaller[msg.sender] = user;
    }

    function getSponsoredUser() internal view returns (address) {
        if (isSponsoredTransaction()) {
            address user = sponsoredUserForCaller[msg.sender];
            if (user == address(0)) revert SponsoredUserNotSet();
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
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAuthorized();
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
        if (
            msg.sender != tx.origin &&
            !hasRole(ADMIN_ROLE, msg.sender) &&
            !isSponsoredTransaction()
        ) revert Unauthorized();

        bool isSponsored = isSponsoredTransaction();
        if (!isSponsored) {
            if (msg.value < serviceFee) revert InsufficientFund();
        }

        if (expirationDays == 0) revert InvalidExpiration();
        if (bytes(orgName).length == 0) revert EmptyString();
        if (bytes(title).length == 0) revert EmptyString();
        if (bytes(description).length == 0) revert EmptyString();
        if (bytes(logoCID).length == 0) revert EmptyString();

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
        if (msg.sender != jobs[id].employer && !hasRole(ADMIN_ROLE, msg.sender))
            revert Unauthorized();

        if (jobs[id].deleted) revert Deleted();
        if (bytes(orgName).length == 0) revert EmptyString();
        if (bytes(title).length == 0) revert EmptyString();
        if (bytes(description).length == 0) revert EmptyString();
        if (bytes(logoCID).length == 0) revert EmptyString();

        uint256 calculatedEndTime = block.timestamp + 45 days;
        if (calculatedEndTime <= block.timestamp) revert InvalidDuration();

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
        if (msg.sender != jobs[id].employer && !hasRole(ADMIN_ROLE, msg.sender))
            revert Unauthorized();
        if (jobs[id].deleted) revert AlreadyDeleted();
        jobs[id].deleted = true;
    }

    function isJobExpired(uint256 jobId) public view returns (bool) {
        if (jobId == 0 || jobId > totalJobs.current()) revert InvalidJobID();
        return
            jobs[jobId].deleted || block.timestamp > jobs[jobId].expirationTime;
    }

    function checkJobExpiration(uint256 jobId) public {
        if (jobId == 0 || jobId > totalJobs.current()) revert InvalidJobID();
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
        if (
            !hasRole(ADMIN_ROLE, msg.sender) &&
            !hasRole(EMPLOYER_ROLE, msg.sender)
        ) revert Unauthorized();
        if (jobs[jobId].deleted) revert Deleted();
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
        if (isJobExpired(jobId)) revert Expired();
        if (!jobs[jobId].isOpen) revert Closed();

        if (bytes(name).length == 0) revert EmptyString();
        if (bytes(email).length == 0) revert EmptyString();
        if (bytes(cvCID).length == 0) revert EmptyString();

        JobStruct memory job = jobs[jobId];
        if (fieldResponses.length != job.customField.length)
            revert IncompleteFields();
        for (uint i = 0; i < job.customField.length; i++) {
            if (job.customField[i].isRequired) {
                if (bytes(fieldResponses[i]).length == 0)
                    revert RequiredFieldEmpty();
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

        if (applicationStates[jobId][applicant] != ApplicationState.PENDING)
            revert AlreadyApplied();

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
        if (jobs[jobId].id == 0 || jobs[jobId].deleted) revert InvalidJob();
        if (
            !hasRole(ADMIN_ROLE, msg.sender) &&
            !hasRole(EMPLOYER_ROLE, msg.sender)
        ) revert Unauthorized();

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
        if (!applicantFound) revert ApplicantNotFound();
    }

    function closeJob(uint256 jobId) public {
        if (
            !hasRole(ADMIN_ROLE, msg.sender) &&
            !hasRole(EMPLOYER_ROLE, msg.sender)
        ) revert Unauthorized();
        jobs[jobId].isOpen = false;
    }

    function getJob(uint256 jobId) public view returns (JobStruct memory) {
        if (isJobExpired(jobId)) revert Expired();
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
        if (
            !hasRole(ADMIN_ROLE, msg.sender) &&
            !hasRole(EMPLOYER_ROLE, msg.sender)
        ) revert Unauthorized();
        if (jobs[jobId].id == 0 || jobs[jobId].deleted)
            revert JobDoesNotExist();
        if (applicantIndex >= jobApplications[jobId].length)
            revert InvalidIndex();
        return jobApplications[jobId][applicantIndex];
    }

    function getJobApplicationCount(
        uint256 jobId
    ) public view returns (uint256) {
        if (
            !hasRole(ADMIN_ROLE, msg.sender) &&
            !hasRole(EMPLOYER_ROLE, msg.sender)
        ) revert Unauthorized();
        return jobApplications[jobId].length;
    }

    function getJobApplications(
        uint256 jobId
    ) public view returns (ApplicationStruct[] memory) {
        if (
            !hasRole(ADMIN_ROLE, msg.sender) &&
            !hasRole(EMPLOYER_ROLE, msg.sender)
        ) revert Unauthorized();
        return jobApplications[jobId];
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientFunds();
        payable(owner()).transfer(balance);
    }
}
