import app from "./app";
import { config } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(config.port, async () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 SteerSolo Backend Server                        ║
║                                                       ║
║   Environment: ${config.env.padEnd(37)}║
║   Port: ${config.port.toString().padEnd(43)}║
║   API: http://localhost:${config.port}/api/v1${" ".repeat(18)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);

      // Optionally start async webhook worker
      if (config.webhook.async) {
        const { startWebhookWorker } = await import("./queues/webhook.queue");
        startWebhookWorker();
        console.info("Webhook worker started (async mode)");
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("HTTP server closed");
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
