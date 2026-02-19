import { loadConfig } from "./config.js";
import { buildApp } from "./app.js";

async function main() {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(`chartcn server listening on http://${config.HOST}:${config.PORT}`);
    app.log.info(`Preview UI: http://${config.HOST}:${config.PORT}/chart/preview`);
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }

  // Handle signals
  const shutdown = async () => {
    app.log.info("Shutting down...");
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();
