/** Smooth-scroll Section 3 terminal into view after 5-TX execution starts. */
export function scrollToSection3Terminal(): void {
  if (typeof document === "undefined") return;
  document.getElementById("section3-terminal")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** Detect MetaMask / EIP-712 user rejection in wallet error payloads. */
export function isUserSignatureRejection(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : String(err);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request") ||
    normalized.includes("action_rejected") ||
    normalized.includes("4001") ||
    (normalized.includes("cancel") && normalized.includes("sign"))
  );
}

export const SIGNATURE_CANCELLED_BANNER =
  "[ ⚠️ Signature Cancelled by User ]" as const;
