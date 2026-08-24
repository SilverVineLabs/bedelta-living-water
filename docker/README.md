# SliverVine Citadel Telemetry Sidecar — User Guide & Testlist

> **License:** BUSL-1.1 (Business Source License 1.1) · Copyright (c) 2026 SilverVine Labs

> B2B zero-GC relay for Grant evaluators · polls live Citadel telemetry · exposes local `/health` + fail-closed `/v1/intent`.

**Entity:** SilverVine Labs · **Official Site:** [silvervinelabs.com](https://silvervinelabs.com) · **Upstream:** `https://bedeltawater.slivervine.xyz/api/telemetry/health`  
**Regression bar:** **735 PASS (138 files)** · `tsc --noEmit` CLEAN

---

## 1. Prerequisites


| Requirement    | Notes                                          |
| -------------- | ---------------------------------------------- |
| Docker 24+     | Or Node 22+ for native daemon                  |
| Network egress | Sidecar polls production telemetry (read-only) |
| Port `8080`    | Default bind · override via `SIDECAR_PORT`     |


---



## 2. Build Image

From repository root:

```bash
docker build -t silvervine-sidecar -f docker/Dockerfile.sidecar .
```


| Flag       | Value                       |
| ---------- | --------------------------- |
| Image tag  | `silvervine-sidecar`        |
| Dockerfile | `docker/Dockerfile.sidecar` |
| Context    | `.` (repo root)             |


---



## 3. Run Container

```bash
docker run -d --name sv-sidecar -p 8080:8080 silvervine-sidecar
```

Optional env overrides:

```bash
docker run -d --name sv-sidecar -p 8080:8080 \
  -e SIDECAR_PORT=8080 \
  -e SIDECAR_DECISION_SLO_MS=500 \
  -e TELEMETRY_UPSTREAM=https://bedeltawater.slivervine.xyz/api/telemetry/health \
  silvervine-sidecar
```

Stop / remove:

```bash
docker stop sv-sidecar && docker rm sv-sidecar
```

---



## 4. Verification Testlist (Grant Evaluators)

Run after container starts (~5s warm-up).

### 4.1 Health probe (expect HTTP 200 or 503 JSON)

```bash
curl -sS -w "\nHTTP %{http_code}\n" http://localhost:8080/health | jq .
```

**Pass criteria:**

- JSON includes `sidecar`, `decisionDeadlineSloMs`, `probe`
- `probe.ok === true` → HTTP **200**
- Upstream unreachable → HTTP **503** (still JSON, fail-closed armed)



### 4.2 Fail-closed intent gate (expect HTTP 403)

```bash
curl -sS -w "\nHTTP %{http_code}\n" \
  -X POST http://localhost:8080/v1/intent \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"ETH","side":"long","sizeUsd":100}' | jq .
```

**Pass criteria:**

- HTTP **403**
- `failClosed: true`
- `error` is `CITADEL_FAIL_CLOSED` (upstream/SLO trip) or `INTENT_GATE_FAIL_CLOSED` (Citadel pre-execution gate)



### 4.3 Invalid JSON (expect HTTP 400)

```bash
curl -sS -w "\nHTTP %{http_code}\n" \
  -X POST http://localhost:8080/v1/intent \
  -H 'Content-Type: application/json' \
  -d 'not-json'
```

**Pass criteria:** HTTP **400** · `INVALID_JSON`

### 4.4 One-liner smoke (30-second check)

```bash
curl -sf http://localhost:8080/health | jq -r .sidecar && \
curl -s -o /dev/null -w "intent=%{http_code}\n" -X POST http://localhost:8080/v1/intent -H 'Content-Type: application/json' -d '{}'
```

Expected: `v0.8-preview` then `intent=403`

---



## 5. Native Node (No Docker)

```bash
export SIDECAR_PORT=8080
node docker/sidecar-daemon.mjs
```

Same curl commands against `http://localhost:8080`.

---



## 6. B2B Circuit Breaker Wiring


| Endpoint                      | Role                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `GET /health`                 | Liveness · mirrors upstream Citadel telemetry RTT                                  |
| `POST /v1/intent`             | Pre-execution gate stub — always fail-closed until `@SagaProtected` signer mounted |
| `SIDECAR_DECISION_SLO_MS=500` | **500ms** local Sidecar decision SLO (RTT to `/health`)                            |
| On-chain RPC                  | **3000ms** network timeout — fail-closed (no synthetic market depth)               |


Institutional funds route alpha through `silvervine-proxy` at `localhost:8080` — existing Python/TS strategies unchanged.

---



## 7. Troubleshooting


| Symptom                         | Fix                                        |
| ------------------------------- | ------------------------------------------ |
| `connection refused` on `:8080` | `docker ps` · confirm `-p 8080:8080`       |
| Health HTTP 503                 | Upstream blocked — check egress / VPN      |
| Build fails `COPY`              | Run `docker build` from repo root          |
| Port clash                      | `docker run -p 9090:8080` and curl `:9090` |


---



## 8. Related Paths


| File                                               | Purpose                                   |
| -------------------------------------------------- | ----------------------------------------- |
| [`Dockerfile.sidecar`](./Dockerfile.sidecar)       | Production image                          |
| [`sidecar-daemon.mjs`](./sidecar-daemon.mjs)       | Edge-safe daemon (no TS runtime)          |
| [README.md](../README.md)                          | Grant audit HUD · live `/api/grant-audit` |
| [docs/grants/arbitrum/GRANT_PROPOSAL.md](../docs/grants/arbitrum/GRANT_PROPOSAL.md) | Full Citadel scope                        |
| [docs/README.md](../docs/README.md) | Docs audience index                       |


---



## 9. GMX Payload CLI (Grant Evaluators)

```bash
npx tsx scripts/test-gmx-v2-execution.ts --help
npx tsx scripts/test-gmx-v2-execution.ts --live-read [--allow-stale-oracle]
```

Default enforces **30s Oracle Lag fail-closed** Citadel gate. `--allow-stale-oracle` bypasses oracle lag deadlock for dry-run payload inspection only (see [README.md](../README.md) Auditor CLI).

---

**License:** BUSL-1.1 (Business Source License 1.1) · Copyright (c) 2026 SilverVine Labs · Grant evaluators retain full review rights. See [LICENSE](../LICENSE).