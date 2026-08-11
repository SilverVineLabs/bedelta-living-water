import { Component, type ErrorInfo, type ReactNode } from "react";
import { isBrowser, readWindowProperty } from "../lib/client-runtime";

export interface TerminalErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  onReset?: () => void;
}

interface TerminalErrorBoundaryState {
  error: Error | null;
  walletHint: string | null;
}

function detectWalletExtensionHint(): string | null {
  if (!isBrowser()) return null;

  const hints: string[] = [];
  for (const key of ["backpack", "solana", "ethereum", "auro"]) {
    if (readWindowProperty(key) !== undefined) {
      hints.push(key);
    }
  }

  if (hints.length === 0) return null;
  return hints.join(", ");
}

/**
 * Catches render/runtime faults (including wallet extension `window` pollution)
 * so the Santenmoku terminal shell stays usable instead of white-screening.
 */
export class TerminalErrorBoundary extends Component<
  TerminalErrorBoundaryProps,
  TerminalErrorBoundaryState
> {
  state: TerminalErrorBoundaryState = { error: null, walletHint: null };

  static getDerivedStateFromError(error: Error): TerminalErrorBoundaryState {
    return { error, walletHint: detectWalletExtensionHint() };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[TerminalErrorBoundary]", error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null, walletHint: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { error, walletHint } = this.state;
    if (!error) return this.props.children;

    const title = this.props.title ?? "Santenmoku Terminal — Fault Isolation";

    return (
      <div className="santen-shell flex min-h-screen items-center justify-center px-4 py-10 font-hud text-[var(--text-primary)]">
        <section className="terminal-error-panel">
          <p className="panel-title-text text-red-300/90">Error Boundary Active</p>
          <h1 className="brand-hero-title mt-2 text-red-200">{title}</h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            The trader dashboard hit an isolated runtime fault. Core layout is
            shielded — reload or retry to continue.
          </p>
          <pre className="font-data mt-4 max-h-40 overflow-auto rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(5,19,17,0.85)] p-3 text-xs text-red-200/90">
            {error.message}
          </pre>
          {walletHint ? (
            <p className="mt-3 text-xs text-[#fcd34d]">
              Wallet extension detected ({walletHint}). If crashes persist, try a
              clean profile or disable the extension on this origin.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="mint-btn px-4 py-2 text-sm"
            >
              Retry Terminal
            </button>
            <button
              type="button"
              onClick={() => {
                if (isBrowser()) window.location.reload();
              }}
              className="rounded-lg border border-[rgba(80,210,193,0.25)] bg-[rgba(10,26,23,0.85)] px-4 py-2 text-sm text-[var(--text-secondary)]"
            >
              Hard Reload
            </button>
          </div>
        </section>
      </div>
    );
  }
}
