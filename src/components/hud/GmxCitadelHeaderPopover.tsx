/** Header badge popover — GMX v2 microservices + HL secondary leg. */
import type { ReactNode } from "react";
import {
  GMX_HEADER_MICROSERVICES,
  GMX_HEADER_POPOVER_TITLE,
  GMX_HEADER_SECONDARY_LEG_LABEL,
  microserviceValueClass,
  resolveHlSecondaryLegStatus,
  type L2AdapterMode,
} from "./gmx-header-microservices";

export interface GmxCitadelHeaderPopoverProps {
  l2AdapterMode: L2AdapterMode;
}

export function GmxCitadelHeaderPopover({
  l2AdapterMode,
}: GmxCitadelHeaderPopoverProps): ReactNode {
  const secondaryStatus = resolveHlSecondaryLegStatus(l2AdapterMode);

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-64 rounded border border-[#2d42fc] bg-[#101626] p-2.5 shadow-xl"
      data-testid="gmx-citadel-header-popover"
    >
      <p className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-[#ffffff]/70">
        {GMX_HEADER_POPOVER_TITLE}
      </p>
      <ul className="space-y-1.5">
        {GMX_HEADER_MICROSERVICES.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-2 font-data text-[10px] text-[#ffffff]"
            data-testid={`gmx-header-ms-${row.id}`}
          >
            <span>{row.label}</span>
            <span
              className={[
                "rounded px-1.5 py-0.5 font-semibold",
                microserviceValueClass(row.value),
              ].join(" ")}
            >
              {row.value}
            </span>
          </li>
        ))}
        <li
          className="flex items-center justify-between gap-2 border-t border-[#2d42fc]/25 pt-1.5 font-data text-[10px] text-[#ffffff]/85"
          data-testid="gmx-header-ms-hl-secondary"
        >
          <span>{GMX_HEADER_SECONDARY_LEG_LABEL}</span>
          <span
            className={[
              "rounded px-1.5 py-0.5 font-semibold",
              microserviceValueClass(secondaryStatus),
            ].join(" ")}
          >
            {secondaryStatus}
          </span>
        </li>
      </ul>
    </div>
  );
}
