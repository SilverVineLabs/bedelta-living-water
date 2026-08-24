/**
 * SystemState — single source of truth for Santenmoku v0.8 risk HUD + execution gates.
 * UI and API must read/write only through this module (no parallel risk state).
 */

export * from "./systemState-types";
export * from "./systemState-cri";
export * from "./systemState-build";
