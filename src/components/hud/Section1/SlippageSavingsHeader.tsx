import type { ReactNode } from "react";
import { MevAttackBanner } from "./MevAttackBanner";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";

export interface SlippageSavingsHeaderProps {
  mevAttackActive: boolean;
  protocolVersion: OperatorUnlockVersion;
}

export function SlippageSavingsHeader({
  mevAttackActive,
  protocolVersion,
}: SlippageSavingsHeaderProps): ReactNode {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 pr-2">
      <MevAttackBanner
        visible={mevAttackActive}
        protocolVersion={protocolVersion}
        inline
      />
    </div>
  );
}
