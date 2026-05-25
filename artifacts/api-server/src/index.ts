import app from "./app";
import { logger } from "./lib/logger";
import { connectMongoDB } from "./lib/mongodb";
import { seedAdmin } from "./seed";

const port = Number(process.env.PORT ?? 8080);

async function start() {
  await connectMongoDB();
  await seedAdmin();
  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
