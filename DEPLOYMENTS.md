# 🌐 SliverVine Protocol — Multi-Chain CREATE2 Deployments

All deployment addresses are deterministic and secured via CREATE2 salts.
No cross-chain replay risk exists due to immutable EIP-712 `domainSeparator` bindings.

## 📍 Verified Deployment Matrix

| Contract | Role | CREATE2 Address | Status |
| :--- | :--- | :--- | :--- |
| `SliverVineGate` | M-of-N Attestation Verifier | `drafted, not yet deployed` | M3 Target |
| `GatedExecutor` | Isolated Payload Call Router | `drafted, not yet deployed` | M3 Target |

---

## ⚡ Target Chains
1. **Arbitrum Sepolia (421614)** — Primary Gateway
2. **Robinhood Chain Testnet (46630)** — Reserve Seat Target