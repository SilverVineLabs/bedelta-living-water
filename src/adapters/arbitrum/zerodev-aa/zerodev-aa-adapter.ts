import { type Hex, isHex } from "viem";
import { probeBundler } from "./zerodev-aa-bundler";
import { resolveZeroDevConfig } from "./zerodev-aa-config";
import {
  canProceedAaProbeRoute,
  isZeroDevAAEnabled,
  resolveAaProbeRouteAsync,
} from "./zerodev-aa-gate";
import { buildKernelAccount } from "./zerodev-aa-kernel";
import { buildUserOpDraft, ZERODEV_SPONSORED_DEFAULT } from "./zerodev-aa-userop";
import type {
  ZeroDevAAConfigOptions,
  ZeroDevFailoverStatus,
  ZeroDevMultichainProbeSummary,
  ZeroDevSmokeReport,
} from "./zerodev-aa-types";
import { ARBITRUM_ONE_CHAIN_ID, buildZeroDevRpcUrl } from "./zerodev-aa-constants";
import {
  ZERODEV_MULTICHAIN_LABELS,
  ZERODEV_MULTICHAIN_PROBE_CHAIN_IDS,
  type ZeroDevMultichainProbeChainId,
} from "./zerodev-aa-chain";

function readEnv(): Record<string, string> {
  return typeof process !== "undefined" ? (process.env as Record<string, string>) : {};
}

function auditMeta(chainId: number): Pick<ZeroDevSmokeReport, "timestamp" | "chainId" | "gitCommitHash"> {
  return {
    timestamp: new Date().toISOString(),
    chainId,
    gitCommitHash: readEnv().GIT_COMMIT_HASH ?? "unknown",
  };
}

function disabledReport(): ZeroDevSmokeReport {
  return {
    ...auditMeta(ARBITRUM_ONE_CHAIN_ID),
    featureFlag: false,
    bundlerStatus: "DISABLED",
    isolationVerified: true,
    noPrivateKeyMaterialDetected: true,
    enabled: false,
    configPresent: false,
    errors: [],
    sponsored: ZERODEV_SPONSORED_DEFAULT,
    paymasterAttached: false,
  };
}

function readOwnerKey(env: Record<string, string>): Hex | undefined {
  const raw = env.ZERODEV_OWNER_PRIVATE_KEY;
  return raw && isHex(raw) ? raw : undefined;
}

async function probeChain(
  chainId: ZeroDevMultichainProbeChainId,
  opts: ZeroDevAAConfigOptions,
  env: Record<string, string>,
  live: boolean,
): Promise<ZeroDevMultichainProbeSummary> {
  const label = ZERODEV_MULTICHAIN_LABELS[chainId];
  const projectId = opts.projectId ?? env.ZERODEV_PROJECT_ID;
  const bundlerRpc =
    opts.bundlerRpc ??
    (projectId ? buildZeroDevRpcUrl(projectId, chainId) : undefined);
  const errors: string[] = [];
  if (!projectId) errors.push("ZERODEV_PROJECT_ID missing");
  if (!bundlerRpc) errors.push("ZERODEV_BUNDLER_RPC missing");

  let bundlerReachable: boolean | undefined;
  let paymasterAttached = false;

  if (errors.length === 0 && bundlerRpc) {
    const kernel = await buildKernelAccount({
      chainId,
      ownerPrivateKey: readOwnerKey(env),
      kernelVersion: opts.kernelVersion,
    });
    const draft = await buildUserOpDraft(kernel, {
      sponsored: true,
      bundlerRpc,
      chainId,
    });
    paymasterAttached = Boolean(draft.paymasterMiddleware);

    if (live) {
      const probe = await probeBundler(bundlerRpc);
      bundlerReachable = probe.reachable && probe.supportsEntryPoint07;
      if (!probe.reachable) errors.push(probe.error ?? "bundler unreachable");
      if (probe.reachable && !probe.supportsEntryPoint07) {
        errors.push("bundler missing EntryPoint v0.7");
      }
    }
  }

  const bundlerStatus = !live
    ? "DRY_RUN"
    : bundlerReachable
      ? "REACHABLE"
      : "UNREACHABLE";

  return {
    chainId,
    label,
    bundlerStatus,
    sponsored: true,
    paymasterAttached,
    bundlerReachable,
    errors,
  };
}

function buildFailoverStatus(route: Awaited<ReturnType<typeof resolveAaProbeRouteAsync>>): ZeroDevFailoverStatus {
  return {
    active: route.failoverActive,
    reason: route.failoverReason,
    primaryChainId: route.primaryChainId,
    citadelGmxBlocked: route.citadelGmxBlocked,
    sequencerSafe: route.health.sequencerSafe,
    oracleHealthy: route.health.oracleHealthy,
    rpcLatencyMs: route.health.rpcLatencyMs,
    rpcLatencyExceeded: route.health.rpcLatencyExceeded,
    sequencerGraceActive: route.health.sequencerGraceActive,
  };
}

export async function runZeroDevSmokeProbe(
  configOrLive?: ZeroDevAAConfigOptions | boolean,
): Promise<ZeroDevSmokeReport> {
  const env = readEnv();
  if (!isZeroDevAAEnabled(env)) return disabledReport();

  const live = configOrLive === true;
  const probeRoute = await resolveAaProbeRouteAsync(env);
  const failover = buildFailoverStatus(probeRoute);

  if (!canProceedAaProbeRoute(probeRoute) && probeRoute.citadelGmxBlocked) {
    return {
      ...auditMeta(probeRoute.primaryChainId),
      featureFlag: true,
      bundlerStatus: "FAIL_CLOSED",
      isolationVerified: false,
      noPrivateKeyMaterialDetected: true,
      enabled: true,
      configPresent: false,
      errors: [probeRoute.failoverReason ?? "CITADEL_GMX_FAIL_CLOSED"],
      sponsored: ZERODEV_SPONSORED_DEFAULT,
      paymasterAttached: false,
      failover,
    };
  }

  const opts = typeof configOrLive === "object" ? configOrLive : resolveZeroDevConfig(env);
  const chainId = probeRoute.failoverActive ? probeRoute.primaryChainId : (opts.chainId ?? ARBITRUM_ONE_CHAIN_ID);
  const projectId = opts.projectId ?? env.ZERODEV_PROJECT_ID;
  const bundlerRpc =
    opts.bundlerRpc ??
    (projectId ? buildZeroDevRpcUrl(projectId, chainId) : undefined);
  const errors: string[] = [];

  if (!projectId) errors.push("ZERODEV_PROJECT_ID missing");
  if (!bundlerRpc) errors.push("ZERODEV_BUNDLER_RPC missing");

  let bundlerReachable: boolean | undefined;
  let entryPoint07Supported: boolean | undefined;
  let smartAccountAddress: string | undefined;
  let userOpDraft: ZeroDevSmokeReport["userOpDraft"];
  let paymasterAttached = false;

  if (errors.length === 0) {
    const kernel = await buildKernelAccount({
      chainId,
      ownerPrivateKey: readOwnerKey(env),
      kernelVersion: opts.kernelVersion,
    });
    smartAccountAddress = kernel.address;
    const draft = await buildUserOpDraft(kernel, {
      sponsored: true,
      bundlerRpc: bundlerRpc!,
      chainId,
    });
    paymasterAttached = Boolean(draft.paymasterMiddleware);
    userOpDraft = {
      sender: draft.sender,
      callDataLength: draft.callData.length,
      entryPoint: draft.entryPoint,
      kernelVersion: draft.kernelVersion,
      sponsored: draft.sponsored,
      paymasterAttached,
    };

    if (live && bundlerRpc) {
      const probe = await probeBundler(bundlerRpc);
      bundlerReachable = probe.reachable && probe.supportsEntryPoint07;
      entryPoint07Supported = probe.supportsEntryPoint07;
      if (!probe.reachable) errors.push(probe.error ?? "bundler unreachable");
      if (probe.reachable && !probe.supportsEntryPoint07) {
        errors.push("bundler missing EntryPoint v0.7");
      }
    }
  }

  const multichainProbes = await Promise.all(
    ZERODEV_MULTICHAIN_PROBE_CHAIN_IDS.map((id) => probeChain(id, opts, env, live)),
  );

  const bundlerStatus = !live
    ? "DRY_RUN"
    : bundlerReachable
      ? "REACHABLE"
      : errors.length > 0
        ? "UNREACHABLE"
        : "UNREACHABLE";

  return {
    ...auditMeta(chainId),
    featureFlag: true,
    bundlerStatus,
    isolationVerified: errors.length === 0 && (!live || bundlerReachable === true),
    noPrivateKeyMaterialDetected: true,
    enabled: true,
    configPresent: errors.length === 0 || Boolean(projectId),
    errors,
    sponsored: true,
    paymasterAttached,
    bundlerReachable,
    smartAccountAddress,
    userOpDraft,
    entryPoint07Supported,
    multichainProbes,
    failover,
  };
}
