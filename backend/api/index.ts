import 'reflect-metadata';

let server: any;

export default async function handler(req: any, res: any) {
  // Health-check shortcut
  if (req.url === '/ping') {
    return res.status(200).json({ ok: true, time: new Date().toISOString() });
  }

  try {
    if (!server) {
      const express = (await import('express')).default;
      const { NestFactory } = await import('@nestjs/core');
      const { ExpressAdapter } = await import('@nestjs/platform-express');
      const { AppModule } = await import('../src/app.module');

      const expressApp = express();
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
        { logger: ['error', 'warn'] }
      );
      app.setGlobalPrefix('api/v1');
      app.enableCors({ origin: '*' });
      await app.init();
      server = expressApp;
    }
    return server(req, res);
  } catch (err: any) {
    console.error('[GariLink] Vercel boot error:', JSON.stringify({
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
    }));
    return res.status(500).json({
      error: 'Vercel Serverless Boot Failed',
      message: err?.message || String(err),
      hint: 'Check Vercel runtime logs for full stack trace',
    });
  }
}
