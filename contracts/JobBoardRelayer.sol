// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.28 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./JobBoardPaymaster.sol";

contract JobBoardRelayer is Ownable, EIP712 {
    using ECDSA for bytes32;

    JobBoardPaymaster public immutable paymaster;

    bytes32 public constant RELAY_REQUEST_TYPEHASH =
        keccak256(
            "RelayRequest(address user,bytes data,uint256 nonce,uint256 deadline)"
        );

    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public executedRequests;

    event RequestExecuted(
        address indexed user,
        bytes32 indexed requestHash,
        bool success
    );

    constructor(
        address _paymaster,
        string memory name,
        string memory version
    ) EIP712(name, version) {
        require(_paymaster != address(0), "Invalid paymaster address");
        paymaster = JobBoardPaymaster(payable(_paymaster));
    }

    function executeRelay(
        address user,
        bytes calldata data,
        uint256 deadline,
        bytes memory signature
    ) external returns (bool) {
        require(block.timestamp <= deadline, "Request expired");

        bytes32 requestHash = _hashRelayRequest(
            user,
            data,
            nonces[user],
            deadline
        );

        require(!executedRequests[requestHash], "Request already executed");
        require(requestHash.recover(signature) == user, "Invalid signature");

        executedRequests[requestHash] = true;
        nonces[user]++;

        uint256 gasStart = gasleft();
        (bool success, bytes memory returnData) = address(paymaster).call(data);
        uint256 gasUsed = gasStart - gasleft() + 21000;

        emit RequestExecuted(user, requestHash, success);

        if (!success) {
            if (returnData.length > 0) {
                assembly {
                    let returndata_size := mload(returnData)
                    revert(add(32, returnData), returndata_size)
                }
            } else {
                revert("Relay execution failed");
            }
        }

        try
            paymaster.reimburseRelayer(msg.sender, gasUsed, tx.gasprice)
        {} catch {}

        return success;
    }

    function _hashRelayRequest(
        address user,
        bytes calldata data,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        RELAY_REQUEST_TYPEHASH,
                        user,
                        keccak256(data),
                        nonce,
                        deadline
                    )
                )
            );
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
