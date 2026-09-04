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

COOLDOWN_MS = 60_000
_active_cooldowns: dict[str, float] = {}


def _activate_cooldown(agent_id: str) -> None:
    _active_cooldowns[agent_id] = time.time() * 1000 + COOLDOWN_MS


def _check_cooldown(agent_id: str) -> Optional[dict[str, Any]]:
    until_ms = _active_cooldowns.get(agent_id)
    if until_ms is None:
        return None
    now_ms = time.time() * 1000
    if now_ms < until_ms:
        return {
            "status": "FAIL_CLOSED",
            "code": "MANDATORY_COOLDOWN_ACTIVE",
            "agentId": agent_id,
            "cooldown_ms": int(until_ms - now_ms),
            "do_not_retry": True,
            "error": (
                f"[Citadel Back-off] MANDATORY_COOLDOWN_ACTIVE: Agent '{agent_id}' tripped soil fuse recently. "
                "DO NOT RETRY or invoke LLM inference to prevent token burn and RPC rate limits."
            ),
        }
    _active_cooldowns.pop(agent_id, None)
    return None


def format_soil_trip_json(agent_id: str, error: str, cooldown_ms: int = COOLDOWN_MS) -> str:
    return json.dumps(
        {
            "status": "FAIL_CLOSED",
            "code": "SOIL_RESISTANCE_TRIP",
            "agentId": agent_id,
            "error": error,
            "cooldown_ms": cooldown_ms,
            "do_not_retry": True,
        },
        indent=2,
    )


class CitadelShieldTrip(Exception):
    """Raised when Citadel REST returns SOIL_RESISTANCE_TRIP or R20_LOCKED."""

    def __init__(self, message: str, *, payload: Optional[dict[str, Any]] = None) -> None:
        super().__init__(message)
        self.payload = payload


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


def hud_backoff(agent_id: str, remaining_sec: int) -> None:
    hud_line(
        "BACK-OFF",
        f"LLM Back-off active for agent {CYAN}{agent_id}{R} — {YELLOW}DO NOT RETRY{R} or invoke LLM inference for {YELLOW}{remaining_sec}s{R}",
        YELLOW,
    )


def print_backoff_result() -> None:
    line = "═" * (BOX_W + 2)
    print(f"\n{YELLOW}{line}{R}")
    print(f"{YELLOW}{BOLD}RESULT: ⏸️  MANDATORY_COOLDOWN_ACTIVE (LLM Back-off Engaged){R}")
    print(f"{YELLOW}{line}{R}")


def print_backoff_divider() -> None:
    print(f"\n{CYAN}{BOLD}--- LLM Back-off Demo: immediate retry (same agentId) ---{R}\n")


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
    raise_on_trip: bool = True,
) -> str:
    cooldown = _check_cooldown(agent_id)
    if cooldown is not None:
        if hud:
            hud_backoff(agent_id, max(1, cooldown["cooldown_ms"] // 1000))
        payload = json.dumps(cooldown, indent=2)
        if raise_on_trip:
            raise CitadelShieldTrip(cooldown["error"], payload=cooldown)
        return payload

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
        _activate_cooldown(agent_id)
        trip_payload = {
            "status": "FAIL_CLOSED",
            "code": "SOIL_RESISTANCE_TRIP",
            "agentId": agent_id,
            "error": str(exc),
            "cooldown_ms": COOLDOWN_MS,
            "do_not_retry": True,
        }
        if hud:
            hud_soil_fuse(False, latency_us, str(exc))
            hud_severed("SOIL_FUSE_TRIP")
            hud_blocked()
        payload = json.dumps(trip_payload, indent=2)
        if raise_on_trip:
            raise CitadelShieldTrip(str(exc), payload=trip_payload) from exc
        return payload


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
            resolved_agent = agentId or "langchain-python-agent"
            try:
                return invoke_pre_execution_guard(
                    soil,
                    agent_id=resolved_agent,
                    intent=intent or "TRADE_INTENT",
                    api_url=self.api_base_url,
                    hud=False,
                    raise_on_trip=True,
                )
            except CitadelShieldTrip as exc:
                if exc.payload is not None:
                    return json.dumps(exc.payload, indent=2)
                return format_soil_trip_json(resolved_agent, str(exc))

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
    agent_id = "langchain-python-demo"

    if not args.trip:
        try:
            invoke_pre_execution_guard(soil, agent_id=agent_id, intent=intent, hud=True)
            print_result(True)
            return 0
        except CitadelShieldTrip as exc:
            print_result(False)
            print(f"{RED}{exc}{R}", file=sys.stderr)
            return 1

    try:
        invoke_pre_execution_guard(soil, agent_id=agent_id, intent=intent, hud=True)
        print_result(True)
        return 0
    except CitadelShieldTrip as exc:
        print_result(False)
        print(f"{RED}Phase 1: {exc}{R}", file=sys.stderr)

    print_backoff_divider()
    try:
        invoke_pre_execution_guard(soil, agent_id=agent_id, intent=intent, hud=True)
        print_result(True)
        return 0
    except CitadelShieldTrip as exc:
        print_backoff_result()
        print(f"{RED}{exc}{R}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
