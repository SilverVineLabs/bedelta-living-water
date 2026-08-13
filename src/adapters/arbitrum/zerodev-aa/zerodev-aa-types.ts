export interface ZeroDevAAConfigOptions {
  pmKey?: string;
  kernelVersion?: string;
  chainId?: number;
  projectId?: string;
  bundlerRpc?: string;
}

export interface ZeroDevAAEnvConfig extends ZeroDevAAConfigOptions {
  projectId: string;
  bundlerRpc: string;
}

export interface UserOpDraftSummary {
  sender: string;
  callDataLength: number;
  entryPoint: string;
  kernelVersion: string;
  sponsored: boolean;
  paymasterAttached: boolean;
}

export interface ZeroDevMultichainProbeSummary {
  chainId: number;
  label: string;
  bundlerStatus: string;
  sponsored: boolean;
  paymasterAttached: boolean;
  bundlerReachable?: boolean;
  errors: string[];
}

export interface ZeroDevFailoverStatus {
  active: boolean;
  reason: string | null;
  primaryChainId: number;
  citadelGmxBlocked: boolean;
  sequencerSafe: boolean;
  oracleHealthy: boolean;
  rpcLatencyMs: number | null;
  rpcLatencyExceeded: boolean;
  sequencerGraceActive: boolean;
}

export interface ZeroDevSmokeReport {
  featureFlag: boolean;
  bundlerStatus: string;
  isolationVerified: boolean;
  noPrivateKeyMaterialDetected: boolean;
  timestamp: string;
  chainId: number;
  gitCommitHash: string;
  enabled: boolean;
  configPresent: boolean;
  errors: string[];
  sponsored: boolean;
  paymasterAttached: boolean;
  bundlerReachable?: boolean;
  smartAccountAddress?: string;
  userOpDraft?: UserOpDraftSummary;
  entryPoint07Supported?: boolean;
  multichainProbes?: ZeroDevMultichainProbeSummary[];
  failover?: ZeroDevFailoverStatus;
}
