import type { ReactNode } from "react";

export interface GrantAuditCopyToastProps {
  visible: boolean;
}

export function GrantAuditCopyToast({ visible }: GrantAuditCopyToastProps): ReactNode {
  if (!visible) return null;
  return (
    <p
      role="status"
      className="rounded border border-[#2d42fc]/45 bg-[#2d42fc]/15 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#e2e8f0] shadow-[0_0_10px_rgba(45,66,252,0.25)]"
      data-testid="grant-audit-payload-copied-toast"
    >
      Audit Payload Copied!
    </p>
  );
}
