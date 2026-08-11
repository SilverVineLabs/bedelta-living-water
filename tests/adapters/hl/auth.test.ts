import { Wallet, verifyTypedData } from "ethers";
import { describe, expect, it } from "vitest";
import {
  HL_AGENT_TYPES,
  HL_APPROVE_AGENT_TYPES,
  HL_EXCHANGE_DOMAIN,
  HL_L1_CHAIN_ID,
  HL_SESSION_KEY_AGENT_NAME,
  HL_USER_SIGNED_CHAIN_ID,
  HL_ZERO_ADDRESS,
  SigningChannelLockedError,
  buildExchangeAgentMessage,
  buildExchangeDomain,
  buildUserSignedDomain,
  chainIdHexToNumber,
  createL1ActionHash,
  createSessionKeyAgent,
  isSigningChannelLocked,
  normalizeChainIdHex,
  signHyperliquidAction,
  splitHyperliquidSignature,
  verifySessionKeyValidity,
} from "../../../src/adapters/hl/auth";
import { HardlockError } from "../../../src/services/risk-control";
import { resolveHlTestnetDryRunPrivateKey } from "../../../src/env/hl-testnet-key";

/** Test-only dry-run key — derived at runtime, not a published test vector. */
const TEST_PRIVATE_KEY = resolveHlTestnetDryRunPrivateKey();
const TEST_MASTER_ADDRESS = new Wallet(TEST_PRIVATE_KEY).address;
const TEST_AGENT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

describe("hl/auth — EIP-712 domains & types", () => {
  it("defines Exchange L1 domain with chainId 1337", () => {
    expect(HL_EXCHANGE_DOMAIN).toEqual({
      name: "Exchange",
      version: "1",
      chainId: HL_L1_CHAIN_ID,
      verifyingContract: HL_ZERO_ADDRESS,
    });
    expect(HL_L1_CHAIN_ID).toBe(1337);
  });

  it("defines Agent typed fields for phantom L1 signing", () => {
    expect(HL_AGENT_TYPES.Agent).toEqual([
      { name: "source", type: "string" },
      { name: "connectionId", type: "bytes32" },
    ]);
  });

  it("builds user-signed domain from signatureChainId hex", () => {
    expect(buildUserSignedDomain(HL_USER_SIGNED_CHAIN_ID)).toEqual({
      name: "HyperliquidSignTransaction",
      version: "1",
      chainId: 0x66eee,
      verifyingContract: HL_ZERO_ADDRESS,
    });
  });

  it("normalizes wallet chain ids for dynamic EIP-712 domains", () => {
    expect(normalizeChainIdHex("0x3e6")).toBe("0x3e6");
    expect(chainIdHexToNumber("0x3e6")).toBe(998);
    expect(buildUserSignedDomain("0x3e6").chainId).toBe(998);
  });

  it("defines ApproveAgent / session-key delegation types", () => {
    expect(HL_APPROVE_AGENT_TYPES["HyperliquidTransaction:ApproveAgent"]).toEqual([
      { name: "hyperliquidChain", type: "string" },
      { name: "agentAddress", type: "address" },
      { name: "agentName", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
  });
});

describe("hl/auth — L1 action hash & exchange signing", () => {
  const wallet = new Wallet(TEST_PRIVATE_KEY);
  const sampleAction = {
    type: "cancel",
    cancels: [{ a: 0, o: 12345 }],
  };
  const fixedNonce = 1_700_000_000_000;

  it("creates deterministic L1 action hash (connectionId)", () => {
    const hash = createL1ActionHash({ action: sampleAction, nonce: fixedNonce });
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(createL1ActionHash({ action: sampleAction, nonce: fixedNonce })).toBe(hash);
  });

  it("builds phantom Agent message for mainnet source 'a'", () => {
    const message = buildExchangeAgentMessage({
      action: sampleAction,
      nonce: fixedNonce,
      isTestnet: false,
    });
    expect(message.source).toBe("a");
    expect(message.connectionId).toBe(
      createL1ActionHash({ action: sampleAction, nonce: fixedNonce }),
    );
  });

  it("buildExchangeDomain always uses SDK canonical L1 chainId 1337", () => {
    expect(buildExchangeDomain("0x3e6")).toEqual({
      name: "Exchange",
      version: "1",
      chainId: HL_L1_CHAIN_ID,
      verifyingContract: HL_ZERO_ADDRESS,
    });
    expect(buildExchangeDomain().chainId).toBe(HL_L1_CHAIN_ID);
  });

  it("signHyperliquidAction uses Exchange domain chainId 1337 (SDK canonical)", async () => {
    const walletChainId = "0x3e6";
    const signature = await signHyperliquidAction(wallet, sampleAction, fixedNonce, {
      isTestnet: true,
      signatureChainId: walletChainId,
    });
    const agentMessage = buildExchangeAgentMessage({
      action: sampleAction,
      nonce: fixedNonce,
      isTestnet: true,
    });
    const recovered = verifyTypedData(
      HL_EXCHANGE_DOMAIN,
      HL_AGENT_TYPES,
      agentMessage,
      signature,
    );
    expect(recovered).toBe(TEST_MASTER_ADDRESS);
  });

  it("signHyperliquidAction returns recoverable EIP-712 signature", async () => {
    const signature = await signHyperliquidAction(wallet, sampleAction, fixedNonce);
    expect(signature).toMatch(/^0x[0-9a-f]{130}$/i);

    const agentMessage = buildExchangeAgentMessage({
      action: sampleAction,
      nonce: fixedNonce,
    });
    const recovered = verifyTypedData(
      HL_EXCHANGE_DOMAIN,
      HL_AGENT_TYPES,
      agentMessage,
      signature,
    );
    expect(recovered).toBe(TEST_MASTER_ADDRESS);

    const parts = splitHyperliquidSignature(signature);
    expect(parts.r).toMatch(/^0x/);
    expect(parts.s).toMatch(/^0x/);
    expect(parts.v).toBeGreaterThanOrEqual(27);
  });

  it("uses testnet source 'b' when isTestnet is true", async () => {
    const message = buildExchangeAgentMessage({
      action: sampleAction,
      nonce: fixedNonce,
      isTestnet: true,
    });
    expect(message.source).toBe("b");

    const signature = await signHyperliquidAction(wallet, sampleAction, fixedNonce, {
      isTestnet: true,
    });
    const recovered = verifyTypedData(
      HL_EXCHANGE_DOMAIN,
      HL_AGENT_TYPES,
      message,
      signature,
    );
    expect(recovered).toBe(TEST_MASTER_ADDRESS);
  });
});

describe("hl/auth — session key agent authorization", () => {
  const masterWallet = new Wallet(TEST_PRIVATE_KEY);
  const durationMs = 86_400_000;
  const fixedNonce = 1_700_000_000_000;

  it("createSessionKeyAgent signs ApproveAgent user-signed action", async () => {
    const result = await createSessionKeyAgent(
      masterWallet,
      TEST_AGENT_ADDRESS,
      durationMs,
      { nonce: fixedNonce },
    );

    expect(result.action).toEqual({
      type: "approveAgent",
      signatureChainId: HL_USER_SIGNED_CHAIN_ID,
      hyperliquidChain: "Mainnet",
      agentAddress: TEST_AGENT_ADDRESS.toLowerCase(),
      agentName: HL_SESSION_KEY_AGENT_NAME,
      nonce: fixedNonce,
    });
    expect(result.expiresAt).toBe(fixedNonce + durationMs);
    expect(result.signature).toMatch(/^0x[0-9a-f]{130}$/i);

    const domain = buildUserSignedDomain(HL_USER_SIGNED_CHAIN_ID);
    const recovered = verifyTypedData(
      domain,
      HL_APPROVE_AGENT_TYPES,
      {
        hyperliquidChain: result.action.hyperliquidChain,
        agentAddress: result.action.agentAddress,
        agentName: result.action.agentName,
        nonce: result.action.nonce,
      },
      result.signature,
    );
    expect(recovered).toBe(TEST_MASTER_ADDRESS);
  });

  it("createSessionKeyAgent accepts dynamic wallet signatureChainId (HL testnet 998)", async () => {
    const walletChainId = "0x3e6";
    const result = await createSessionKeyAgent(
      masterWallet,
      TEST_AGENT_ADDRESS,
      durationMs,
      { nonce: fixedNonce, isTestnet: true, signatureChainId: walletChainId },
    );

    expect(result.action.signatureChainId).toBe("0x3e6");
    expect(result.action.hyperliquidChain).toBe("Testnet");
    const domain = buildUserSignedDomain(walletChainId);
    expect(domain.chainId).toBe(998);
    const recovered = verifyTypedData(
      domain,
      HL_APPROVE_AGENT_TYPES,
      {
        hyperliquidChain: result.action.hyperliquidChain,
        agentAddress: result.action.agentAddress,
        agentName: result.action.agentName,
        nonce: result.action.nonce,
      },
      result.signature,
    );
    expect(recovered).toBe(TEST_MASTER_ADDRESS);
  });

  it("verifySessionKeyValidity accepts valid future expiry", () => {
    const future = Date.now() + 60_000;
    expect(verifySessionKeyValidity(TEST_AGENT_ADDRESS, future)).toBe(true);
  });

  it("verifySessionKeyValidity rejects expired or malformed address", () => {
    expect(verifySessionKeyValidity(TEST_AGENT_ADDRESS, Date.now() - 1)).toBe(false);
    expect(verifySessionKeyValidity("not-an-address", Date.now() + 60_000)).toBe(false);
  });
});

describe("hl/auth — Pgate risk gate integration", () => {
  const wallet = new Wallet(TEST_PRIVATE_KEY);
  const action = { type: "order", orders: [] };
  const nonce = Date.now();

  it("isSigningChannelLocked detects all lock conditions", () => {
    expect(isSigningChannelLocked({})).toBe(false);
    expect(isSigningChannelLocked({ soilResistanceTripped: true })).toBe(true);
    expect(isSigningChannelLocked({ hardlock: true })).toBe(true);
    expect(isSigningChannelLocked({ criHardlock: true })).toBe(true);
    expect(isSigningChannelLocked({ signingChannelOpen: false })).toBe(true);
  });

  it("signHyperliquidAction throws SigningChannelLockedError on soil trip", async () => {
    await expect(
      signHyperliquidAction(wallet, action, nonce, {
        gate: { soilResistanceTripped: true },
      }),
    ).rejects.toBeInstanceOf(SigningChannelLockedError);
  });

  it("signHyperliquidAction throws HardlockError on R20/CRI hardlock", async () => {
    await expect(
      signHyperliquidAction(wallet, action, nonce, {
        gate: { criHardlock: true },
      }),
    ).rejects.toBeInstanceOf(HardlockError);
  });

  it("createSessionKeyAgent throws when signing channel closed", async () => {
    await expect(
      createSessionKeyAgent(wallet, TEST_AGENT_ADDRESS, 60_000, {
        gate: { signingChannelOpen: false },
      }),
    ).rejects.toBeInstanceOf(SigningChannelLockedError);
  });
});
