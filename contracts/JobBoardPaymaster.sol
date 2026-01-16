// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.28 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./JobBoardUpgradeable.sol";

contract JobBoardPaymaster is Ownable, EIP712 {
    using ECDSA for bytes32;

    JobBoardUpgradeable public immutable jobBoard;

    bytes32 public constant POST_JOB_TYPEHASH =
        keccak256(
            "PostJob(address user,string orgName,string title,string description,string orgEmail,string logoCID,uint256 expirationDays,uint256 nonce)"
        );

    bytes32 public constant SUBMIT_APPLICATION_TYPEHASH =
        keccak256(
            "SubmitApplication(address user,uint256 jobId,string name,string email,string phoneNumber,string location,string cvCID,uint256 nonce)"
        );

    mapping(address => uint256) public nonces;

    mapping(bytes32 => bool) public sponsoredTransactions;

    mapping(address => bool) public whitelistedSponsors;
    mapping(address => bool) public authorizedRelayers;

    mapping(address => uint256) public sponsorGasSpent;

    bool public paymasterEnabled = true;

    event TransactionSponsored(
        address indexed user,
        string operation,
        uint256 gasCost,
        address indexed sponsor
    );

    event SponsorWhitelisted(address indexed sponsor, bool whitelisted);
    event PaymasterToggled(bool enabled);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    constructor(
        address _jobBoard,
        string memory name,
        string memory version
    ) EIP712(name, version) {
        require(_jobBoard != address(0), "Invalid job board address");
        jobBoard = JobBoardUpgradeable(_jobBoard);
        whitelistedSponsors[msg.sender] = true;
    }

    function postJobMeta(
        address user,
        string memory orgName,
        string memory title,
        string memory description,
        string memory orgEmail,
        string memory logoCID,
        string[] memory fieldName,
        bool[] memory isRequired,
        JobBoardUpgradeable.JobType jobType,
        JobBoardUpgradeable.WorkMode workMode,
        string memory minimumSalary,
        string memory maximumSalary,
        uint256 expirationDays,
        bytes memory signature
    ) external returns (uint256) {
        require(paymasterEnabled, "Paymaster is disabled");

        bytes32 hash = _hashPostJob(
            user,
            orgName,
            title,
            description,
            orgEmail,
            logoCID,
            expirationDays,
            nonces[user]
        );
        address signer = hash.recover(signature);
        require(signer == user, "Invalid signature");
        require(!sponsoredTransactions[hash], "Transaction already executed");

        sponsoredTransactions[hash] = true;
        nonces[user]++;

        jobBoard.setSponsoredUser(user);

        uint256 gasStart = gasleft();
        uint256 jobId = jobBoard.postJob{value: 0}(
            orgName,
            title,
            description,
            orgEmail,
            logoCID,
            fieldName,
            isRequired,
            jobType,
            workMode,
            minimumSalary,
            maximumSalary,
            expirationDays
        );
        uint256 gasUsed = gasStart - gasleft();

        sponsorGasSpent[address(this)] += gasUsed;

        emit TransactionSponsored(user, "postJob", gasUsed, address(this));
        return jobId;
    }

    function submitApplicationMeta(
        address user,
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
        string memory github,
        bytes memory signature
    ) external {
        require(paymasterEnabled, "Paymaster is disabled");

        bytes32 hash = _hashSubmitApplication(
            user,
            jobId,
            name,
            email,
            phoneNumber,
            location,
            cvCID,
            nonces[user]
        );
        address signer = hash.recover(signature);
        require(signer == user, "Invalid signature");
        require(!sponsoredTransactions[hash], "Transaction already executed");

        sponsoredTransactions[hash] = true;
        nonces[user]++;

        jobBoard.setSponsoredUser(user);

        uint256 gasStart = gasleft();
        jobBoard.submitApplication(
            jobId,
            name,
            email,
            phoneNumber,
            location,
            fieldResponses,
            cvCID,
            portfolioLink,
            experience,
            expectedSalary,
            github
        );
        uint256 gasUsed = gasStart - gasleft();

        sponsorGasSpent[address(this)] += gasUsed;

        emit TransactionSponsored(
            user,
            "submitApplication",
            gasUsed,
            address(this)
        );
    }

    function sponsorTransaction(address user) external payable {
        require(paymasterEnabled, "Paymaster is disabled");
        require(
            whitelistedSponsors[msg.sender] || msg.sender == owner(),
            "Not authorized to sponsor"
        );
        require(msg.value > 0, "Must send ETH to sponsor");

        (bool success, ) = payable(user).call{value: msg.value}("");
        require(success, "Transfer failed");
    }

    function _hashPostJob(
        address user,
        string memory orgName,
        string memory title,
        string memory description,
        string memory orgEmail,
        string memory logoCID,
        uint256 expirationDays,
        uint256 nonce
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        POST_JOB_TYPEHASH,
                        user,
                        keccak256(bytes(orgName)),
                        keccak256(bytes(title)),
                        keccak256(bytes(description)),
                        keccak256(bytes(orgEmail)),
                        keccak256(bytes(logoCID)),
                        expirationDays,
                        nonce
                    )
                )
            );
    }

    function _hashSubmitApplication(
        address user,
        uint256 jobId,
        string memory name,
        string memory email,
        string memory phoneNumber,
        string memory location,
        string memory cvCID,
        uint256 nonce
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        SUBMIT_APPLICATION_TYPEHASH,
                        user,
                        jobId,
                        keccak256(bytes(name)),
                        keccak256(bytes(email)),
                        keccak256(bytes(phoneNumber)),
                        keccak256(bytes(location)),
                        keccak256(bytes(cvCID)),
                        nonce
                    )
                )
            );
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function setSponsorWhitelist(
        address sponsor,
        bool whitelisted
    ) external onlyOwner {
        whitelistedSponsors[sponsor] = whitelisted;
        emit SponsorWhitelisted(sponsor, whitelisted);
    }

    function setPaymasterEnabled(bool enabled) external onlyOwner {
        paymasterEnabled = enabled;
        emit PaymasterToggled(enabled);
    }

    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
        emit FundsWithdrawn(owner(), amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getSponsorGasSpent(
        address sponsor
    ) external view returns (uint256) {
        return sponsorGasSpent[sponsor];
    }

    function reimburseRelayer(
        address relayer,
        uint256 gasUsed,
        uint256 gasPrice
    ) external {
        require(
            authorizedRelayers[msg.sender] || 
            whitelistedSponsors[msg.sender] || 
            msg.sender == owner(),
            "Not authorized"
        );

        uint256 reimbursement = gasUsed * gasPrice;
        require(address(this).balance >= reimbursement, "Insufficient paymaster balance");

        (bool success, ) = payable(relayer).call{value: reimbursement}("");
        require(success, "Reimbursement failed");

        sponsorGasSpent[address(this)] += gasUsed;
    }

    function setAuthorizedRelayer(
        address relayerContract,
        bool authorized
    ) external onlyOwner {
        authorizedRelayers[relayerContract] = authorized;
        emit SponsorWhitelisted(relayerContract, authorized);
    }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
