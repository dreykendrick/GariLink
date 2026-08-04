// Plain JS handler - loads from pre-built dist/ compiled by Vercel's buildCommand
// No TypeScript compilation at function load time

let app = null;
let bootError = null;

module.exports = async (req, res) => {
  if (bootError) {
    return res.status(500).json({
      statusCode: 500,
      error: 'NestJS Boot Failed',
      message: bootError.message || String(bootError),
      stack: bootError.stack || null,
    });
  }

  if (!app) {
    try {
      require('reflect-metadata');
      const { NestFactory } = require('@nestjs/core');
      const { ExpressAdapter } = require('@nestjs/platform-express');
      const express = require('express');
      const { AppModule } = require('../dist/app.module');

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
    } catch (err) {
      bootError = err;
      console.error('[GariLink] Fatal boot error:', err.message, err.stack);
      return res.status(500).json({
        statusCode: 500,
        error: 'NestJS Boot Failed',
        message: err.message || String(err),
        stack: err.stack || null,
      });
    }
  }

  return app(req, res);
};
