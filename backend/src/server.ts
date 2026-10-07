// src/server.ts
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

async function main() {
  await prisma.$connect(); // crash at startup if the DB is unreachable, not on the first request

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref(); // force exit if connections hang
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});