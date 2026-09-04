# Standard Compliance & ERC/EIP Wiki

> **Document:** SliverVine Citadel Shield — Standards Compliance & ERC/EIP Reference Wiki · **Vitest SSOT:** **173 test files | 765 PASS Clean**
> **Breadcrumbs:** [`docs/README.md`](../README.md) · [`TECHNICAL_SPECIFICATION.md`](./TECHNICAL_SPECIFICATION.md) · **This file** — Standard Compliance & ERC/EIP Wiki
> **Parent spec:** [`TECHNICAL_SPECIFICATION.md`](./TECHNICAL_SPECIFICATION.md) — R01–R20 invariants · dual-engine topology · settlement & fee bounds

Official infrastructure standards map — each row links a public ERC/EIP (or venue spec) to Citadel implementation anchors and verification. The **ERC/EIP Standards Reference Wiki** below is the formal deep-dive for AA, attestation, and asset-escrow standards.

---

## Standards Summary Table

| Standard | Role in Citadel | Implementation anchor | Verification |
|----------|-----------------|----------------------|--------------|
| **[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)** | Account Abstraction — scoped agent UserOps without hot-wallet custody | ZeroDev Kernel **v0.3.1** · EntryPoint **v0.7** · `src/adapters/arbitrum/zerodev-aa/` · `zerodev-aa-userop.ts` | ZeroDev AA gate · `eth_supportedEntryPoints` probe · aa-adapter tests |
| **[EIP-7562](https://eips.ethereum.org/EIPS/eip-7562)** | AA storage-access rules — **Zero-Bundler-Rejection Invariant** | Session-key `callData` whitelist · static breaker · `BUNDLER_TIMEOUT_FAIL_CLOSED` | Bundler smoke probe · `zerodev-aa-bundler.ts` |
| **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)** | Typed structured data hashing · domain binding `SliverVineCitadel` | `SliverVineGate.sol` · `src/sdk/constants.ts` · `evaluateAttestation()` | Forge I1–I12 · SDK citadel tests |
| **[ERC-1271](https://eips.ethereum.org/EIPS/eip-1271)** | Contract signature validation for Kernel smart accounts | ZeroDev Kernel `isValidSignature` · Gate ECDSA m-of-n on `RiskAttestation` | Gate Forge suite · agent-intent SDK |
| **[ERC-20](https://eips.ethereum.org/EIPS/eip-20) / [ERC-777](https://eips.ethereum.org/EIPS/eip-777)** | Non-custodial asset transfer & in-flight escrow semantics | `GMX_USDC_ARBITRUM` · `src/adapters/across-ingress-bridge.ts` · `GatedExecutor` payload binding | Across bridge tests · GMX payload tests |
| **[OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)** | On-chain gate access control & reentrancy guard | `SliverVineGate.sol` · OZ `ECDSA.tryRecover` alignment · `IngressSafetySwitch.sol` is a stateless compliance filter (no OZ import) | Foundry Gate **60 passed** · Forge property fuzz |
| **[ERC-7579](https://eips.ethereum.org/EIPS/eip-7579)** | Modular smart-account modules — session-key permission scopes | ZeroDev Kernel v3 modular session keys · scoped `ORDER_EXECUTE` clip · daily gas sponsorship limits | Gatehouse (Pillar 1) · agent-intent SDK |
| **[EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)** | EOA Account Abstraction via `SetCode` — Agent Smart Account upgrade path (`SliverVineGate.sol` compatible) | Kernel v4 intent composer · [Technical Specification §2.4.5](./TECHNICAL_SPECIFICATION.md#245-zerodev-v4-seven-stages-one-stack-alignment-roadmap-post-grant-spec) · [`PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md`](../audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md) | ✅ v1.0 Delivered (Gate-compatible) · Kernel v4 adapter ⏳ V1.5 |
| **[ERC-7715](https://eips.ethereum.org/EIPS/eip-7715)** | Advanced Wallet Permissions — session-key permission evolution target | [Technical Specification §0.1](./TECHNICAL_SPECIFICATION.md#01-bytecode-predicate-verification-v10--erc-7715--post-grant-design-spec) · [Compliance Posture](#compliance-posture) · `session-key-gates.ts` · ZeroDev Kernel v3 session adapter | ✅ v1.0 Delivered (Kernel v3) · ERC-7715 universal permissions ⏳ Post-Grant |
| **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) (Draft)** | AI Agent Wallet Policy — alignment only; **not a finalized standard** | [`SliverVineAgentPolicyGuard.sol`](../../contracts/src/SliverVineAgentPolicyGuard.sol) `validateAgentPolicy` / `checkAgentPolicy` · `src/core/agent-citadel-guard.ts` | Foundry `SliverVineAgentPolicyGuard.t.sol` · [Technical Specification §0.1](./TECHNICAL_SPECIFICATION.md#01-bytecode-predicate-verification-v10--erc-7715--post-grant-design-spec) |
| **[EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)** | Dynamic base-fee congestion sensing on Arbitrum One | Tri-Sensor **BaseFee Velocity** channel · `arbitrum-gas-guard.ts` | Gas-guard tests · Tri-Sensor Matrix |
| **[Arbitrum Stylus SDK](https://github.com/OffchainLabs/stylus-sdk-rs)** (`0.10.7`) | WASM Soil Coprocessor Alignment — on-chain soil parity with Edge | [`contracts/stylus-probe/src/lib.rs`](../../contracts/stylus-probe/src/lib.rs) · `SliverVineSoilCoprocessor` · [Stylus docs](https://docs.arbitrum.io/stylus/reference/overview) | ✅ v1.0 Delivered · `cargo test` **5/5 PASS** · Sepolia deploy pending |
| **ArbOS 61** | Arbitrum L2 execution / Stylus co-residence alignment (⏳ V1.0 Design Spec) | `IngressSafetySwitch.sol` · Elara ingress design · Stylus WASM parity path | Robinhood safety contracts · audit notes |
| **Robinhood Chain Ingress** | Permissioned institutional egress · AML inbound isolation | Chains **46630** (testnet) / **4663** (mainnet filter) · Across bridge · `IngressSafetySwitch.sol` | Robinhood Across bridge tests · audit snapshot |
| **WASM Core (`soil_core`)** | Sub-ms pre-execution soil fuse · Cloudflare Edge hot path | `pkg/soil_core.wasm` · `#![no_std]` Rust · budget **&lt;28 KiB** · warm exec **&lt;60 µs** | Wasm feasibility suite |

---

## ERC/EIP Standards Reference Wiki

### ERC-4337 — Account Abstraction & UserOperation Structure

> **Deep specification:** [Technical Specification §2.4](./TECHNICAL_SPECIFICATION.md#24-pillar-1--opt-in-zerodev-account-abstraction-integration-summary) Pillar 1 — ZeroDev Account Abstraction (Kernel v3/v4 · Paymaster · EIP-7562 · v4 Seven Stages roadmap).

| Field | Citadel binding |
|-------|-----------------|
| **EntryPoint** | `entryPoint07Address` — SSOT `ZERODEV_ENTRY_POINT_ADDRESS` |
| **Kernel** | ZeroDev Kernel **v0.3.1** (`ZERODEV_KERNEL_VERSION`) — v4 adapter swap ⏳ Post-Grant (V1.5)（[§2.4.2](./TECHNICAL_SPECIFICATION.md#242-zerodev-kernel-v3--v4-session-keys-erc-7579-modular-permissions)） |
| **UserOp draft** | `sender` · `nonce` · `callData` · optional `factory`/`factoryData` · gas limits · `paymaster`/`paymasterData` · `signature` |
| **Paymaster** | ZeroDev `zerodev.sponsorUserOperation` — per-op ≤ $0.50 · daily $10 · `zerodev-aa-gas-ledger.ts` |
| **Pre-broadcast gate** | `verifyAgentIntent()` — `AllowedToSign = Injection ∧ Digest ∧ Soil ∧ Session ∧ Gas ∧ Attestation ∧ Armor ∧ Wasm` |
| **106 µs decoupling** | Shield (`checkSoilResistance` · `pkg/soil_core.wasm`) runs **before** paymaster sign + bundler dispatch — Wasm powers sub-ms latency; ZeroDev is opt-in delivery only |

UserOps are drafted locally, sponsored via ZeroDev paymaster middleware, and submitted only after Edge soil + static-breaker evaluation. Bundler RPC MUST advertise EntryPoint v0.7 (`supportsEntryPoint07`). ZeroDev is the **opt-in non-custodial delivery substrate** (Pillar 1); Citadel Edge Wasm is the **pre-broadcast decision SSOT** ([§2.4.1](./TECHNICAL_SPECIFICATION.md#241-role-of-zerodev-scoped-session-keys--gas-sponsorship-pillar-1-opt-in-aa-layer)).

### EIP-7562 — Account Abstraction Storage Access Rules

**Zero-Bundler-Rejection Invariant:** Citadel UserOps MUST NOT violate EIP-7562 opcode/storage rules during the validation phase; bundler rejection is treated as a **protocol fault**, not a retry signal. See [Technical Specification §2.4.4](./TECHNICAL_SPECIFICATION.md#244-eip-7562-zero-bundler-rejection-invariant).

| Rule | Enforcement |
|------|-------------|
| Validation-phase storage reads | Session-key modules restrict `callData` to whitelisted targets/selectors — no forbidden cross-contract reads |
| Edge pre-screen | `evaluateStaticBreakerMatrix()` — soil first, then gas ledger, before `sendUserOperation()` |
| Fail-closed | Bundler unreachable, missing EP v0.7, or timeout → `BUNDLER_TIMEOUT_FAIL_CLOSED` (`ZERODEV_BUNDLER_FAIL_CLOSED_TIMEOUT_MS` = 3_000`) |
| Verification | `zerodev-aa-bundler.ts` · `supportsEntryPoint07` probe · aa-adapter Vitest suite |

### EIP-712 — Typed Structured Data Hashing & Domain Binding

| Component | Value |
|-----------|-------|
| **Domain `name`** | `SliverVineCitadel` (`EIP712_DOMAIN_NAME`) |
| **Domain `version`** | `1` (`EIP712_DOMAIN_VERSION`) |
| **Domain `chainId`** | Live `block.chainid` — cached immutable in Gate constructor |
| **Domain `verifyingContract`** | `SliverVineGate` address (`SLIVERVINE_GATE_ADDRESS`) |
| **Primary type** | `RiskAttestation(bytes32 payloadHash, address subject, uint8 verdict, uint16 riskBps, uint64 issuedAt, uint64 expiresAt, uint256 nonce)` |
| **Digest** | `keccak256("\x19\x01" ‖ domainSeparator ‖ structHash)` — single-use via `consumed[digest]` at `verifyAndConsume` |

SDK envelopes mirror Gate domain binding: `evaluateAttestation()` rejects mismatched `verifyingContract` or `domainName`. Cross-chain replay is denied at L1 consumption.

### ERC-1271 — Standard Signature Validation Method for Contracts

| Path | Mechanism |
|------|-----------|
| **Kernel (ERC-4337)** | ZeroDev Kernel validates session-key proofs via `isValidSignature(bytes32 hash, bytes signature)` — magic value `0x1626ba7e` |
| **Gate (L1 attestation)** | m-of-n ECDSA on `RiskAttestation` EIP-712 digest — OZ-aligned `ECDSA.tryRecover`, non-malleable `s` |
| **UserOp `signature`** | Module-bound session proof consumed by Kernel validation hook, not raw EOA sig |

Edge `verifyAgentIntent()` validates attestation envelope shape; on-chain ERC-1271 / ECDSA verification occurs at Kernel validateUserOp and Gate `verifyAndConsume` respectively.

### ERC-20 / ERC-777 — Non-Custodial Asset Transfer Escrow Semantics

| Semantics | Rule |
|-----------|------|
| **Collateral SSOT** | USDC on Arbitrum (`GMX_USDC_ARBITRUM`) — GMX v2 increase/decrease payloads |
| **No indefinite custody** | Protocol never books user principal as protocol-owned; capital remains in user Kernel account or venue GM position |
| **In-flight bridge escrow** | Outbound Robinhood → Arbitrum Across legs labelled `IN_FLIGHT_BRIDGE_CAPITAL`; `lostUsd ≡ 0` until timeout (`BRIDGE_TIMEOUT_FAIL_CLOSED`) |
| **Venue settlement** | GMX async keeper window **3–5 min**; HL withdrawal **15 min** — inventory held in-flight, not escrowed by Gate |
| **ERC-777** | Not on Citadel hot path; ERC-20 `transfer`/`approve` invoked only via Kernel-scoped UserOp `callData` to whitelisted contracts |

`GatedExecutor.payloadHash()` binds UserOp `callData` to Gate `RiskAttestation.payloadHash` — asset movements without matching attestation revert on-chain.

---

## Compliance Posture

- **ERC-4337:** UserOps pass Edge `verifyAgentIntent()` before bundler dispatch; EntryPoint v0.7 + Kernel v0.3.1 are canonical; gas ledger caps per-UserOp and daily sponsorship.
- **EIP-7562:** Zero-Bundler-Rejection Invariant — session modules + Edge pre-screen prevent validation-phase storage violations; bundler failure is fail-closed, not retried blindly.
- **EIP-712:** All Gate attestations and SDK envelopes bind `chainId` + `verifyingContract` + domain `SliverVineCitadel` — cross-chain replay denied at `verifyAndConsume`.
- **ERC-1271:** Kernel session-key signatures validated via standard magic value; Gate path uses ECDSA m-of-n — dual validation planes, neither bypasses the other.
- **ERC-20 / ERC-777:** Non-custodial escort — in-flight capital labelled, never booked as loss; ERC-777 hooks excluded from hot path.
- **OpenZeppelin Contracts v5:** Gate contracts enforce fail-closed access control and reentrancy-safe execution patterns; `SliverVineGate` ECDSA verification intentionally matches OZ `ECDSA.tryRecover` (strict 65-byte, non-malleable `s`).
- **ERC-4337 / ERC-7579:** Session modules enforce clip + TTL caps alongside UserOp structure constraints.
- **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196):** Aligned with the emerging **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) AI Agent Wallet Policy Specification** (Draft co-authored by Virtuals Protocol). **Not a finalized standard.**
- **EIP-1559:** Gas-yield ratio fuse blocks dispatch when L1 surcharge exceeds target yield band.
- **Robinhood Chain:** Outbound-only escort (`46630`/`4663` → `42161`); inbound AML blocked · `lostUsd ≡ 0`.
- **WASM:** Hot-path soil evaluation mirrors Edge `checkSoilResistance()` semantics for sub-ms fail-closed.
- **ERC-7715 Decoupling:** ⏳ **Planned / V1.0 Design Spec** — ZeroDev Kernel v3 is the v1.0 ephemeral session-key adapter (Gatehouse). Universal **ERC-7715 Advanced Wallet Permissions** is the evolution target for adapter swap without Shield or Wasm rewrite.

---

## ArbOS / Stylus Alignment — ✅ Code-Verified On-Chain Coprocessor

> **Edge (Cloudflare) remains the pre-broadcast SSOT.** The **`SliverVineSoilCoprocessor`** (`contracts/stylus-probe/src/lib.rs`) is an active **u128 fixed-point** soil math coprocessor compiled via **Stylus SDK 0.10.7** — on-chain reinforcement aligned with Edge `checkSoilResistance()` semantics. Elara protocol ingress remains ⏳ V1.0 Design Spec.

| Layer | Alignment | Status |
|-------|-----------|--------|
| **Stylus Soil Coprocessor** | **`SliverVineSoilCoprocessor`** — u128 fixed-point score · quadratic spread/slippage penalty · fail-closed `depth_usd ≥ 10_000` · `evaluate_soil_coprocessor(spread_bps, depth_usd, slippage_bps)` · parity with Edge soil fuse | ✅ **Code-Verified Coprocessor** (`contracts/stylus-probe/src/lib.rs` · Stylus SDK **0.10.7** · `cargo test` **5/5 PASS** · Wasm Sandbox Vitest Passed · on-chain Sepolia deploy **pending tooling lock**) |
| **Elara protocol ingress** | Protocol-level ingress filtering drops non-compliant Robinhood Chain / blacklisted senders before GM payload construction — complements `IngressSafetySwitch` | ⏳ V1.0 Design Spec |
| **ArbOS gas / base-fee sensor** | Tri-Sensor **BaseFee Velocity** channel remains the congestion throttle for dispatch SLO | ✅ v1.0 Delivered (Sepolia verified) (`arbitrum-gas-guard.ts`) |

**Design rule:** Edge (Cloudflare) remains the pre-broadcast SSOT; Stylus coprocessor + Elara are the on-chain reinforcement plane — never a weaker substitute for fail-closed Edge gates.

---

## Infrastructure RPC / WSS (Alchemy HA)

Multi-chain HTTPS/WSS placeholders live in `.env.example` — replace `YOUR_ALCHEMY_API_KEY` locally; never commit live keys.

| Venue | Chain ID | HTTPS (RPC) | WSS |
|-------|----------|-------------|-----|
| **Arbitrum One** (primary) | 42161 | `ARB_MAINNET_RPC_URL` | `ARBITRUM_WSS_URL` |
| **Arbitrum Sepolia** (sandbox) | 421614 | `ARB_SEPOLIA_RPC_URL` | `ARBITRUM_SEPOLIA_WSS_URL` |
| **Robinhood Testnet** | 46630 | `ROBINHOOD_TESTNET_RPC_URL` | `ROBINHOOD_TESTNET_WSS_URL` |
| **Robinhood Mainnet** | 4663 | `ROBINHOOD_MAINNET_RPC_URL` | `ROBINHOOD_MAINNET_WSS_URL` |
| **Hyperliquid** (venue-native + optional HA) | — | `HYPERLIQUID_*_RPC_URL` · SSOT `HL_INFO_URL` / `HL_EXCHANGE_URL` | `HYPERLIQUID_WSS_URL` |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`TECHNICAL_SPECIFICATION.md`](./TECHNICAL_SPECIFICATION.md) | Yellow Paper — R01–R20 · Three Pillars · topology |
| [`PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md`](../audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md) | Pillar 1 — ZeroDev Kernel v3 AA · EIP-7702 comparative |
| [`PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](../audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md) | Pillar 3 — Wasm soil core · p50 ~106µs |
| [`CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md) | Apache-2.0 SDK API |
