import { HL_TESTNET_EXCHANGE_URL, HL_TESTNET_INFO_URL } from "../../../config/constants";
import {
  HL_SESSION_KEY_AGENT_NAME,
  splitHyperliquidSignature,
  type ApproveAgentAction,
  type SessionKeyAgentResult,
} from "../auth";
import { postExchangeRequest } from "../execution-transport";
import type { SessionKeyContext } from "../execution-types";
import { sanitizeSessionKeyForMasterWalletTrading } from "../execution-types";
import type { HyperliquidExchangeResponse } from "../execution-types";
import { OnChainFillFailedError } from "../hl-order-response";
import {
  extractHlExchangeErrorDetail,
  isHlAgentAlreadyUsedError,
} from "./agentRegisterErrors";
import { fetchHlTestnetPerpsMargin } from "./marginChecker";

export {
  extractHlExchangeErrorDetail,
  isHlAgentAlreadyUsedError,
  isHlTelemetryFallbackError,
  isHlUserWalletMissingError,
} from "./agentRegisterErrors";

export const HL_AGENT_L2_INDEX_DELAY_MS = 1_500;
export const HL_AGENT_L2_INDEX_MAX_ATTEMPTS = 5;
export const HL_AGENT_L2_INDEX_POLL_MS = 1_000;
export const HL_AGENT_REGISTRATION_TIMEOUT_MS = 10_000;
export const HL_SESSION_KEY_TTL_MS = 24 * 60 * 60 * 1000;

export interface HlExtraAgentRecord {
  name: string;
  address: string;
  validUntil: number | null;
}

/** Hyperliquid rejects approveAgent when agentName is empty or longer than 16 chars. */
function withValidApproveAgentName(action: ApproveAgentAction): ApproveAgentAction {
  const raw = action.agentName?.trim();
  const agentName =
    raw && raw.length >= 1 && raw.length <= 16 ? raw : HL_SESSION_KEY_AGENT_NAME;
  return agentName === action.agentName ? action : { ...action, agentName };
}

/** Query HL info API for wallet-authorized session-key agents. */
export async function fetchHlExtraAgents(
  user: string,
  options: {
    fetchFn?: typeof fetch;
    infoUrl?: string;
    timeoutMs?: number;
  } = {},
): Promise<HlExtraAgentRecord[]> {
  const fetchFn = options.fetchFn ?? fetch;
  const infoUrl = options.infoUrl ?? HL_TESTNET_INFO_URL;
  const timeoutMs = options.timeoutMs ?? HL_AGENT_REGISTRATION_TIMEOUT_MS;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetchFn(infoUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "extraAgents", user }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((entry) => {
        const row = entry as {
          name?: unknown;
          address?: unknown;
          validUntil?: unknown;
        };
        const address = String(row.address ?? "").trim();
        if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
        const validUntilRaw = row.validUntil;
        const validUntil =
          validUntilRaw == null || validUntilRaw === ""
            ? null
            : Number(validUntilRaw);
        return {
          name: String(row.name ?? ""),
          address: address.toLowerCase(),
          validUntil: Number.isFinite(validUntil) ? validUntil : null,
        };
      })
      .filter((entry): entry is HlExtraAgentRecord => entry != null);
  } catch {
    return [];
  }
}

/** True when the deterministic session-key agent is already authorized on HL L2. */
export function findActiveRegisteredSessionKeyAgent(
  agents: readonly HlExtraAgentRecord[],
  agentAddress: string,
  options: {
    agentName?: string;
    nowMs?: number;
  } = {},
): HlExtraAgentRecord | null {
  const agentName = options.agentName ?? HL_SESSION_KEY_AGENT_NAME;
  const nowMs = options.nowMs ?? Date.now();
  const normalized = agentAddress.toLowerCase();
  return (
    agents.find(
      (agent) =>
        agent.address === normalized &&
        agent.name === agentName &&
        (agent.validUntil == null || agent.validUntil > nowMs),
    ) ?? null
  );
}

export async function isSessionKeyAgentRegisteredOnL2(
  walletAddress: string,
  agentAddress: string,
  options: {
    fetchFn?: typeof fetch;
    infoUrl?: string;
    agentName?: string;
  } = {},
): Promise<HlExtraAgentRecord | null> {
  const agents = await fetchHlExtraAgents(walletAddress, options);
  return findActiveRegisteredSessionKeyAgent(agents, agentAddress, {
    agentName: options.agentName,
  });
}

export function buildReusedSessionKeyContext(
  agentAddress: string,
  validUntilMs: number | null,
  masterWalletAddress: string,
  nowMs = Date.now(),
): SessionKeyContext {
  const expiresAt =
    validUntilMs != null && validUntilMs > nowMs
      ? validUntilMs
      : nowMs + HL_SESSION_KEY_TTL_MS;
  return sanitizeSessionKeyForMasterWalletTrading(
    {
      agentAddress: agentAddress.toLowerCase(),
      expiresAt,
      masterWalletAddress: masterWalletAddress.toLowerCase(),
    },
    masterWalletAddress,
  );
}

/** Poll extraAgents + clearinghouseState until L2 indexes the approved agent. */
export async function awaitAgentIndexedOnL2(
  masterWalletAddress: string,
  agentAddress: string,
  options: {
    fetchFn?: typeof fetch;
    infoUrl?: string;
    maxAttempts?: number;
    intervalMs?: number;
  } = {},
): Promise<void> {
  const fetchFn = options.fetchFn ?? fetch;
  const maxAttempts = options.maxAttempts ?? HL_AGENT_L2_INDEX_MAX_ATTEMPTS;
  const intervalMs = options.intervalMs ?? HL_AGENT_L2_INDEX_POLL_MS;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const registered = await isSessionKeyAgentRegisteredOnL2(
      masterWalletAddress,
      agentAddress,
      { fetchFn, infoUrl: options.infoUrl },
    );
    if (registered) {
      const margin = await fetchHlTestnetPerpsMargin(masterWalletAddress, fetchFn);
      if (margin.apiOk) return;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new OnChainFillFailedError(
    `L2 agent ${agentAddress} not linked to master ${masterWalletAddress} after ${maxAttempts} polls`,
  );
}

function withFetchTimeout(fetchFn: typeof fetch, timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchFn(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };
}

/** POST wallet-signed ApproveAgent to Hyperliquid L2 exchange (testnet default). */
export async function registerApprovedAgentOnHlExchange(
  agentResult: SessionKeyAgentResult,
  options: {
    fetchFn?: typeof fetch;
    exchangeUrl?: string;
    timeoutMs?: number;
  } = {},
): Promise<HyperliquidExchangeResponse> {
  const baseFetch = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? HL_AGENT_REGISTRATION_TIMEOUT_MS;
  const fetchFn = withFetchTimeout(baseFetch, timeoutMs);
  const exchangeUrl = options.exchangeUrl ?? HL_TESTNET_EXCHANGE_URL;
  const action = withValidApproveAgentName(agentResult.action);
  return postExchangeRequest(
    {
      action: action as unknown as Record<string, unknown>,
      nonce: agentResult.nonce,
      signature: splitHyperliquidSignature(agentResult.signature),
    },
    fetchFn,
    exchangeUrl,
  );
}

/** POST ApproveAgent + enforce L2 indexing delay before first live order. */
export async function registerAgentWithL2IndexingAwait(
  agentResult: SessionKeyAgentResult,
  options: {
    masterWalletAddress: string;
    fetchFn?: typeof fetch;
    exchangeUrl?: string;
    onRegisterStart?: (agentAddress: string) => void;
  },
): Promise<{ skippedRegistration?: boolean }> {
  options.onRegisterStart?.(agentResult.agentAddress);
  try {
    await registerApprovedAgentOnHlExchange(agentResult, options);
    await awaitAgentIndexedOnL2(
      options.masterWalletAddress,
      agentResult.agentAddress,
      { fetchFn: options.fetchFn },
    );
    return {};
  } catch (regErr) {
    const regDetail = extractHlExchangeErrorDetail(regErr);
    if (isHlAgentAlreadyUsedError(regDetail)) {
      await awaitAgentIndexedOnL2(
        options.masterWalletAddress,
        agentResult.agentAddress,
        { fetchFn: options.fetchFn },
      );
      return { skippedRegistration: true };
    }
    throw new OnChainFillFailedError(regDetail);
  }
}
