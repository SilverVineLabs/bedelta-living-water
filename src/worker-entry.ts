import type { Env } from "./env";
import { handleWorkerFetch } from "./worker-fetch";
import { runScheduledJobs } from "./worker-scheduled";

console.log("[bedelta-living-water] worker boot");

/**
 * Lean Workers entry — fetch + scheduled only (no SDK re-exports).
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return handleWorkerFetch(request, env, ctx);
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log("[bedelta-living-water] cron fired", controller.cron);
    try {
      await runScheduledJobs(env, controller.cron);
    } catch (err) {
      console.error("[bedelta-living-water] scheduled cron failed", err);
    }
    void ctx;
  },
} satisfies ExportedHandler<Env>;
