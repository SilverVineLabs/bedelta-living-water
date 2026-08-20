/** Grant audit — precomputed payload KV cache (cron → EXECUTION_LOGS_KV). */
import type { Env } from "../../env";
import { buildGrantAuditPayload } from "./grant-audit-payload";
import {
  GRANT_AUDIT_PAYLOAD_KV_KEY,
  GRANT_AUDIT_PAYLOAD_KV_TTL_SECONDS,
  writeGrantAuditPrecomputedPayload,
} from "./grant-audit-kv";

/** Cron tick — build full payload and persist to KV for fast `/api/grant-audit` reads. */
export async function refreshGrantAuditPayloadCache(env: Env): Promise<void> {
  const kv = env.EXECUTION_LOGS_KV;
  if (!kv) return;

  const payload = await buildGrantAuditPayload(env, null);
  await writeGrantAuditPrecomputedPayload(kv, payload);
}

export { GRANT_AUDIT_PAYLOAD_KV_KEY, GRANT_AUDIT_PAYLOAD_KV_TTL_SECONDS };
