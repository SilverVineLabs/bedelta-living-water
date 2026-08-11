import { useState, type ReactNode } from "react";
import {
  TELEMETRY_ANALYTICS_CURL,
  TELEMETRY_HEALTH_CURL,
} from "./grant-ui-ssot";
import {
  SECTION1_TOOLTIP_BODY_CLASS,
  SECTION1_TOOLTIP_PANEL_CLASS,
  SECTION1_TOOLTIP_TITLE_CLASS,
} from "./Section1/section1-tooltip-styles";
import {
  DEV_GUIDE_BODY,
  DEV_GUIDE_RESILIENCY_INTRO,
  DEV_GUIDE_RESILIENCY_ITEMS,
  DEV_GUIDE_RESILIENCY_TITLE,
  DEV_GUIDE_TITLE,
} from "./public-good-telemetry-copy";

export interface PublicGoodDevGuidePanelProps {
  isGate: boolean;
  actionButtonClass: string;
}

export function PublicGoodDevGuidePanel({
  isGate,
  actionButtonClass,
}: PublicGoodDevGuidePanelProps): ReactNode {
  const [devGuideOpen, setDevGuideOpen] = useState(false);

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setDevGuideOpen((prev) => !prev)}
        aria-expanded={devGuideOpen}
        data-testid="telemetry-dev-guide-trigger"
        className={[
          actionButtonClass,
          "border-purple-500/40 bg-purple-950/30 text-purple-200 hover:border-purple-400/60 hover:text-purple-100",
        ].join(" ")}
      >
        [ 📖 Dev Guide ]
      </button>
      {devGuideOpen ? (
        <div
          role="dialog"
          className={[
            SECTION1_TOOLTIP_PANEL_CLASS,
            isGate
              ? "left-1/2 right-auto w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 text-left"
              : "left-auto right-0 w-[min(28rem,calc(100vw-2rem))]",
          ].join(" ")}
          data-testid="telemetry-dev-guide-panel"
        >
          <p className={SECTION1_TOOLTIP_TITLE_CLASS}>{DEV_GUIDE_TITLE}</p>
          <p className={`mt-2 ${SECTION1_TOOLTIP_BODY_CLASS}`}>{DEV_GUIDE_BODY}</p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-emerald-200/90">
            {TELEMETRY_HEALTH_CURL}
          </p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-cyan-200/90">
            {TELEMETRY_ANALYTICS_CURL}
          </p>
          <p className={`mt-4 ${SECTION1_TOOLTIP_TITLE_CLASS}`}>
            {DEV_GUIDE_RESILIENCY_TITLE}
          </p>
          <p className={`mt-2 ${SECTION1_TOOLTIP_BODY_CLASS}`}>
            {DEV_GUIDE_RESILIENCY_INTRO}
          </p>
          <ul
            className="mt-2 list-disc space-y-2 pl-4 text-left"
            data-testid="telemetry-dev-guide-resiliency"
          >
            {DEV_GUIDE_RESILIENCY_ITEMS.map((item) => (
              <li key={item.label} className={SECTION1_TOOLTIP_BODY_CLASS}>
                <span className="font-semibold text-sky-200/90">{item.label}:</span>{" "}
                {item.body}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setDevGuideOpen(false)}
            className="mt-3 font-data text-[10px] text-zinc-400 hover:text-zinc-200"
          >
            [ Close ]
          </button>
        </div>
      ) : null}
    </span>
  );
}
