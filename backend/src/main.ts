import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ExpressAdapter } from "@nestjs/platform-express";
import * as express from "express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { INestApplication } from "@nestjs/common";
import { GlobalExceptionFilter } from "./core/errors/global-exception.filter";

// Shared express server instance for Vercel serverless
const server = express();
let isInitialized = false;

function configureApp(app: INestApplication): void {
  const prefix = process.env.API_PREFIX ?? "api/v1";
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Render, Railway and Vercel terminate TLS before forwarding requests.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
}

export const createServer = async () => {
  if (!isInitialized) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { bufferLogs: true },
    );
    configureApp(app);
    await app.init();
    isInitialized = true;
  }
  return server;
};

// Railway / standard server startup
async function bootstrap() {
  const logger = new Logger("Bootstrap");
  try {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    configureApp(app);

    const port = parseInt(process.env.PORT ?? "3000", 10);
    await app.listen(port, "0.0.0.0");
    logger.log(`🚀 GariLink API running on port ${port}`);
    logger.log(`📡 Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    logger.error("❌ Failed to start GariLink API", err);
    // Buffered Nest logs are not flushed when bootstrap itself fails.
    // Keep a direct stderr fallback so deployment/startup failures are visible.
    console.error("Failed to start GariLink API:", err);
    process.exit(1);
  }
}

// Only auto-start in non-Vercel environments (Railway, local, etc.)
if (!process.env.VERCEL) {
  bootstrap();
}
