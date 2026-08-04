"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const bcrypt_password_hasher_1 = require("./bcrypt-password-hasher");
const hashing_interface_1 = require("./hashing.interface");
const token_service_1 = require("./token.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const capabilities_guard_1 = require("./guards/capabilities.guard");
let SecurityModule = class SecurityModule {
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    secret: config.get('app.jwt.accessSecret'),
                    signOptions: {
                        expiresIn: config.get('app.jwt.accessExpiresIn'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            { provide: hashing_interface_1.HASHING_SERVICE, useClass: bcrypt_password_hasher_1.BcryptPasswordHasher },
            token_service_1.TokenService,
            jwt_strategy_1.JwtStrategy,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            roles_guard_1.RolesGuard,
            capabilities_guard_1.CapabilitiesGuard,
        ],
        exports: [
            hashing_interface_1.HASHING_SERVICE,
            token_service_1.TokenService,
            jwt_1.JwtModule,
            passport_1.PassportModule,
            roles_guard_1.RolesGuard,
            capabilities_guard_1.CapabilitiesGuard,
        ],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map