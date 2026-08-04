// Minimal Vercel serverless handler - no NestJS dependency at module load time
// This avoids the FUNCTION_INVOCATION_FAILED crash on Lambda cold start

let app: any = null;

async function getApp() {
  if (app) return app;

  // Lazy-load everything to avoid module-load crashes
  try {
    await import('reflect-metadata');
    const { NestFactory } = await import('@nestjs/core');
    const { ExpressAdapter } = await import('@nestjs/platform-express');
    const express = (await import('express')).default;
    const { AppModule } = await import('../src/app.module');

    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: false }
    );

    nestApp.setGlobalPrefix('api/v1');
    nestApp.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await nestApp.init();
    app = expressApp;
    return app;
  } catch (err: any) {
    // Return error as Express handler so it reaches the client
    const express = (await import('express')).default;
    const errApp = express();
    errApp.use((_req: any, res: any) => {
      res.status(500).json({
        statusCode: 500,
        error: 'NestJS Boot Failed on Vercel',
        message: err?.message ?? String(err),
        stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
      });
    });
    app = errApp;
    return app;
  }
}

export default async function handler(req: any, res: any) {
  const server = await getApp();
  return server(req, res);
}
