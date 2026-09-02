/** Shared deposit select (Smart Routing). */
import type { ReactNode } from "react";

export interface DepositSelectOption {
  value: string;
  label: string;
}

const INP =
  "w-full rounded border border-[#1d2842] bg-[#090d16]/80 px-2.5 py-2 font-mono text-xs text-[#e2e8f0] outline-none focus:border-[#2d42fc]/55";
const BADGE = "rounded border border-[#1d2842] bg-[#090d16]/60 px-2 py-2 font-mono text-[11px] text-[#e2e8f0]";

export function DepositSel({
  value,
  options,
  onChange,
}: {
  value: string;
  options?: readonly DepositSelectOption[];
  onChange?: (value: string) => void;
}): ReactNode {
  if (!options?.length || !onChange) return <span className={BADGE}>{value}</span>;
  return (
    <select className={`${INP} cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export { INP };
