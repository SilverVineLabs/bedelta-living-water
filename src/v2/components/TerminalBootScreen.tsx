export function TerminalBootScreen({
  message = "Bootstrapping Santenmoku defense scan…",
}: {
  message?: string;
}): React.ReactNode {
  return (
    <div className="terminal-boot-screen santen-shell">
      <p className="panel-title-text">{message}</p>
      <p className="text-sm text-[rgba(160,255,224,0.65)]">
        Santenmoku v0.8 · Cyberpunk Zen Terminal
      </p>
    </div>
  );
}
