"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = require("express");
const common_1 = require("@nestjs/common");
const global_exception_filter_1 = require("./core/errors/global-exception.filter");
const server = (0, express_1.default)();
let isInitialized = false;
const createServer = async () => {
    if (!isInitialized) {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server), { bufferLogs: true });
        app.setGlobalPrefix('api/v1');
        app.enableCors({
            origin: '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        });
        app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: { enableImplicitConversion: true },
        }));
        await app.init();
        isInitialized = true;
    }
    return server;
};
exports.createServer = createServer;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: '*' });
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    await app.listen(process.env.PORT || 3000);
}
if (!process.env.VERCEL) {
    bootstrap().catch((err) => {
        console.error('Failed to start GariLink API:', err);
    });
}
//# sourceMappingURL=main.js.map