import type { ReactNode } from "react";
import { Phase02Shield } from "./Phase02Shield";
import { Phase03Defense } from "./Phase03Defense";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface GrantAuditDefenseSplitProps {
  view: FullGrantAuditVenueView;
}

/** Classic 2-column split — Left: GMX Shield + MEV sandbox · Right: 20-Root Matrix. */
export function GrantAuditDefenseSplit({ view }: GrantAuditDefenseSplitProps): ReactNode {
  return (
    <div
      className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2"
      data-testid="grant-audit-defense-split"
    >
      <div className="flex min-h-0 flex-col" data-testid="grant-audit-shield-column">
        <Phase02Shield view={view} />
      </div>
      <div className="flex min-h-0 flex-col" data-testid="grant-audit-matrix-column">
        <Phase03Defense view={view} />
      </div>
    </div>
  );
}
