"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./core/errors/global-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const config = app.get(config_1.ConfigService);
    const logger = new common_1.Logger('Bootstrap');
    const prefix = config.get('app.app.prefix') ?? 'api/v1';
    app.setGlobalPrefix(prefix);
    const corsOrigins = config.get('app.app.corsOrigins') ?? ['*'];
    app.enableCors({
        origin: corsOrigins,
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
    const env = config.get('app.app.env') ?? 'development';
    if (env !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('GariLink API')
            .setDescription('GariLink Automotive Platform API')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('Auth', 'Authentication and authorization')
            .addTag('Profile', 'User profile management')
            .addTag('Sessions', 'Session management')
            .addTag('Capabilities', 'User capability management')
            .addTag('Workspaces', 'Workspace management')
            .addTag('Vehicles', 'Vehicle core domain')
            .addTag('Listings', 'Marketplace listings')
            .addTag('Organizations', 'Organization management')
            .addTag('Health', 'Health check')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup(`${prefix}/docs`, app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }
    const port = config.get('app.app.port') ?? 3000;
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
        await app.listen(port);
        logger.log(`🚀 GariLink API running on http://localhost:${port}/${prefix}`);
    }
    return app;
}
exports.default = bootstrap();
//# sourceMappingURL=main.js.map