import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { scheduleTrashPurge } from './jobs/trash.js';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}`);
    console.log(`[cors] allowed origins: ${env.clientOrigins.join(', ') || '(none)'}`);
  });
  scheduleTrashPurge();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
