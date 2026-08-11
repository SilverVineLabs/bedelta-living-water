import { describe, expect, it } from "vitest";
import {
  extractHlExchangeErrorDetail,
  findActiveRegisteredSessionKeyAgent,
  isHlAgentAlreadyUsedError,
  isHlTelemetryFallbackError,
  isHlUserWalletMissingError,
  isSessionKeyAgentRegisteredOnL2,
  registerAgentWithL2IndexingAwait,
  registerApprovedAgentOnHlExchange,
} from "../../../src/adapters/hl/hl-agent-registration";
import { HyperliquidExecutionError } from "../../../src/adapters/hl/execution-types";
import type { SessionKeyAgentResult } from "../../../src/adapters/hl/auth";

const MASTER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const SAMPLE_AGENT: SessionKeyAgentResult = {
  action: {
    type: "approveAgent",
    signatureChainId: "0x3e6",
    hyperliquidChain: "Testnet",
    agentAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    agentName: "BeDeltaAgent",
    nonce: 1_700_000_000_000,
  },
  signature: "0x" + "ab".repeat(65),
  agentAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  expiresAt: 1_700_086_400_000,
  nonce: 1_700_000_000_000,
  hyperliquidChain: "Testnet",
};

function mockIndexedAgentFetch(
  exchangeResponse: unknown,
): typeof fetch {
  return async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { type?: string };
    if (body.type === "extraAgents") {
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            name: "BeDeltaAgent",
            address: SAMPLE_AGENT.agentAddress,
            validUntil: Date.now() + 60_000,
          },
        ],
      } as Response;
    }
    if (body.type === "clearinghouseState") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          marginSummary: { accountValue: "1000" },
          withdrawable: "500",
        }),
      } as Response;
    }
    return exchangeResponse as Response;
  };
}

describe("hl-agent-registration", () => {
  it("detects HL user wallet missing errors", () => {
    expect(
      isHlUserWalletMissingError("User or API Wallet 0xabc does not exist."),
    ).toBe(true);
    expect(isHlUserWalletMissingError("Insufficient margin")).toBe(false);
  });

  it("isHlTelemetryFallbackError includes wallet missing and timeouts", () => {
    expect(
      isHlTelemetryFallbackError("User or API Wallet 0xabc does not exist."),
    ).toBe(true);
    expect(isHlTelemetryFallbackError("Hyperliquid exchange request timed out")).toBe(
      true,
    );
    expect(isHlTelemetryFallbackError("Insufficient margin")).toBe(false);
  });

  it("extractHlExchangeErrorDetail reads HyperliquidExecutionError body", () => {
    const detail = extractHlExchangeErrorDetail(
      new HyperliquidExecutionError(
        "reject",
        "EXECUTION_REJECT",
        200,
        { status: "err", response: "User or API Wallet 0xabc does not exist." },
      ),
    );
    expect(detail).toBe("User or API Wallet 0xabc does not exist.");
  });

  it("isHlAgentAlreadyUsedError detects reuse rejection", () => {
    expect(isHlAgentAlreadyUsedError("Extra agent already used")).toBe(true);
    expect(isHlAgentAlreadyUsedError("Insufficient margin")).toBe(false);
  });

  it("findActiveRegisteredSessionKeyAgent matches active BeDeltaAgent", () => {
    const agent = findActiveRegisteredSessionKeyAgent(
      [
        {
          name: "BeDeltaAgent",
          address: SAMPLE_AGENT.agentAddress,
          validUntil: Date.now() + 60_000,
        },
      ],
      SAMPLE_AGENT.agentAddress,
    );
    expect(agent?.name).toBe("BeDeltaAgent");
  });

  it("isSessionKeyAgentRegisteredOnL2 reads extraAgents info endpoint", async () => {
    const fetchFn = async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { type?: string };
      expect(body.type).toBe("extraAgents");
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            name: "BeDeltaAgent",
            address: SAMPLE_AGENT.agentAddress,
            validUntil: Date.now() + 60_000,
          },
        ],
      } as Response;
    };

    const registered = await isSessionKeyAgentRegisteredOnL2(
      MASTER_WALLET,
      SAMPLE_AGENT.agentAddress,
      { fetchFn },
    );
    expect(registered?.name).toBe("BeDeltaAgent");
  });

  it("registerAgentWithL2IndexingAwait skips when HL reports agent already used", async () => {
    const fetchFn = mockIndexedAgentFetch({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ status: "err", response: "Extra agent already used" }),
    });

    const result = await registerAgentWithL2IndexingAwait(SAMPLE_AGENT, {
      fetchFn,
      masterWalletAddress: MASTER_WALLET,
    });
    expect(result).toEqual({ skippedRegistration: true });
  });

  it("registerAgentWithL2IndexingAwait throws raw HL error when API wallet missing", async () => {
    const fetchFn = async () =>
      ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            status: "err",
            response: "User or API Wallet 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 does not exist.",
          }),
      }) as Response;

    await expect(
      registerAgentWithL2IndexingAwait(SAMPLE_AGENT, {
        fetchFn,
        masterWalletAddress: MASTER_WALLET,
      }),
    ).rejects.toThrow("User or API Wallet");
  });

  it("registerApprovedAgentOnHlExchange POSTs approveAgent payload", async () => {
    let postedBody: unknown;
    const fetchFn = async (_url: string, init?: RequestInit) => {
      postedBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: "ok" }),
      } as Response;
    };

    await registerApprovedAgentOnHlExchange(SAMPLE_AGENT, { fetchFn });
    expect(postedBody).toMatchObject({
      nonce: SAMPLE_AGENT.nonce,
      action: { type: "approveAgent", agentName: "BeDeltaAgent" },
      signature: { r: expect.stringMatching(/^0x/), s: expect.stringMatching(/^0x/) },
    });
    expect((postedBody as { action: { agentName: string } }).action.agentName.length).toBeLessThanOrEqual(16);
  });

  it("registerApprovedAgentOnHlExchange coerces invalid agentName to BeDeltaAgent", async () => {
    let postedBody: unknown;
    const fetchFn = async (_url: string, init?: RequestInit) => {
      postedBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: "ok" }),
      } as Response;
    };

    await registerApprovedAgentOnHlExchange(
      {
        ...SAMPLE_AGENT,
        action: { ...SAMPLE_AGENT.action, agentName: "BeDeltaSessionKey" },
      },
      { fetchFn },
    );
    expect((postedBody as { action: { agentName: string } }).action.agentName).toBe(
      "BeDeltaAgent",
    );
  });
});
