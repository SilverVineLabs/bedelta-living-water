import type { ReactNode } from "react";
import { BRAND_DELTA_GLYPH } from "../../config/constants";

/** Hover tooltip wrapper for user-facing Δ glyph. */
export function DeltaTip({ children }: { children?: ReactNode }): ReactNode {
  return <span title="Delta">{children ?? BRAND_DELTA_GLYPH}</span>;
}

export function DeltaNeutralLabel(): ReactNode {
  return (
    <>
      <DeltaTip />
      -Neutral
    </>
  );
}

export function ZeroDeltaLabel(): ReactNode {
  return (
    <>
      Zero-<DeltaTip />
    </>
  );
}
