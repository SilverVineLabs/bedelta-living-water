import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { TerminalErrorBoundary } from "./v2/components/TerminalErrorBoundary";
import "./v2/index.css";
import "./v2/gmx-citadel-theme.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root mount point not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <TerminalErrorBoundary title="BeΔ Living Water — HUD">
      <App />
    </TerminalErrorBoundary>
  </StrictMode>,
);
