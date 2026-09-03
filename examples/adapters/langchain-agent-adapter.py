#!/usr/bin/env python3
"""
SliverVine Citadel Shield — LangChain BaseTool (Python) adapter.

Citadel REST endpoint spec (Edge pre-execution soil fuse):
  POST {SLIVERVINE_CITADEL_API_URL}/api/hedge/evaluate
  Body: {
    "marketPrice": 0.05,
    "thresholdProb": 0.08,
    "soil": { "symbol", "hlSpot", "hlPerp", "dydxPerp", "depthUsd" }
  }
  200 + success=true           => ALLOW (hedge channel active, soil pass)
  422 + code=SOIL_RESISTANCE_TRIP => FAIL_CLOSED (0-Gas pre-broadcast severance)
  403 + code=R20_LOCKED        => FAIL_CLOSED (signing channel severed)

Usage:
  python examples/adapters/langchain-agent-adapter.py          # ALLOW (live REST)
  python examples/adapters/langchain-agent-adapter.py --trip   # FAIL_CLOSED

Optional: pip install langchain-core pydantic
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Optional, Type

R = "\033[0m"
RED = "\033[31;1m"
GREEN = "\033[32;1m"
YELLOW = "\033[33;1m"
CYAN = "\033[36;1m"
GRAY = "\033[90m"
BOLD = "\033[1m"
BOX_W = 63

DEFAULT_API_URL = "https://bedeltawater.slivervine.xyz"
DEFAULT_MARKET_PRICE = 0.05

HEALTHY_SOIL: dict[str, Any] = {
    "symbol": "ETH",
    "hlSpot": 3500,
    "hlPerp": 3500,
    "dydxPerp": 3500,
    "depthUsd": 200_000,
}

TOXIC_SOIL: dict[str, Any] = {
    **HEALTHY_SOIL,
    "depthUsd": 1,
    "hlPerp": 4200,
    "hlSpot": 3500,
}


class CitadelShieldTrip(Exception):
    """Raised when Citadel REST returns SOIL_RESISTANCE_TRIP or R20_LOCKED."""


def _pad_banner(text: str) -> str:
    inner = f" {text} "
    pad = max(0, BOX_W - len(inner))
    return f"{'─' * (pad // 2)}{inner}{'─' * ((pad + 1) // 2)}"


def print_banner(subtitle: str) -> None:
    inner = f"🛡️  SliverVine Citadel Shield · {subtitle}"
    print(f"{CYAN}┌{'─' * BOX_W}┐{R}")
    print(f"{CYAN}│{R}{BOLD}{_pad_banner(inner)}{R}{CYAN}│{R}")
    print(f"{CYAN}└{'─' * BOX_W}┘{R}")


def print_mode(trip: bool) -> None:
    label = "ROGUE_TOXIC_INTENT (--trip)" if trip else "NORMAL_INTENT"
    color = RED if trip else GREEN
    print(f"{BOLD}MODE:{R} {color}{label}{R}\n")


def print_result(pass_ok: bool) -> None:
    line = "═" * (BOX_W + 2)
    if pass_ok:
        print(f"\n{GREEN}{line}{R}")
        print(f"{GREEN}{BOLD}RESULT: ✅ LIFECYCLE COMPLETE: PASS (Pre-Broadcast Allowed){R}")
        print(f"{GREEN}{line}{R}")
        return
    print(f"\n{RED}{line}{R}")
    print(f"{RED}{BOLD}RESULT: 🛑 LIFECYCLE COMPLETE: FAIL_CLOSED (0-Gas Intercepted){R}")
    print(f"{RED}{line}{R}")


def _format_latency(latency_us: float) -> str:
    ms = latency_us / 1000
    if ms >= 1:
        return f"{YELLOW}{ms:.1f}ms{R}"
    return f"{YELLOW}{latency_us:.1f}µs{R}"


def hud_line(tag: str, body: str, color: str) -> None:
    print(f"{color}{BOLD}[{tag}]{R}    {body}")


def hud_intent(agent_id: str, framework: str, intent: str, venue: str) -> None:
    hud_line("INTENT", f"agentId: {CYAN}{agent_id}{R} | framework: {CYAN}{framework}{R}", CYAN)
    hud_line("INTENT", f"intent: {intent} | venue: {venue}", GRAY)


def hud_soil_fuse(pass_ok: bool, latency_us: float, error: str = "") -> None:
    if not pass_ok and error:
        hud_line("ALERT", error, RED)
    pass_label = f"{GREEN}true{R}" if pass_ok else f"{RED}false{R}"
    hud_line(
        "FUSE",
        f"POST /api/hedge/evaluate -> PASS: {pass_label} | latency: {_format_latency(latency_us)} {GRAY}(Edge p50: ~106µs){R}",
        GREEN if pass_ok else YELLOW,
    )


def hud_severed(trigger: str) -> None:
    hud_line("SEVERED", f"EIP-712 Signature Channel: {RED}CLOSED{R} (Fail-Closed · {trigger})", RED)


def hud_blocked() -> None:
    hud_line("BLOCKED", f"UserOp Dispatch: {RED}REJECTED{R} | Gas Cost: {CYAN}0-Gas (Pre-Broadcast){R}", RED)


def hud_channel_open() -> None:
    hud_line("CHANNEL", f"EIP-712 Signature Channel: {GREEN}OPEN{R}", GREEN)


def hud_dispatched(target: str, latency_us: float) -> None:
    hud_line(
        "DISPATCH",
        f"UserOp Dispatch: {GREEN}ALLOWED{R} | target: {target} | latency: {_format_latency(latency_us)}",
        GREEN,
    )


class CitadelRestClient:
    """Thin client for Citadel Edge pre-execution soil evaluation."""

    def __init__(self, base_url: str = DEFAULT_API_URL, timeout_s: float = 10.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

    def evaluate_soil(
        self,
        soil: dict[str, Any],
        *,
        market_price: float = DEFAULT_MARKET_PRICE,
        threshold_prob: float = 0.08,
    ) -> dict[str, Any]:
        url = f"{self.base_url}/api/hedge/evaluate"
        payload = {
            "marketPrice": market_price,
            "thresholdProb": threshold_prob,
            "soil": soil,
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                raise CitadelShieldTrip(f"HTTP {exc.code}: {raw}") from exc
            code = body.get("code", "CITADEL_TRIP")
            error = body.get("error", raw)
            raise CitadelShieldTrip(f"[Citadel Shield Trip] {code}: {error}") from exc
        if not body.get("success"):
            raise CitadelShieldTrip(body.get("error", "Citadel evaluation failed"))
        return body


def invoke_pre_execution_guard(
    soil: dict[str, Any],
    *,
    agent_id: str = "langchain-python-agent",
    intent: str = "TRADE_INTENT",
    api_url: Optional[str] = None,
    hud: bool = False,
) -> str:
    client = CitadelRestClient(api_url or os.environ.get("SLIVERVINE_CITADEL_API_URL", DEFAULT_API_URL))
    if hud:
        hud_intent(agent_id, "LangChain Python", intent, "GMX v2 ETH/USDC GM")
    t0 = time.perf_counter()
    try:
        client.evaluate_soil(soil)
        latency_us = (time.perf_counter() - t0) * 1_000_000
        if hud:
            hud_soil_fuse(True, latency_us)
            hud_channel_open()
            hud_dispatched("LangChain BaseTool → GMX v2 GM", latency_us)
        return "SOIL_PASS: pre-broadcast clearance granted"
    except CitadelShieldTrip as exc:
        latency_us = (time.perf_counter() - t0) * 1_000_000
        if hud:
            hud_soil_fuse(False, latency_us, str(exc))
            hud_severed("SOIL_FUSE_TRIP")
            hud_blocked()
        raise


try:
    from langchain_core.tools import BaseTool
    from pydantic import BaseModel, ConfigDict, Field

    class SoilGuardInput(BaseModel):
        """Zod-compatible JSON schema for LangChain tool args."""

        model_config = ConfigDict(populate_by_name=True)

        symbol: str = Field(description="Asset symbol (e.g. ETH)")
        hlSpot: float = Field(description="Hyperliquid spot reference")
        hlPerp: float = Field(description="Hyperliquid perp mark")
        dydxPerp: float = Field(description="dYdX perp mark")
        depthUsd: float = Field(description="Order book depth USD")
        intent: Optional[str] = Field(default=None, description="Agent intent label")
        agentId: Optional[str] = Field(default=None, description="LangChain agent identifier")

    class SlivervinePreExecutionGuardTool(BaseTool):
        """LangChain BaseTool wrapping Citadel REST pre-execution soil guard."""

        name: str = "slivervine_pre_execution_guard"
        description: str = (
            "Pre-consensus intent firewall — calls Citadel Edge POST /api/hedge/evaluate "
            "before any trade intent is signed or broadcast."
        )
        args_schema: Type[BaseModel] = SoilGuardInput
        api_base_url: str = DEFAULT_API_URL
        market_price: float = DEFAULT_MARKET_PRICE

        def _run(
            self,
            symbol: str,
            hlSpot: float,
            hlPerp: float,
            dydxPerp: float,
            depthUsd: float,
            intent: Optional[str] = None,
            agentId: Optional[str] = None,
            **_: Any,
        ) -> str:
            soil = {
                "symbol": symbol,
                "hlSpot": hlSpot,
                "hlPerp": hlPerp,
                "dydxPerp": dydxPerp,
                "depthUsd": depthUsd,
            }
            return invoke_pre_execution_guard(
                soil,
                agent_id=agentId or "langchain-python-agent",
                intent=intent or "TRADE_INTENT",
                api_url=self.api_base_url,
                hud=False,
            )

except ImportError:
    BaseTool = None  # type: ignore[misc, assignment]
    SlivervinePreExecutionGuardTool = None  # type: ignore[misc, assignment]
    SoilGuardInput = None  # type: ignore[misc, assignment]


def main() -> int:
    parser = argparse.ArgumentParser(description="SliverVine Citadel LangChain Python adapter demo")
    parser.add_argument("--trip", action="store_true", help="Demonstrate FAIL_CLOSED with toxic soil")
    args = parser.parse_args()

    print_banner("LangChain Python BaseTool Adapter")
    print_mode(args.trip)

    soil = TOXIC_SOIL if args.trip else HEALTHY_SOIL
    intent = "PROMPT_INJECTION_HIGH_SLIPPAGE_OPEN" if args.trip else "DELTA_NEUTRAL_GM_DEPOSIT"

    try:
        invoke_pre_execution_guard(
            soil,
            agent_id="langchain-python-demo",
            intent=intent,
            hud=True,
        )
        print_result(True)
        return 0
    except CitadelShieldTrip as exc:
        print_result(False)
        print(f"{RED}{exc}{R}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
