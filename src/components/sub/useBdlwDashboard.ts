/** Dashboard state + handlers for App.tsx */
import { useEffect, useMemo, useState } from "react";
import { type DepositTrancheId, resolveDepositTrancheConfig } from "./deposit-tranche-config";
import { runDepositPreviewByTranche } from "./hud/smart-route-deposit-flow";
import { BRIDGE_TIMEOUT_FAIL_CLOSED, resolveComplianceAlertsFromReasons } from "./compliance-trip-alerts";

const DEMO_WALLET = "0xcccccccccccccccccccccccccccccccccccccccc" as const;
export const DYNAMIC_APY_RANGE = { minPercent: 8.2, maxPercent: 11.8 } as const;
export const YIELD_SOURCES = [
  "GMX v2 Base GM Pool Yield (ETH/USDC & BTC/USDC)",
  "Skew Neutralizer Premium (+5bps ~ +10bps via native uiFeeReceiver)",
  "Hyperliquid 1x Delta-Neutral Funding Cushion",
] as const;

export function useBdlwDashboard() {
  const [depositTranche, setDepositTranche] = useState<DepositTrancheId>("tranche-a-native");
  const [sendAmount, setSendAmount] = useState("250.00");
  const [receiveToken, setReceiveToken] = useState("GM_LP");
  const [receiveChain, setReceiveChain] = useState("arbitrum");
  const [walletConnected, setWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [shieldLogs, setShieldLogs] = useState<string[]>([
    "[p50: 106µs] checkSoilResistance() -> ALLOW",
    "[edge] rootProtection() standby · hot-path armed",
  ]);
  const trancheConfig = useMemo(() => resolveDepositTrancheConfig(depositTranche), [depositTranche]);
  const amountUsd = useMemo(() => Number.parseFloat(sendAmount), [sendAmount]);
  const depositPreview = useMemo(() => {
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) return null;
    return runDepositPreviewByTranche({ tranche: depositTranche, amountUsd, wallet: DEMO_WALLET });
  }, [amountUsd, depositTranche]);
  const complianceAlerts = useMemo(() => resolveComplianceAlertsFromReasons(shieldLogs), [shieldLogs]);
  const shieldComplianceAlerts = useMemo(() => complianceAlerts.filter((a) => a.code !== BRIDGE_TIMEOUT_FAIL_CLOSED), [complianceAlerts]);
  const amlComplianceAlerts = useMemo(() => complianceAlerts.filter((a) => a.code === BRIDGE_TIMEOUT_FAIL_CLOSED), [complianceAlerts]);
  const bridgeStateActive = useMemo(() => {
    if (depositTranche !== "tranche-b-robinhood") return undefined;
    if (isDepositing) return "IN_FLIGHT_BRIDGE_CAPITAL";
    return depositPreview?.ok ? "AVAILABLE" : undefined;
  }, [depositPreview?.ok, depositTranche, isDepositing]);
  useEffect(() => {
    if (!depositPreview?.payloadHash) return;
    setShieldLogs((prev) => {
      const line = `[gate] payloadHash bound · ${depositPreview.payloadHash?.slice(0, 12)}…`;
      return prev.at(-1) === line ? prev : [...prev.slice(-7), line];
    });
  }, [depositPreview?.payloadHash]);
  const onDepositTrancheChange = (tranche: DepositTrancheId): void => {
    const next = resolveDepositTrancheConfig(tranche);
    setDepositTranche(tranche);
    setReceiveToken(next.receiveToken);
    setReceiveChain(next.receiveChain);
    setShieldLogs((prev) => [...prev.slice(-6), `[tranche] ${next.label} selected · ${next.subtitle}`]);
  };
  const onConnectWallet = (): void => {
    setIsConnecting(true);
    window.setTimeout(() => {
      setWalletConnected(true);
      setIsConnecting(false);
    }, 600);
  };
  const onDeposit = (): void => {
    setIsDepositing(true);
    window.setTimeout(() => {
      setShieldLogs((prev) => [
        ...prev.slice(-7),
        depositTranche === "tranche-b-robinhood"
          ? "[escort] Tranche B · Across bridge IN_FLIGHT · lostUsd ≡ 0"
          : "[native] Tranche A · Arbitrum GM vault deposit queued",
      ]);
      setIsDepositing(false);
    }, 900);
  };
  return {
    depositTranche, sendAmount, setSendAmount, receiveToken, setReceiveToken, receiveChain, setReceiveChain,
    walletConnected, setWalletConnected, isConnecting, isDepositing, shieldLogs, trancheConfig, depositPreview,
    shieldComplianceAlerts, amlComplianceAlerts, bridgeStateActive,
    onDepositTrancheChange, onConnectWallet, onDeposit,
    onJoinVault: () => (walletConnected ? onDeposit() : onConnectWallet()),
    onInspectSoilRadar: () => setShieldLogs((prev) => [...prev.slice(-7), "[radar] soil depth · cross-venue · oracle variance scan OK", "[p50: 106µs] checkSoilResistance() -> ALLOW · lostUsd ≡ 0"]),
  };
}
