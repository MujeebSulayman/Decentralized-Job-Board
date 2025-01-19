// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >= 0.8.28 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import "hardhat/console.sol";

contract JobBoard is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private totalJobs;
    Counters.Counter private totalApplications;

    uint256 public serviceFee;

    constructor(uint256 _serviceFee) {
        require(_serviceFee > 0, "Service fee must be greater than 0");
        serviceFee = _serviceFee;
    }

    mapping(uint256 => JobStruct) public jobs;
    mapping(uint256 => ApplicationStruct[]) jobApplications;
    mapping(address => uint256[]) public employerJobs;

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

    enum WorkMode {
        remote,
        onsite,
        hybrid
    }

    enum JobType {
        fullTime,
        partTime,
        internship,
        freelance,
        contractType
    }

    enum ApplicationState {
        Submitted,
        Reviewed,
        EmailSent,
        Closed
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
        WorkMode workMode;
        JobType jobType;
        string minimumSalary;
        string maximumSalary;
        uint256 applicationTimestamp;
        ApplicationState currentState;
    }

    mapping(uint256 => mapping(address => ApplicationState))
        public applicationStates;

    event ApplicationStateChanged(
        uint256 indexed jobId,
        address indexed applicant,
        ApplicationState newState
    );

    function updateServiceFee(uint256 _newFee) public onlyOwner {
        uint256 oldFee = serviceFee;
        serviceFee = _newFee;
        emit ServiceFeeUpdated(oldFee, _newFee);
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
        string memory maximumSalary
    ) public payable nonReentrant {
        require(msg.value >= serviceFee, "Insufficient fund");
        require(bytes(orgName).length > 0, "Organisation name cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(logoCID).length > 0, "Logo cannot be empty");
        uint256 calculatedEndTime = block.timestamp + 45 days;
        require(calculatedEndTime > block.timestamp, "Invalid job duration");

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
            employer: msg.sender,
            title: title,
            orgName: orgName,
            description: description,
            orgEmail: orgEmail,
            customField: customField,
            logoCID: logoCID,
            isOpen: true,
            deleted: false,
            startTime: block.timestamp,
            endTime: calculatedEndTime,
            jobType: jobType,
            workMode: workMode,
            minimumSalary: minimumSalary,
            maximumSalary: maximumSalary
        });

        employerJobs[msg.sender].push(currentJobId);

        emit JobPosted(currentJobId, msg.sender, title, orgName);
    }

    function editJob(
        uint256 id,
        string memory orgName,
        string memory title,
        string memory description,
        string memory logoCID,
        string[] memory fieldName,
        bool[] memory isRequired,
        bool isOpen,
        JobType jobType,
        WorkMode workMode,
        string memory minimumSalary,
        string memory maximumSalary
    ) public {
        require(!jobs[id].deleted, "Job has been deleted");
        require(
            jobs[id].employer == msg.sender || owner() == msg.sender,
            "Only employer or contract owner can edit this job"
        );
        require(bytes(orgName).length > 0, "Organisation name cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(logoCID).length > 0, "Logo cannot be empty");

        uint256 calculatedEndTime = block.timestamp + 45 days;
        require(calculatedEndTime > block.timestamp, "Invalid job duration");

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
            jobs[id].employer == msg.sender || owner() == msg.sender,
            "Only employer or contract owner can delete this job"
        );
        require(!jobs[id].deleted, "Job has already been deleted");

        jobs[id].deleted = true;
    }

    function applyForJob(
        uint256 jobId,
        string memory name,
        string memory email,
        string memory phoneNumber,
        string memory location,
        string memory cvCID,
        string[] memory fieldResponses
    ) public nonReentrant {
        require(!jobs[jobId].deleted, "Job has been deleted");
        require(jobs[jobId].isOpen, "Job is no longer accepting applications");

        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(email).length > 0, "Email cannot be empty");
        require(bytes(cvCID).length > 0, "CV is required");

        JobStruct memory job = jobs[jobId];
        require(
            fieldResponses.length == job.customField.length,
            "Incomplete custom field responses"
        );
        for (uint i = 0; i < job.customField.length; i++) {
            if (job.customField[i].isRequired) {
                require(
                    bytes(fieldResponses[i]).length > 0,
                    "Required field cannot be empty"
                );
            }
        }

        require(
            applicationStates[jobId][msg.sender] == ApplicationState.Submitted,
            "You have already applied to this job"
        );

        totalApplications.increment();

        ApplicationStruct memory newApplication = ApplicationStruct({
            jobId: jobId,
            applicant: msg.sender,
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            location: location,
            fieldResponse: fieldResponses,
            cvCID: cvCID,
            workMode: job.workMode,
            jobType: job.jobType,
            minimumSalary: job.minimumSalary,
            maximumSalary: job.maximumSalary,
            applicationTimestamp: block.timestamp,
            currentState: ApplicationState.Submitted
        });

        jobApplications[jobId].push(newApplication);

        applicationStates[jobId][msg.sender] = ApplicationState.Submitted;

        emit ApplicationSubmitted(jobId, msg.sender, name, job.workMode, email);
    }

    function updateApplicationStatus(
        uint256 jobId,
        address applicant,
        ApplicationState newState
    ) public {
        require(jobs[jobId].id > 0 && !jobs[jobId].deleted, "Invalid job");

        require(
            jobs[jobId].employer == msg.sender || owner() == msg.sender,
            "Only job employer or contract owner can update application status"
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
        require(applicantFound, "Applicant not found for this job");
    }

    function closeJob(uint256 jobId) public {
        require(
            jobs[jobId].employer == msg.sender || owner() == msg.sender,
            "Only employer or owner can close the job"
        );

        jobs[jobId].isOpen = false;
    }

    function getJobDetails(
        uint256 jobId
    ) public view returns (JobStruct memory) {
        require(jobs[jobId].deleted == false, "Job does not exist");
        return jobs[jobId];
    }

    function getAllJobs() public view returns (JobStruct[] memory) {
        uint256 allAvailableJobs = 0;
        for (uint i = 1; i <= totalJobs.current(); i++) {
            if (!jobs[i].deleted) {
                allAvailableJobs++;
            }
        }

        JobStruct[] memory availableJobs = new JobStruct[](allAvailableJobs);
        uint256 index = 0;
        for (uint i = 1; i <= totalJobs.current(); i++) {
            if (!jobs[i].deleted) {
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
            jobs[jobId].id != 0 && !jobs[jobId].deleted,
            "Job does not exist"
        );
        require(
            applicantIndex < jobApplications[jobId].length,
            "Invalid applicant index"
        );
        return jobApplications[jobId][applicantIndex];
    }

    function getJobApplicationCount(
        uint256 jobId
    ) public view returns (uint256) {
        require(
            jobs[jobId].employer == msg.sender || owner() == msg.sender,
            "Only job employer or contract owner can view applications"
        );
        return jobApplications[jobId].length;
    }

    function getJobApplications(
        uint256 jobId
    ) public view returns (ApplicationStruct[] memory) {
        require(
            jobs[jobId].employer == msg.sender || owner() == msg.sender,
            "Only job employer or contract owner can view applications"
        );
        return jobApplications[jobId];
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficient funds");
        payable(owner()).transfer(balance);
    }
}
