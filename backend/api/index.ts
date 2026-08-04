import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let isInitialized = false;

export default async function handler(req: any, res: any) {
  try {
    if (!isInitialized) {
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server),
        { bufferLogs: true }
      );
      app.setGlobalPrefix('api/v1');
      app.enableCors({ origin: '*' });
      await app.init();
      isInitialized = true;
    }
    return server(req, res);
  } catch (err: any) {
    console.error('Vercel handler error:', err);
    res.status(500).json({
      error: 'Vercel Serverless Boot Failed',
      message: err?.message || String(err),
      stack: err?.stack || null
    });
  }
}
