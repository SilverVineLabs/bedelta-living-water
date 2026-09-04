import { describe, expect, it } from "vitest";
import {
  GMX_CITADEL_HEADER_BADGE_LABEL,
  GMX_CITADEL_BG,
  GMX_CITADEL_SURFACE,
  GMX_OFFICIAL_BLUE,
} from "../../src/lib/gui-bridge/grant-audit/gmx-citadel-theme";

describe("gmx-citadel-theme", () => {
  it("uses official GMX blue badge label in header pill SSOT", () => {
    expect(GMX_CITADEL_HEADER_BADGE_LABEL).toBe(
      "[ 🛡️ TAILOR-MADE FOR GMX v2 ARBITRUM CITADEL: ACTIVE ]",
    );
  });

  it("defines Dark Citadel palette tokens", () => {
    expect(GMX_CITADEL_BG).toBe("#090d16");
    expect(GMX_CITADEL_SURFACE).toBe("#101626");
    expect(GMX_OFFICIAL_BLUE).toBe("#2d42fc");
  });
});
