"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
let app = null;
let bootError = null;
async function handler(req, res) {
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
            process.env.PRISMA_QUERY_ENGINE_LIBRARY = undefined;
            const { default: express } = await Promise.resolve().then(() => require('express'));
            const { NestFactory } = await Promise.resolve().then(() => require('@nestjs/core'));
            const { ExpressAdapter } = await Promise.resolve().then(() => require('@nestjs/platform-express'));
            const { AppModule } = await Promise.resolve().then(() => require('../src/app.module'));
            const expressApp = express();
            const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { logger: false });
            nestApp.setGlobalPrefix('api/v1');
            nestApp.enableCors({
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            });
            await nestApp.init();
            app = expressApp;
        }
        catch (err) {
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
//# sourceMappingURL=index.js.map