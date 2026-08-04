"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const app_config_1 = require("./core/config/app.config");
const env_validation_1 = require("./core/config/env.validation");
const prisma_module_1 = require("./shared/infrastructure/prisma.module");
const security_module_1 = require("./core/security/security.module");
const logger_module_1 = require("./core/logger/logger.module");
const audit_module_1 = require("./modules/audit/audit.module");
const health_module_1 = require("./modules/health/health.module");
const identity_module_1 = require("./modules/identity/identity.module");
const media_module_1 = require("./modules/media/media.module");
const workspace_module_1 = require("./modules/workspace/workspace.module");
const organization_module_1 = require("./modules/organization/organization.module");
const vehicle_module_1 = require("./modules/vehicle/vehicle.module");
const marketplace_module_1 = require("./modules/marketplace/marketplace.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const rental_module_1 = require("./modules/rental/rental.module");
const app_controller_1 = require("./app.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                load: [app_config_1.appConfig],
                expandVariables: true,
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                useFactory: () => ({
                    throttlers: [
                        {
                            ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
                            limit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10),
                        },
                    ],
                }),
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            schedule_1.ScheduleModule.forRoot(),
            ...(process.env.NODE_ENV !== 'production'
                ? [
                    serve_static_1.ServeStaticModule.forRoot({
                        rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                        serveRoot: '/uploads',
                    }),
                ]
                : []),
            prisma_module_1.PrismaModule,
            security_module_1.SecurityModule,
            logger_module_1.LoggerModule,
            audit_module_1.AuditModule,
            health_module_1.HealthModule,
            identity_module_1.IdentityModule,
            media_module_1.MediaModule,
            workspace_module_1.WorkspaceModule,
            organization_module_1.OrganizationModule,
            vehicle_module_1.VehicleModule,
            marketplace_module_1.MarketplaceModule,
            rental_module_1.RentalModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map