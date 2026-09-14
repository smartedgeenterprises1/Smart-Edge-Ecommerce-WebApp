import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { startReservationExpiryJob } from './jobs/reservation-expiry.js';

async function main() {
  await connectDatabase();
  const app = await createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[smart-edge] API listening on http://localhost:${env.PORT}`);
    console.log(`[smart-edge] CORS origin: ${env.CLIENT_ORIGIN}`);
  });

  const stopJob = startReservationExpiryJob();

  const shutdown = async (signal: string) => {
    console.log(`[smart-edge] ${signal} received, shutting down…`);
    stopJob();
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
