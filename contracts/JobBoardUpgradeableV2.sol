// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.28 <0.9.0;

import "./JobBoardUpgradeable.sol";

contract JobBoardUpgradeableV2 is JobBoardUpgradeable {
    uint256 public versionNumber;

    function version() external pure returns (uint256) {
        return 2;
    }

    function setVersionNumber(uint256 _versionNumber) external onlyOwner {
        versionNumber = _versionNumber;
    }
}
