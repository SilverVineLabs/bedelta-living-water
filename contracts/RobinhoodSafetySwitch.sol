// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import {SliverVineRiskOracle} from "./SliverVineRiskOracle.sol";

/// @title RobinhoodSafetySwitch — ArbOS 61 compliance filter (oracle flush + institutional blacklist)
contract RobinhoodSafetySwitch {
    SliverVineRiskOracle public immutable riskOracle;
    mapping(address => bool) public institutionalBlacklist;

    bytes32 public constant ERR_SLO_TIMEOUT = keccak256("SLO_TIMEOUT");
    bytes32 public constant ERR_INVALID_SIGNER = keccak256("INVALID_SIGNER");

    event StatusRefreshed(address indexed target, uint256 timestamp);
    event EmergencyJumped(address indexed target, uint8 statusCode, uint256 timestamp);
    event ErrorTriggered(bytes32 indexed code, address indexed actor);

    constructor(address oracle_, address[] memory blacklisted_) {
        require(oracle_ != address(0), "ORACLE_ZERO");
        riskOracle = SliverVineRiskOracle(oracle_);
        uint256 len = blacklisted_.length;
        for (uint256 i; i < len; ++i) {
            require(blacklisted_[i] != address(0), "BLACKLIST_ZERO");
            institutionalBlacklist[blacklisted_[i]] = true;
        }
    }

    function isCompliant(address target) external view returns (bool) {
        if (riskOracle.isSystemFlushed() || riskOracle.statusCode() == riskOracle.STATUS_SHUTDOWN()) {
            return false;
        }
        return !institutionalBlacklist[target];
    }

    function gateAddress(address target) external {
        if (riskOracle.isSystemFlushed() || riskOracle.statusCode() == riskOracle.STATUS_SHUTDOWN()) {
            uint8 code = riskOracle.statusCode();
            emit EmergencyJumped(target, code, block.timestamp);
            emit ErrorTriggered(ERR_SLO_TIMEOUT, target);
            revert("SLO_TIMEOUT");
        }
        if (institutionalBlacklist[target]) {
            emit ErrorTriggered(ERR_INVALID_SIGNER, target);
            revert("BLACKLISTED");
        }
        emit StatusRefreshed(target, block.timestamp);
    }
}
