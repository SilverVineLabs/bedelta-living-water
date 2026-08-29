// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {SliverVineGate} from "../../../SliverVineGate/src/SliverVineGate.sol";
import {ISliverVineGate} from "../../../SliverVineGate/src/interfaces/ISliverVineGate.sol";

/**
 * @title HalmosGateInvariant
 * @notice Halmos symbolic-execution contract — replay / single-use digest invariant (I6).
 *
 * SYMBOLIC PROOF SKETCH (∀ digest d):
 *   Let consume(d) be a successful call to verifyAndConsume producing digest d.
 *   Post-state: consumed[d] = true                    (effects-before-interactions, L234)
 *   ∀ subsequent call with same attestation digest d:
 *     _validate returns Replayed.selector              (L286: consumed[d] ⇒ replay)
 *     verifyAndConsume reverts                         (L232: reason ≠ 0 ⇒ revert)
 *
 *   Halmos explores all symbolic (payloadHash, nonce, riskBps, …) that satisfy the
 *   acceptance region; the check_* functions below encode the safety lemmas.
 */
contract HalmosGateInvariant is Test {
    SliverVineGate internal gate;

    uint256[] internal pk;
    address internal subject;

    function setUp() public {
        uint256[] memory keys = new uint256[](3);
        keys[0] = 0xA11CE;
        keys[1] = 0xB0B;
        keys[2] = 0xCA401;
        _sortByAddress(keys);

        address[] memory signers = new address[](3);
        pk = new uint256[](3);
        for (uint256 i; i < 3; ++i) {
            signers[i] = vm.addr(keys[i]);
            pk[i] = keys[i];
        }

        gate = new SliverVineGate(signers, 2, makeAddr("guardian"), makeAddr("admin"));
        subject = makeAddr("subject");
        vm.warp(1_800_000_000);
    }

    /**
     * @notice Halmos `check_*` — Lemma I6a: successful consume ⇒ consumed[digest] == true.
     * @dev Symbolic inputs: payloadHash, nonce, riskBps (bounded to valid region).
     */
    function check_consume_sets_consumed_flag(
        bytes32 payloadHash,
        uint256 nonce,
        uint16 riskBps
    ) public {
        riskBps = uint16(bound(riskBps, 0, 10_000));

        ISliverVineGate.RiskAttestation memory att = _attestation(payloadHash, nonce, riskBps);
        bytes[] memory sigs = _sign(att, 2);

        vm.prank(subject);
        bytes32 digest = gate.verifyAndConsume(att, sigs);

        assertTrue(gate.consumed(digest), "HALMOS: consumed[digest] must be true after consume");
        assertEq(digest, gate.hashAttestation(att), "HALMOS: returned digest must match EIP-712 hash");
    }

    /**
     * @notice Halmos `check_*` — Lemma I6b: second consume with identical digest MUST revert Replayed.
     * @dev ∀ symbolic digest d: consume(d) once ⇒ ¬consume(d) again.
     */
    function check_replay_must_revert(bytes32 payloadHash, uint256 nonce, uint16 riskBps) public {
        riskBps = uint16(bound(riskBps, 0, 10_000));

        ISliverVineGate.RiskAttestation memory att = _attestation(payloadHash, nonce, riskBps);
        bytes[] memory sigs = _sign(att, 2);

        vm.startPrank(subject);
        gate.verifyAndConsume(att, sigs);
        vm.expectRevert(SliverVineGate.Replayed.selector);
        gate.verifyAndConsume(att, sigs);
        vm.stopPrank();
    }

    /**
     * @notice Halmos `property_*` — combined invariant: consume once ⇔ consumed forever + replay denied.
     */
    function property_single_use_digest(bytes32 payloadHash, uint256 nonce) public {
        ISliverVineGate.RiskAttestation memory att = _attestation(payloadHash, nonce, 500);
        bytes[] memory sigs = _sign(att, 2);
        bytes32 digest = gate.hashAttestation(att);

        assertFalse(gate.consumed(digest), "pre: digest must be fresh");

        vm.prank(subject);
        bytes32 returned = gate.verifyAndConsume(att, sigs);
        assertTrue(gate.consumed(returned), "post-consume: flag must be set");

        vm.prank(subject);
        vm.expectRevert(SliverVineGate.Replayed.selector);
        gate.verifyAndConsume(att, sigs);
    }

    /**
     * @notice Forge regression (non-symbolic) — documents the same proof for CI without Halmos CLI.
     */
    function test_regression_replay_invariant_concrete() public {
        bytes32 payloadHash = keccak256("halmos-concrete-payload");
        check_replay_must_revert(payloadHash, 0xBEEF, 1200);
    }

  /* ------------------------------ internals ------------------------------ */

    function _attestation(bytes32 payloadHash, uint256 nonce, uint16 riskBps)
        internal
        view
        returns (ISliverVineGate.RiskAttestation memory att)
    {
        att = ISliverVineGate.RiskAttestation({
            payloadHash: payloadHash,
            subject: subject,
            verdict: 1,
            riskBps: riskBps,
            issuedAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp) + 20,
            nonce: nonce
        });
    }

    function _sign(ISliverVineGate.RiskAttestation memory att, uint256 count)
        internal
        returns (bytes[] memory sigs)
    {
        bytes32 digest = gate.hashAttestation(att);
        sigs = new bytes[](count);
        for (uint256 i; i < count; ++i) {
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk[i], digest);
            sigs[i] = abi.encodePacked(r, s, v);
        }
    }

    function _sortByAddress(uint256[] memory keys) internal {
        for (uint256 i = 1; i < keys.length; ++i) {
            uint256 k = keys[i];
            uint256 j = i;
            while (j > 0 && vm.addr(keys[j - 1]) > vm.addr(k)) {
                keys[j] = keys[j - 1];
                --j;
            }
            keys[j] = k;
        }
    }
}
