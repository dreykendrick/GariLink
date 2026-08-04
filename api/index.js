require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

let server;

module.exports = async (req, res) => {
  try {
    if (!server) {
      const expressApp = express();
      const { AppModule } = require('../backend/dist/app.module');
      const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { bufferLogs: true });
      app.setGlobalPrefix('api/v1');
      app.enableCors({ origin: '*' });
      await app.init();
      server = expressApp;
    }
    return server(req, res);
  } catch (err) {
    console.error('Vercel boot error:', err);
    res.status(500).json({
      error: 'Vercel Serverless Boot Failed',
      details: err?.message || String(err),
      stack: err?.stack || null,
    });
  }
};
