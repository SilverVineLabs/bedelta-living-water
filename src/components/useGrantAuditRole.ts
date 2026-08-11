import { useCallback, useEffect, useState } from "react";
import {
  parseGrantAuditRole,
  syncGrantAuditRoleUrl,
  type GrantAuditViewRole,
} from "./grant-audit-role";

export function useGrantAuditRole(): [GrantAuditViewRole, (role: GrantAuditViewRole) => void] {
  const [role, setRole] = useState<GrantAuditViewRole>(() =>
    typeof window !== "undefined" ? parseGrantAuditRole(window.location.search) : "grant",
  );

  useEffect(() => {
    const onPop = () => setRole(parseGrantAuditRole(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setRoleAndSync = useCallback((next: GrantAuditViewRole) => {
    setRole(next);
    syncGrantAuditRoleUrl(next);
  }, []);

  return [role, setRoleAndSync];
}
