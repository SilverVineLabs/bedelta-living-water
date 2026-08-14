import { ZERODEV_ENTRY_POINT_ADDRESS } from "./zerodev-aa-constants";

export interface BundlerProbeResult {
  reachable: boolean;
  entryPoints: string[];
  chainId: number | null;
  supportsEntryPoint07: boolean;
  error: string | null;
}

async function bundlerRpc<T>(rpcUrl: string, method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`bundler HTTP ${res.status}`);
  const body = (await res.json()) as { result?: T; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? "bundler RPC error");
  return body.result as T;
}

export async function probeBundler(rpcUrl: string): Promise<BundlerProbeResult> {
  try {
    const entryPoints = await bundlerRpc<string[]>(rpcUrl, "eth_supportedEntryPoints");
    const chainHex = await bundlerRpc<string>(rpcUrl, "eth_chainId");
    const ep07 = ZERODEV_ENTRY_POINT_ADDRESS.toLowerCase();
    return {
      reachable: true,
      entryPoints,
      chainId: Number.parseInt(chainHex, 16),
      supportsEntryPoint07: entryPoints.some((ep) => ep.toLowerCase() === ep07),
      error: null,
    };
  } catch (err) {
    return {
      reachable: false,
      entryPoints: [],
      chainId: null,
      supportsEntryPoint07: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
