// Static top-level requires so Vercel NFT bundler traces all dependencies
require('reflect-metadata');
const NestFactory = require('@nestjs/core').NestFactory;
const ExpressAdapter = require('@nestjs/platform-express').ExpressAdapter;
const express = require('express');
// Force NFT to trace all dist modules via explicit requires
const AppModule = require('../dist/app.module').AppModule;

let app = null;
let bootError = null;
let booting = null;

async function boot() {
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
  return expressApp;
}

module.exports = async (req, res) => {
  if (bootError) {
    return res.status(500).json({
      statusCode: 500,
      error: 'NestJS Boot Failed',
      message: bootError.message || String(bootError),
    });
  }

  if (!app) {
    if (!booting) {
      booting = boot().then(a => { app = a; }).catch(e => { bootError = e; });
    }
    await booting;
  }

  if (bootError) {
    return res.status(500).json({
      statusCode: 500,
      error: 'NestJS Boot Failed',
      message: bootError.message || String(bootError),
    });
  }

  return app(req, res);
};
