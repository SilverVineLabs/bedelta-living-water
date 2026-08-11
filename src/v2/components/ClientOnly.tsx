import { useEffect, useState, type ReactNode } from "react";
import { isBrowser } from "../lib/client-runtime";

export interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only after the browser has mounted.
 * Prevents time/wallet/extension-driven markup drift during first paint.
 */
export function ClientOnly({
  children,
  fallback = null,
}: ClientOnlyProps): ReactNode {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isBrowser()) return;
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return children;
}
