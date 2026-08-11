import { REGIMES } from "./demo-data.constants";
import type { DemoMatrix } from "./demo-data.matrix";

function fmtUsd(n: number, signed = true): string {
  const abs = Math.abs(n).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
  if (!signed) return `$${abs}`;
  if (n > 0) return `+$${abs}`;
  if (n < 0) return `-$${abs}`;
  return "$0";
}

function pad(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : s + " ".repeat(w - s.length);
}

export function printShockTable(matrix: DemoMatrix): void {
  console.log("");
  console.log("══ Shock Hook: Lv0 → Lv1 → Lv5  (Institution $1,000,000) ══");
  const headers = [
    "Regime",
    "Lv0 Equity",
    "Lv0 PnL",
    "Lv1 Equity",
    "Lv1 PnL",
    "Lv5 Equity",
    "Lv5 PnL",
    "Δ Lv5−Lv0",
  ];
  const widths = [22, 12, 12, 12, 12, 12, 12, 12];
  const line = (cols: string[]) =>
    "│ " + cols.map((c, i) => pad(c, widths[i]!)).join(" │ ") + " │";
  const rule = "├─" + widths.map((w) => "─".repeat(w)).join("─┼─") + "─┤";
  console.log("┌─" + widths.map((w) => "─".repeat(w)).join("─┬─") + "─┐");
  console.log(line(headers));
  console.log(rule);
  for (const row of matrix.shockHook) {
    const i = row.institution_1m;
    console.log(
      line([
        row.label,
        fmtUsd(i.lv0.equityEndUsd, false),
        fmtUsd(i.lv0.pnlUsd),
        fmtUsd(i.lv1.equityEndUsd, false),
        fmtUsd(i.lv1.pnlUsd),
        fmtUsd(i.lv5.equityEndUsd, false),
        fmtUsd(i.lv5.pnlUsd),
        fmtUsd(i.shockDeltaLv5VsLv0Usd),
      ]),
    );
  }
  console.log("└─" + widths.map((w) => "─".repeat(w)).join("─┴─") + "─┘");
}

export function printRegimeRoleTables(matrix: DemoMatrix): void {
  for (const regime of matrix.regimes) {
    console.log("");
    console.log(`══ ${regime.label} — 5 Roles × Lv0/1/5 ══`);
    const headers = [
      "Role",
      "Capital",
      "Lv0 PnL",
      "Lv1 PnL",
      "Lv5 PnL",
      "Δ Lv5−Lv0",
    ];
    const widths = [14, 12, 12, 12, 12, 12];
    const line = (cols: string[]) =>
      "│ " + cols.map((c, i) => pad(c, widths[i]!)).join(" │ ") + " │";
    const rule = "├─" + widths.map((w) => "─".repeat(w)).join("─┼─") + "─┤";
    console.log("┌─" + widths.map((w) => "─".repeat(w)).join("─┬─") + "─┐");
    console.log(line(headers));
    console.log(rule);
    for (const role of regime.roles) {
      const l0 = role.levels[0]!;
      const l1 = role.levels[1]!;
      const l5 = role.levels[5]!;
      console.log(
        line([
          role.roleLabel,
          fmtUsd(role.capitalUsd, false),
          fmtUsd(l0.pnlUsd),
          fmtUsd(l1.pnlUsd),
          fmtUsd(l5.pnlUsd),
          fmtUsd(l5.pnlUsd - l0.pnlUsd),
        ]),
      );
    }
    console.log("└─" + widths.map((w) => "─".repeat(w)).join("─┴─") + "─┘");
  }
}

export function printFullLevelPct(): void {
  console.log("");
  console.log("══ Return % by Regime × Level (all roles scale linearly) ══");
  const headers = ["Regime", "Lv0", "Lv1", "Lv2", "Lv3", "Lv4", "Lv5"];
  const widths = [22, 8, 8, 8, 8, 8, 8];
  const line = (cols: string[]) =>
    "│ " + cols.map((c, i) => pad(c, widths[i]!)).join(" │ ") + " │";
  const rule = "├─" + widths.map((w) => "─".repeat(w)).join("─┼─") + "─┤";
  console.log("┌─" + widths.map((w) => "─".repeat(w)).join("─┬─") + "─┐");
  console.log(line(headers));
  console.log(rule);
  for (const r of REGIMES) {
    console.log(
      line([
        r.label,
        ...r.returnByLevel.map((x) => `${(x * 100).toFixed(1)}%`),
      ]),
    );
  }
  console.log("└─" + widths.map((w) => "─".repeat(w)).join("─┴─") + "─┘");
  console.log("");
}
