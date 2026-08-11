/**
 * Zero-Trust Grant Audit page — v0.app dashboard root mount.
 * Single header: AuditTopBar only (GrantAuditPageHeader not mounted here).
 */

import { useEffect, useState, type ReactNode } from "react";
import { B2bInstitutionalPage } from "./b2b/B2bInstitutionalPage";
import { parseGrantAuditSiteView, type GrantAuditSiteView } from "./grant-audit-role";
import { AuditTopBar } from "./hud/v0/AuditTopBar";
import { resolveFullGrantAuditView } from "./hud/v0/grant-audit-view-adapter";
import { GrantAuditDashboard } from "./hud/v0/GrantAuditDashboard";
import { useArbitrumCitadelAudit } from "./hud/use-arbitrum-citadel-audit";

export interface GrantAuditPageProps {
  className?: string;
}

const GRANT_AUDIT_PATH = "/api/grant-audit";

function resolveInitialSiteView(): GrantAuditSiteView {
  if (typeof window === "undefined") return "grant";
  return parseGrantAuditSiteView(window.location.pathname, window.location.search);
}

export function GrantAuditPage({ className = "" }: GrantAuditPageProps): ReactNode {
  const audit = useArbitrumCitadelAudit(GRANT_AUDIT_PATH);
  const venueView = resolveFullGrantAuditView(audit);
  const [siteView, setSiteView] = useState<GrantAuditSiteView>(resolveInitialSiteView);

  useEffect(() => {
    const sync = () =>
      setSiteView(parseGrantAuditSiteView(window.location.pathname, window.location.search));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  if (siteView === "b2b") {
    return (
      <div className={`grant-audit-page ${className}`} data-testid="grant-audit-page">
        <B2bInstitutionalPage />
      </div>
    );
  }

  return (
    <div className={`grant-audit-page ${className}`} data-testid="grant-audit-page">
      {audit.showUnavailable ? (
        <p className="font-data text-[12px] text-amber-300">Grant audit unavailable: {audit.error?.message}</p>
      ) : (
        <div className="grant-audit-v0-root flex min-h-screen flex-col">
          <AuditTopBar view={venueView} />
          <GrantAuditDashboard view={venueView} />
        </div>
      )}
    </div>
  );
}

export default GrantAuditPage;
