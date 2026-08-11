import { useState, type ReactNode } from "react";
import { computeVerified5TxSha256Anchor } from "../../../../data/verified-5tx";
import { formatTruncatedSha256Anchor } from "../../../../data/verified-5tx-display-helpers";
import type { TxBatchRecord } from "../section1-hud-types";
import { TcaSha256AnchorModal } from "./TcaSha256AnchorModal";

export interface TcaSha256AnchorBadgeProps {
  batch: TxBatchRecord;
  disabled?: boolean;
}

export function TcaSha256AnchorBadge({
  batch,
  disabled = false,
}: TcaSha256AnchorBadgeProps): ReactNode {
  const [modalOpen, setModalOpen] = useState(false);
  const anchor = computeVerified5TxSha256Anchor(batch.results.fills);
  const label = formatTruncatedSha256Anchor(anchor);

  return (
    <>
      <button
        type="button"
        data-testid="tca-sha256-anchor-badge"
        disabled={disabled}
        onClick={() => setModalOpen(true)}
        className="font-data text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        [ 🛡️ TCA SHA-256 ANCHOR: {label} (VERIFIED) ]
      </button>
      <TcaSha256AnchorModal
        batch={batch}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
