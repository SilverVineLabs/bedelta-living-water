import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ENV_PRODUCTION_PATH = join(__dirname, "../../.env.production");

export function loadEnvProduction(): void {
  if (!existsSync(ENV_PRODUCTION_PATH)) {
    throw new Error(`.env.production missing — run setup first`);
  }
  for (const raw of readFileSync(ENV_PRODUCTION_PATH, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export function mask(value: string): string {
  if (value.length < 12) return "***";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function maskHex(value: string): string {
  return mask(value);
}

export function requireEnv(key: string): string {
  const v = (process.env[key] ?? "").trim();
  if (!v) throw new Error(`${key} missing in .env.production`);
  return v;
}
