import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './core/errors/global-exception.filter';

// Shared express server instance for Vercel serverless
const server = express();
let isInitialized = false;

export const createServer = async () => {
  if (!isInitialized) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { bufferLogs: true }
    );
    app.setGlobalPrefix('api/v1');
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    await app.init();
    isInitialized = true;
  }
  return server;
};

// Railway / standard server startup
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    app.setGlobalPrefix('api/v1');
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );

    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 GariLink API running on port ${port}`);
    logger.log(`📡 Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    logger.error('❌ Failed to start GariLink API', err);
    process.exit(1);
  }
}

// Only auto-start in non-Vercel environments (Railway, local, etc.)
if (!process.env.VERCEL) {
  bootstrap();
}
