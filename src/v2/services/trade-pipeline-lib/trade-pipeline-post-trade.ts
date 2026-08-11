export type PostTradeExitKind = "Hit TP" | "Hit SL" | "Manual Exit";

export function formatPostTradeReviewLog(kind: PostTradeExitKind): string {
  return `Review: [ ${kind} ]`;
}
