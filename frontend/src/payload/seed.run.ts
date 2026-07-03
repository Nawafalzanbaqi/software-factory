import { getPayload } from "payload";
import config from "@payload-config";
import { seed } from "./seed";

/**
 * Seed entrypoint: `npm run payload:seed` (payload run src/payload/seed.run.ts).
 * Boots Payload against DATABASE_URI (dev push-mode creates the schema), runs
 * the options-gated seed, then exits. Used by local dev and the real-backend
 * E2E CI job to provision the admin/owner users + sample content.
 */
const payload = await getPayload({ config });
await seed(payload);
payload.logger.info("[seed.run] complete");
process.exit(0);
