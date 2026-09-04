import { describe, expect, it, vi } from "vitest";
import { handleWorkerFetch } from "../src/worker-fetch";
import { fetchStaticAsset, isWorkerApiPath, DUNE_TELEMETRY_PORTAL_URL } from "../src/worker-routing";
import type { Env } from "../src/env";

describe("worker routing", () => {
  it("isWorkerApiPath matches /api metadata and API subpaths only", () => {
    expect(isWorkerApiPath("/api")).toBe(true);
    expect(isWorkerApiPath("/api/health")).toBe(true);
    expect(isWorkerApiPath("/api/grant-audit")).toBe(true);
    expect(isWorkerApiPath("/logs")).toBe(true);
    expect(isWorkerApiPath("/")).toBe(false);
    expect(isWorkerApiPath("/grant-audit")).toBe(false);
    expect(isWorkerApiPath("/app")).toBe(false);
  });

  it("fetchStaticAsset delegates full URL including query to ASSETS", async () => {
    const fetch = vi.fn(async () => new Response("<html/>", { status: 200 }));
    const env = { ASSETS: { fetch } } as unknown as Env;
    const req = new Request("https://bedeltawater.slivervine.xyz/?role=vault");
    const res = await fetchStaticAsset(env, req);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(req);
  });

  it("handleWorkerFetch redirects root to Dune telemetry portal", async () => {
    const env = {} as Env;
    const req = new Request("https://bedeltawater.slivervine.xyz/?role=grant");
    const res = await handleWorkerFetch(req, env, {
      waitUntil: vi.fn(),
    } as unknown as ExecutionContext);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe(DUNE_TELEMETRY_PORTAL_URL);
  });

  it("handleWorkerFetch serves JSON on /api/health", async () => {
    const env = {} as Env;
    const req = new Request("https://bedeltawater.slivervine.xyz/api/health");
    const res = await handleWorkerFetch(req, env, {
      waitUntil: vi.fn(),
    } as unknown as ExecutionContext);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    const body = (await res.json()) as { success: boolean; service: string };
    expect(body.success).toBe(true);
    expect(body.service).toBe("bedelta-living-water");
  });
});
