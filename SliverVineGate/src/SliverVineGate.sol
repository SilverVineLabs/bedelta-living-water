// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.28;

import {ISliverVineGate} from "./interfaces/ISliverVineGate.sol";

/**
 * @title  SliverVineGate
 * @author SliverVine Labs — BeΔLivingWater / Citadel
 * @notice On-chain enforcement anchor for the off-chain SliverVine Citadel risk engine.
 *
 * @dev DESIGN CONTRACT (read before changing anything)
 *
 *  1. The gate never computes risk. The off-chain Citadel engine remains the single source of
 *     truth. The gate's only job is to make "bypass the engine" unreachable on-chain.
 *
 *  2. Fail-closed by construction. There is no code path that executes on a missing, stale,
 *     malformed, replayed or non-ALLOW attestation. `halted` denies everything.
 *
 *  3. No oracle reads. Sequencer uptime, oracle lag and price impact are observed off-chain and
 *     sealed into the signature. This is deliberate: Arbitrum Orbit chains (e.g. Robinhood Chain)
 *     have no Chainlink feeds, so an on-chain feed dependency would make the gate undeployable
 *     there. The attestation model keeps one implementation valid across every Arbitrum chain.
 *
 *  4. Immutable. No proxy, no `delegatecall`, no upgrade path, no ETH custody. A new version is a
 *     new address. This removes the entire proxy/storage-collision vulnerability class.
 *
 *  5. Time uses `block.timestamp` only. On Arbitrum `block.number` returns an approximation of the
 *     *L1* block height (L2 height is `ArbSys(0x64).arbBlockNumber()`), so block-count logic is a
 *     silent footgun. `block.timestamp` is sequencer-set with bounded drift, which MAX_FUTURE_SKEW
 *     tolerates explicitly.
 *
 *  6. Asymmetric authority. Tightening (halt) is immediate. Loosening (unhalt, adding a signer,
 *     lowering the threshold) is timelocked. A stolen guardian key can only stop the system —
 *     which is the safe direction.
 *
 *  7. MAX_TTL = 30s mirrors the engine's 30-second Oracle Lag Shield. It also means that after a
 *     sequencer outage every pre-outage attestation is already dead, so recovery cannot be flooded
 *     with stale authorisations.
 *
 * @dev ECDSA is implemented inline rather than imported. For a ~200-line safety-critical contract,
 *      zero third-party dependencies is a smaller total attack surface than one library import.
 *      Semantics intentionally match OpenZeppelin `ECDSA.tryRecover`: strict 65-byte encoding,
 *      v in {27,28} (no normalisation), and s <= secp256k1n/2 to reject malleable signatures.
 */
contract SliverVineGate is ISliverVineGate {
    /* ---------------------------------------------------------------------- */
    /*                                 ERRORS                                 */
    /* ---------------------------------------------------------------------- */

    // --- validation (returned as reason codes by `checkAttestation`) ---
    error Halted(); // I1
    error Denied(); // I2
    error Expired(); // I3
    error TtlTooLong(); // I4
    error FutureDated(); // I5
    error Replayed(); // I6
    error InsufficientSigners(); // I7a
    error SignersNotSorted(); // I7b — also the duplicate-signer guard
    error UnknownSigner(); // I7c
    error InvalidSignature(); // I7d — malformed, malleable, or unrecoverable
    error WrongSubject(); // I8
    error RiskBpsOutOfRange(); // I10
    error ExpiryBeforeIssuance(); // I11
    error TooManySignatures(); // I12

    // --- configuration / authority ---
    error NotGuardian();
    error NotAdmin();
    error NotPendingAdmin();
    error ZeroAddress();
    error ThresholdOutOfRange();
    error SignerAlreadyPresent();
    error SignerAbsent();
    error InitialSignersNotSorted();
    error NoPendingChange();
    error ChangeAlreadyPending();
    error TimelockNotElapsed();
    error NotHalted();
    error AlreadyHalted();
    error UnhaltNotScheduled();

    /* ---------------------------------------------------------------------- */
    /*                                CONSTANTS                               */
    /* ---------------------------------------------------------------------- */

    /// @notice ALLOW is the only accepted verdict. Any other value denies.
    uint8 public constant VERDICT_ALLOW = 1;

    /// @notice Maximum attestation lifetime. Mirrors the engine's 30s Oracle Lag Shield.
    uint64 public constant MAX_TTL = 30;

    /// @notice Tolerated forward clock skew of the sequencer relative to the engine.
    uint64 public constant MAX_FUTURE_SKEW = 2;

    /// @notice Upper bound on signatures per call. Bounds the verification loop.
    uint256 public constant MAX_SIGNATURES = 16;

    /// @notice Delay before a scheduled unhalt can execute (loosening ⇒ timelocked).
    uint64 public constant UNHALT_DELAY = 1 hours;

    /// @notice Delay before a proposed signer-set change can execute.
    uint64 public constant SIGNER_TIMELOCK = 24 hours;

    /// @dev secp256k1 order / 2. Signatures with s above this are malleable and rejected.
    uint256 private constant _HALF_N = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    bytes32 private constant _EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    bytes32 public constant ATTESTATION_TYPEHASH = keccak256(
        "RiskAttestation(bytes32 payloadHash,address subject,uint8 verdict,uint16 riskBps,uint64 issuedAt,uint64 expiresAt,uint256 nonce)"
    );

    bytes32 private constant _NAME_HASH = keccak256("SliverVineCitadel");
    bytes32 private constant _VERSION_HASH = keccak256("1");

    /* ---------------------------------------------------------------------- */
    /*                                 STORAGE                                */
    /* ---------------------------------------------------------------------- */

    /// @notice Consumed EIP-712 digests. Single-use enforcement (I6).
    mapping(bytes32 => bool) public consumed;

    /// @notice Authorised Citadel signing keys.
    mapping(address => bool) public isSigner;

    uint8 public signerCount;

    /// @notice Number of distinct signers required (m-of-n).
    uint8 public threshold;

    /// @notice When true every consumption reverts.
    bool public halted;

    /// @notice May halt at any time. Cannot loosen anything.
    address public guardian;

    /// @notice May schedule loosening actions. All of them are timelocked.
    address public admin;

    address public pendingAdmin;

    /// @notice Earliest timestamp at which `executeUnhalt` may run. 0 = not scheduled.
    uint64 public unhaltEta;

    struct PendingSignerChange {
        address signer;
        bool add;
        uint8 newThreshold;
        uint64 eta;
    }

    /// @notice At most one pending signer-set change. Deliberate: one thing to audit at a time.
    PendingSignerChange public pendingChange;

    /* ---------------------------------------------------------------------- */
    /*                            CACHED EIP-712                              */
    /* ---------------------------------------------------------------------- */

    bytes32 private immutable _cachedDomainSeparator;
    uint256 private immutable _cachedChainId;
    address private immutable _cachedThis;

    /* ---------------------------------------------------------------------- */
    /*                                 EVENTS                                 */
    /* ---------------------------------------------------------------------- */

    event AttestationConsumed(
        bytes32 indexed digest, address indexed subject, bytes32 payloadHash, uint16 riskBps, uint256 nonce
    );
    event GateHalted(address indexed by);
    event UnhaltScheduled(address indexed by, uint64 eta);
    event GateUnhalted(address indexed by);
    event SignerChangeProposed(address indexed signer, bool add, uint8 newThreshold, uint64 eta);
    event SignerChangeExecuted(address indexed signer, bool add, uint8 newThreshold);
    event SignerChangeCancelled(address indexed signer, bool add);
    event AdminTransferProposed(address indexed from, address indexed to);
    event AdminTransferred(address indexed from, address indexed to);
    event GuardianChanged(address indexed from, address indexed to);

    /* ---------------------------------------------------------------------- */
    /*                              CONSTRUCTOR                               */
    /* ---------------------------------------------------------------------- */

    /// @param initialSigners Strictly ascending, non-zero, unique. Ascending order is enforced so
    ///        that duplicates are impossible to smuggle in at deployment.
    constructor(address[] memory initialSigners, uint8 initialThreshold, address guardian_, address admin_) {
        if (guardian_ == address(0) || admin_ == address(0)) revert ZeroAddress();

        uint256 n = initialSigners.length;
        // Bounded so that the verification loop is bounded and the uint8 cast below is provably safe.
        if (n == 0 || n > MAX_SIGNATURES) revert ThresholdOutOfRange();

        address last = address(0);
        for (uint256 i; i < n; ++i) {
            address s = initialSigners[i];
            if (s == address(0)) revert ZeroAddress();
            if (s <= last) revert InitialSignersNotSorted();
            last = s;
            isSigner[s] = true;
        }
        if (initialThreshold == 0 || initialThreshold > n) revert ThresholdOutOfRange();

        // casting to 'uint8' is safe because n <= MAX_SIGNATURES (16), checked above
        // forge-lint: disable-next-line(unsafe-typecast)
        signerCount = uint8(n);
        threshold = initialThreshold;
        guardian = guardian_;
        admin = admin_;

        _cachedChainId = block.chainid;
        _cachedThis = address(this);
        _cachedDomainSeparator = _buildDomainSeparator();
    }

    /* ---------------------------------------------------------------------- */
    /*                             CORE: CONSUME                              */
    /* ---------------------------------------------------------------------- */

    /**
     * @notice Validate and permanently consume an attestation.
     * @dev The digest is marked consumed BEFORE this function returns and therefore before any
     *      caller-side external interaction (checks-effects-interactions). Without that ordering a
     *      re-entrant executor could reuse a live attestation within one transaction.
     */
    function verifyAndConsume(RiskAttestation calldata att, bytes[] calldata signatures)
        external
        returns (bytes32 digest)
    {
        bytes4 reason;
        (reason, digest) = _validate(att, signatures, msg.sender);
        if (reason != bytes4(0)) _revertWith(reason);

        consumed[digest] = true; // I9
        emit AttestationConsumed(digest, att.subject, att.payloadHash, att.riskBps, att.nonce);
    }

    /// @inheritdoc ISliverVineGate
    function checkAttestation(RiskAttestation calldata att, bytes[] calldata signatures, address caller)
        external
        view
        returns (bytes4 reason)
    {
        (reason,) = _validate(att, signatures, caller);
    }

    /// @inheritdoc ISliverVineGate
    function hashAttestation(RiskAttestation calldata att) public view returns (bytes32) {
        return keccak256(abi.encodePacked(hex"1901", _domainSeparator(), _structHash(att)));
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparator();
    }

    /* ---------------------------------------------------------------------- */
    /*                            VALIDATION CORE                             */
    /* ---------------------------------------------------------------------- */

    /// @dev Single validation path shared by the mutating and view entry points, so a dry run can
    ///      never disagree with the real thing. Ordered cheapest-first; every branch denies.
    function _validate(RiskAttestation calldata att, bytes[] calldata signatures, address caller)
        private
        view
        returns (bytes4 reason, bytes32 digest)
    {
        if (halted) return (Halted.selector, bytes32(0)); // I1
        if (caller != att.subject) return (WrongSubject.selector, bytes32(0)); // I8
        if (att.verdict != VERDICT_ALLOW) return (Denied.selector, bytes32(0)); // I2
        if (att.riskBps > 1e4) return (RiskBpsOutOfRange.selector, bytes32(0)); // I10
        if (att.expiresAt <= att.issuedAt) return (ExpiryBeforeIssuance.selector, bytes32(0)); // I11
        if (att.expiresAt - att.issuedAt > MAX_TTL) return (TtlTooLong.selector, bytes32(0)); // I4
        // Sequencer-set timestamps are the correct clock here: MAX_FUTURE_SKEW bounds forward drift
        // and MAX_TTL (30s) bounds the exposure window, so second-level manipulation cannot widen
        // the authorisation beyond what the engine already sealed.
        // forge-lint: disable-next-line(block-timestamp)
        if (att.issuedAt > block.timestamp + MAX_FUTURE_SKEW) return (FutureDated.selector, bytes32(0)); // I5
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp > att.expiresAt) return (Expired.selector, bytes32(0)); // I3

        uint256 count = signatures.length;
        if (count > MAX_SIGNATURES) return (TooManySignatures.selector, bytes32(0)); // I12
        if (count < threshold) return (InsufficientSigners.selector, bytes32(0)); // I7a

        digest = hashAttestation(att);
        if (consumed[digest]) return (Replayed.selector, digest); // I6

        // I7b/c/d — strictly ascending recovered addresses make duplicate signers unrepresentable,
        // so the classic "one key signs m times to satisfy m-of-n" bypass cannot be expressed.
        address last = address(0);
        for (uint256 i; i < count; ++i) {
            address rec = _recover(digest, signatures[i]);
            if (rec == address(0)) return (InvalidSignature.selector, digest);
            if (rec <= last) return (SignersNotSorted.selector, digest);
            if (!isSigner[rec]) return (UnknownSigner.selector, digest);
            last = rec;
        }

        return (bytes4(0), digest);
    }

    /* ---------------------------------------------------------------------- */
    /*                          AUTHORITY: TIGHTENING                         */
    /* ---------------------------------------------------------------------- */

    /// @notice Immediate kill switch. Intentionally the only un-timelocked authority in the gate.
    function halt() external {
        if (msg.sender != guardian && msg.sender != admin) revert NotGuardian();
        if (halted) revert AlreadyHalted();
        halted = true;
        unhaltEta = 0; // any in-flight unhalt schedule is voided
        emit GateHalted(msg.sender);
    }

    /// @notice Guardian may cancel a pending loosening proposal without waiting.
    function cancelSignerChange() external {
        if (msg.sender != guardian && msg.sender != admin) revert NotGuardian();
        PendingSignerChange memory p = pendingChange;
        if (p.eta == 0) revert NoPendingChange();
        delete pendingChange;
        emit SignerChangeCancelled(p.signer, p.add);
    }

    /* ---------------------------------------------------------------------- */
    /*                          AUTHORITY: LOOSENING                          */
    /* ---------------------------------------------------------------------- */

    function scheduleUnhalt() external onlyAdmin {
        if (!halted) revert NotHalted();
        unhaltEta = uint64(block.timestamp) + UNHALT_DELAY;
        emit UnhaltScheduled(msg.sender, unhaltEta);
    }

    function executeUnhalt() external onlyAdmin {
        if (!halted) revert NotHalted();
        uint64 eta = unhaltEta;
        if (eta == 0) revert UnhaltNotScheduled();
        // Hour-scale timelock; second-level drift is immaterial.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < eta) revert TimelockNotElapsed();
        halted = false;
        unhaltEta = 0;
        emit GateUnhalted(msg.sender);
    }

    /// @notice Propose adding or removing a signing key, together with the resulting threshold.
    /// @dev Both directions are timelocked. Removing a signer looks like tightening but can be used
    ///      to strand the engine, so it gets the same delay as adding one.
    function proposeSignerChange(address signer, bool add, uint8 newThreshold) external onlyAdmin {
        if (signer == address(0)) revert ZeroAddress();
        if (pendingChange.eta != 0) revert ChangeAlreadyPending();
        if (add && isSigner[signer]) revert SignerAlreadyPresent();
        if (!add && !isSigner[signer]) revert SignerAbsent();

        uint256 resulting = add ? signerCount + 1 : signerCount - 1;
        if (newThreshold == 0 || newThreshold > resulting) revert ThresholdOutOfRange();

        uint64 eta = uint64(block.timestamp) + SIGNER_TIMELOCK;
        pendingChange = PendingSignerChange(signer, add, newThreshold, eta);
        emit SignerChangeProposed(signer, add, newThreshold, eta);
    }

    function executeSignerChange() external onlyAdmin {
        PendingSignerChange memory p = pendingChange;
        if (p.eta == 0) revert NoPendingChange();
        // Day-scale timelock; second-level drift is immaterial.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < p.eta) revert TimelockNotElapsed();

        // Re-validate against current state: the set may have moved since the proposal.
        if (p.add && isSigner[p.signer]) revert SignerAlreadyPresent();
        if (!p.add && !isSigner[p.signer]) revert SignerAbsent();

        uint8 resulting = p.add ? signerCount + 1 : signerCount - 1;
        if (p.newThreshold == 0 || p.newThreshold > resulting) revert ThresholdOutOfRange();

        isSigner[p.signer] = p.add;
        signerCount = resulting;
        threshold = p.newThreshold;
        delete pendingChange;

        emit SignerChangeExecuted(p.signer, p.add, p.newThreshold);
    }

    /* ---------------------------------------------------------------------- */
    /*                            ROLE HANDOVER                               */
    /* ---------------------------------------------------------------------- */

    /// @dev Pull pattern: the proposal alone changes nothing, so a typo cannot brick the role.
    function proposeAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        pendingAdmin = newAdmin;
        emit AdminTransferProposed(admin, newAdmin);
    }

    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();
        address prev = admin;
        admin = msg.sender;
        pendingAdmin = address(0);
        emit AdminTransferred(prev, msg.sender);
    }

    function setGuardian(address newGuardian) external onlyAdmin {
        if (newGuardian == address(0)) revert ZeroAddress();
        address prev = guardian;
        guardian = newGuardian;
        emit GuardianChanged(prev, newGuardian);
    }

    /* ---------------------------------------------------------------------- */
    /*                                INTERNALS                               */
    /* ---------------------------------------------------------------------- */

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    function _structHash(RiskAttestation calldata att) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                ATTESTATION_TYPEHASH,
                att.payloadHash,
                att.subject,
                att.verdict,
                att.riskBps,
                att.issuedAt,
                att.expiresAt,
                att.nonce
            )
        );
    }

    /// @dev Rebuilt when chainId changes so that a post-fork chain cannot inherit signatures.
    function _domainSeparator() private view returns (bytes32) {
        if (block.chainid == _cachedChainId && address(this) == _cachedThis) {
            return _cachedDomainSeparator;
        }
        return _buildDomainSeparator();
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return keccak256(abi.encode(_EIP712_DOMAIN_TYPEHASH, _NAME_HASH, _VERSION_HASH, block.chainid, address(this)));
    }

    /// @dev Strict ECDSA recovery. Returns address(0) on any malformed or malleable input rather
    ///      than reverting, so `_validate` owns every failure path and reason code.
    function _recover(bytes32 digest, bytes calldata sig) private pure returns (address) {
        if (sig.length != 65) return address(0);

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }

        // No v normalisation: 0/1 encodings are rejected outright to keep one canonical form.
        if (v != 27 && v != 28) return address(0);
        if (uint256(s) > _HALF_N || uint256(s) == 0) return address(0);
        if (uint256(r) == 0) return address(0);

        return ecrecover(digest, v, r, s);
    }

    /// @dev Reverts with a 4-byte selector produced at runtime, letting the view and mutating paths
    ///      share `_validate` while still surfacing typed errors to callers.
    function _revertWith(bytes4 reason) private pure {
        assembly {
            mstore(0x00, reason)
            revert(0x00, 0x04)
        }
    }
}
