import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/errors/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global prefix
  const prefix = config.get<string>('app.app.prefix') ?? 'api/v1';
  app.setGlobalPrefix(prefix);

  // CORS
  const corsOrigins = config.get<string[]>('app.app.corsOrigins') ?? ['*'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger (dev only)
  const env = config.get<string>('app.app.env') ?? 'development';
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
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
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('app.app.port') ?? 3000;
  await app.listen(port);
  logger.log(`🚀 GariLink API running on http://localhost:${port}/${prefix}`);
  if (env !== 'production') {
    logger.log(`📚 Swagger docs at http://localhost:${port}/${prefix}/docs`);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start GariLink API:', err);
  process.exit(1);
});
