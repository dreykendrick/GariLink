import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { appConfig } from './core/config/app.config';
import { envValidationSchema } from './core/config/env.validation';
import { PrismaModule } from './shared/infrastructure/prisma.module';
import { SecurityModule } from './core/security/security.module';
import { LoggerModule } from './core/logger/logger.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MediaModule } from './modules/media/media.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Config (global)
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
      expandVariables: true,
    }),

    // Throttler (global rate limiting)
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
            limit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10),
          },
        ],
      }),
    }),

    // Event emitter (for domain events)
    EventEmitterModule.forRoot(),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Static file serving for local media storage (dev only)
    ...(process.env.NODE_ENV !== 'production'
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
          }),
        ]
      : []),

    // Shared infrastructure
    PrismaModule,

    // Core
    SecurityModule,
    LoggerModule,

    // Supporting modules
    AuditModule,
    HealthModule,

    // Feature modules — Sprint 1-4
    IdentityModule,

    // Feature modules — Sprint 5
    MediaModule,
    WorkspaceModule,
    OrganizationModule,
    VehicleModule,
    MarketplaceModule,

    // Stubs — future sprints
    NotificationsModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
