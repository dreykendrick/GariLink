// Vercel Serverless Handler for NestJS GariLink API
// All imports are dynamic to surface errors as JSON

let app: any = null;
let bootError: any = null;

export default async function handler(req: any, res: any) {
  // If a previous boot failed, report it
  if (bootError) {
    return res.status(500).json({
      statusCode: 500,
      error: 'NestJS Boot Failed',
      message: bootError?.message || String(bootError),
      stack: bootError?.stack || null,
    });
  }

  if (!app) {
    try {
      // Ensure Prisma query engine binary path is set for Lambda
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = undefined as any;

      const { default: express } = await import('express');
      const { NestFactory } = await import('@nestjs/core');
      const { ExpressAdapter } = await import('@nestjs/platform-express');
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
    } catch (err: any) {
      bootError = err;
      console.error('[GariLink] Fatal boot error:', err?.message, err?.stack);
      return res.status(500).json({
        statusCode: 500,
        error: 'NestJS Boot Failed',
        message: err?.message || String(err),
        stack: err?.stack || null,
      });
    }
  }

  return app(req, res);
}
