import { afterEach, describe, expect, it } from "vitest";
import {
  buildHoneyPotDecoyTelemetry,
  evaluateRpcDefenseGate,
  HoneyPotCircuitBreakError,
  HONEYPOT_ACTIVE,
  HONEYPOT_RPC_HOSTS,
  HONEYPOT_SIMULATED_SLIPPAGE,
  HONEYPOT_STATUS_CODE,
  isRpcDefenseAuthenticated,
  SESSION_ENTROPY_SEED_CANONICAL,
  assertRpcAllowlisted,
  fetchAllowlisted,
  listInternalRpcHosts,
  RpcNodeNotAllowlistedError,
  tripHoneyPotCircuit,
} from "../../src/services/defense/rpc-whitelist";
import {
  JAVIER_SIGNATURE_LITERAL,
  OWNER_IDENTITY_TAG,
  ViewportPaddingOffset,
  __setLayoutMetricConfigForTests,
  computeLayoutBoundUsd,
  decodeLayoutMetricBlob,
  enforceLayoutMetricGate,
  resolveLayoutMetricThresholds,
  validateLayoutMetricUnlock,
  deriveDynamicEntropyJitter,
  LAYOUT_METRIC_ENC_BLOB,
} from "../../src/services/defense/layout-metric-provider";
import {
  __setHudCanaryEnvForTests,
  assertUiWorkerHandshake,
  buildUiHandshakeHeaders,
  computeRuntimeCanaryHash,
  generateCanvasWatermarkPayload,
  HUD_CANARY_EXPECTED,
  isHudCanaryAuthenticated,
  resolveUiStreamState,
  RUNTIME_CANARY_SEED,
  RUNTIME_INTEGRITY_HEADER,
  UI_LOCKED_MESSAGE,
} from "../../src/services/defense/ui-canary";
import { RiskLimitExceeded } from "../../src/services/risk-control";

const TRIPLE_STRING_ENV = {
  VIEWPORT_PADDING_OFFSET: ViewportPaddingOffset,
  OWNER_IDENTITY: OWNER_IDENTITY_TAG,
  JAVIER_SIGNATURE: JAVIER_SIGNATURE_LITERAL,
} as const;

const HUD_CANARY_ENV = {
  NEXT_PUBLIC_HUD_CANARY: HUD_CANARY_EXPECTED,
} as const;

afterEach(() => {
  __setLayoutMetricConfigForTests(undefined);
  __setHudCanaryEnvForTests(undefined);
});

describe("Layout metric provider — unlock gate", () => {
  it("passes when all 3 operator unlock secrets are supplied", () => {
    __setLayoutMetricConfigForTests({ ...TRIPLE_STRING_ENV });
    expect(validateLayoutMetricUnlock()).toBe(true);
    const thresholds = resolveLayoutMetricThresholds();
    expect(thresholds.valid).toBe(true);
    expect(thresholds.maxSlBaseUsd).toBe(100);
    expect(thresholds.maxSlBalanceRate).toBe(0.01);
    expect(thresholds.latencyBoundMs).toBe(500);
    expect(computeLayoutBoundUsd(10_000, thresholds)).toBe(200);
  });

  it("decrypts layout metric blob with canonical viewport padding", () => {
    const decoded = decodeLayoutMetricBlob(
      LAYOUT_METRIC_ENC_BLOB,
      ViewportPaddingOffset,
    );
    expect(decoded.maxSlBaseUsd).toBe(100);
    expect(decoded.latencyBoundMs).toBe(500);
  });

  it.each([
    ["missing all keys", {}],
    [
      "wrong padding",
      { ...TRIPLE_STRING_ENV, VIEWPORT_PADDING_OFFSET: "wrong" },
    ],
    ["wrong owner tag", { ...TRIPLE_STRING_ENV, OWNER_IDENTITY: "0xEvil" }],
    ["wrong operator sig", { ...TRIPLE_STRING_ENV, JAVIER_SIGNATURE: "javier" }],
    [
      "missing operator sig only",
      {
        VIEWPORT_PADDING_OFFSET: ViewportPaddingOffset,
        OWNER_IDENTITY: OWNER_IDENTITY_TAG,
      },
    ],
  ])("rootProtection deadlock when %s", (_label, env) => {
    __setLayoutMetricConfigForTests(env);
    expect(resolveLayoutMetricThresholds().valid).toBe(false);
    expect(() =>
      enforceLayoutMetricGate({
        symbol: "BTC",
        estimatedLossUsd: 1,
        accountBalanceUsd: 10_000,
      }),
    ).toThrow(RiskLimitExceeded);
  });

  it("allows trades within decrypted dynamic Max SL when layout unlock valid", () => {
    __setLayoutMetricConfigForTests({ ...TRIPLE_STRING_ENV });
    expect(() =>
      enforceLayoutMetricGate({
        symbol: "BTC",
        estimatedLossUsd: 50,
        accountBalanceUsd: 10_000,
      }),
    ).not.toThrow();
  });
});

describe("Integrity probe rpc-whitelist", () => {
  it("strips probe hosts when layout unlock validation passes", () => {
    const hosts = listInternalRpcHosts(TRIPLE_STRING_ENV);
    for (const trap of HONEYPOT_RPC_HOSTS) {
      expect(hosts).not.toContain(trap);
    }
    expect(() =>
      assertRpcAllowlisted(
        `https://${HONEYPOT_RPC_HOSTS[0]}/v1/rpc`,
        [],
        TRIPLE_STRING_ENV,
      ),
    ).toThrow(RpcNodeNotAllowlistedError);
  });

  it("retains probe hosts without layout unlock", () => {
    const hosts = listInternalRpcHosts({});
    for (const trap of HONEYPOT_RPC_HOSTS) {
      expect(hosts).toContain(trap);
    }
  });

  it("circuit-breaks probe fetch with 500 + simulated slippage", async () => {
    await expect(
      fetchAllowlisted(`https://${HONEYPOT_RPC_HOSTS[1]}/quote`, {}, [], {}),
    ).rejects.toMatchObject({
      name: "HoneyPotCircuitBreakError",
      httpStatus: 500,
      statusCode: HONEYPOT_STATUS_CODE,
      honeypotActive: HONEYPOT_ACTIVE,
      simulatedSlippage: HONEYPOT_SIMULATED_SLIPPAGE,
    });
  });

  it("trips circuit probe on production host without SESSION_ENTROPY_SEED", () => {
    expect(() =>
      assertRpcAllowlisted(
        "https://api.hyperliquid.xyz/info",
        [],
        {},
        { circuitProbe: true },
      ),
    ).toThrow(HoneyPotCircuitBreakError);
  });

  it("allows circuit probe fast-path when SESSION_ENTROPY_SEED is valid", () => {
    __setLayoutMetricConfigForTests({
      SESSION_ENTROPY_SEED: SESSION_ENTROPY_SEED_CANONICAL,
    });
    expect(isRpcDefenseAuthenticated()).toBe(true);
    expect(() =>
      assertRpcAllowlisted(
        "https://api.hyperliquid.xyz/info",
        [],
        { SESSION_ENTROPY_SEED: SESSION_ENTROPY_SEED_CANONICAL },
        { circuitProbe: true },
      ),
    ).not.toThrow();
  });

  it("deriveDynamicEntropyJitter applies phase-entropy compensation", () => {
    const base = 0.78;
    const a = deriveDynamicEntropyJitter(base, SESSION_ENTROPY_SEED_CANONICAL, 1_700_000_000_000);
    const b = deriveDynamicEntropyJitter(base, SESSION_ENTROPY_SEED_CANONICAL, 1_700_000_000_000);
    expect(a).toBeGreaterThan(base);
    expect(a).toBe(b);
  });

  it("evaluateRpcDefenseGate returns HONEYPOT_ACTIVE for unauthenticated trap host", () => {
    const verdict = evaluateRpcDefenseGate(`https://${HONEYPOT_RPC_HOSTS[0]}/v1/rpc`);
    expect(verdict).toMatchObject({
      authenticated: false,
      tripped: true,
      statusCode: HONEYPOT_STATUS_CODE,
      code: HONEYPOT_ACTIVE,
    });
    expect(buildHoneyPotDecoyTelemetry("https://trap.test/rpc")).toMatchObject({
      statusCode: HONEYPOT_STATUS_CODE,
      code: HONEYPOT_ACTIVE,
      simulatedSlippage: HONEYPOT_SIMULATED_SLIPPAGE,
    });
    expect(() => tripHoneyPotCircuit("https://trap.test/rpc")).toThrow(HoneyPotCircuitBreakError);
  });

  it("allows production RPC hosts regardless of unlock state", () => {
    expect(() =>
      assertRpcAllowlisted("https://api.hyperliquid.xyz/info", [], {}),
    ).not.toThrow();
    expect(() =>
      assertRpcAllowlisted(
        "https://api.hyperliquid.xyz/info",
        [],
        TRIPLE_STRING_ENV,
      ),
    ).not.toThrow();
  });
});

describe("RuntimeCanary ui-canary HUD handshake", () => {
  it("authenticates with NEXT_PUBLIC_HUD_CANARY=santenmoku", () => {
    __setHudCanaryEnvForTests({ ...HUD_CANARY_ENV });
    expect(isHudCanaryAuthenticated()).toBe(true);
    expect(resolveUiStreamState()).toBe("CONNECTED");
    expect(assertUiWorkerHandshake()).toEqual({ ok: true });
    expect(buildUiHandshakeHeaders()).toMatchObject({
      "X-Santenmoku-Canary": HUD_CANARY_EXPECTED,
      [RUNTIME_INTEGRITY_HEADER]: computeRuntimeCanaryHash(),
    });
  });

  it("locks UI stream when canary token is invalid", () => {
    __setHudCanaryEnvForTests({ NEXT_PUBLIC_HUD_CANARY: "wrong" });
    expect(isHudCanaryAuthenticated()).toBe(false);
    expect(resolveUiStreamState()).toBe("DISCONNECTED_LOCKED");
    expect(assertUiWorkerHandshake()).toEqual({
      ok: false,
      message: UI_LOCKED_MESSAGE,
    });
    expect(buildUiHandshakeHeaders()).toMatchObject({
      "X-Santenmoku-Canary": HUD_CANARY_EXPECTED,
    });
  });

  it("falls back to santenmoku when NEXT_PUBLIC_HUD_CANARY is unset", () => {
    __setHudCanaryEnvForTests({});
    expect(isHudCanaryAuthenticated()).toBe(true);
    expect(resolveUiStreamState()).toBe("CONNECTED");
    expect(assertUiWorkerHandshake()).toEqual({ ok: true });
  });

  it("generates stable Canvas/WebGL watermark payload", () => {
    const payload = generateCanvasWatermarkPayload();
    expect(payload.seed).toBe(RUNTIME_CANARY_SEED);
    expect(payload.hash).toMatch(/^ri-[0-9a-f]{8}$/);
    expect(payload.webglHint).toContain("webgl-ri-");
  });
});
