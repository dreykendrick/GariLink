"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = exports.AppLogger = void 0;
const common_1 = require("@nestjs/common");
let AppLogger = AppLogger_1 = class AppLogger {
    constructor(context) {
        this.logger = new common_1.Logger(context ?? 'App');
    }
    forContext(context) {
        return new AppLogger_1(context);
    }
    log(message, context) {
        if (process.env.NODE_ENV === 'production') {
            process.stdout.write(JSON.stringify({ level: 'info', message, context, ts: new Date().toISOString() }) + '\n');
        }
        else {
            this.logger.log(message, context);
        }
    }
    error(message, trace, context) {
        if (process.env.NODE_ENV === 'production') {
            process.stdout.write(JSON.stringify({ level: 'error', message, trace, context, ts: new Date().toISOString() }) + '\n');
        }
        else {
            this.logger.error(message, trace, context);
        }
    }
    warn(message, context) {
        if (process.env.NODE_ENV === 'production') {
            process.stdout.write(JSON.stringify({ level: 'warn', message, context, ts: new Date().toISOString() }) + '\n');
        }
        else {
            this.logger.warn(message, context);
        }
    }
    debug(message, context) {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(message, context);
        }
    }
};
exports.AppLogger = AppLogger;
exports.AppLogger = AppLogger = AppLogger_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [String])
], AppLogger);
let LoggerModule = class LoggerModule {
};
exports.LoggerModule = LoggerModule;
exports.LoggerModule = LoggerModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [AppLogger],
        exports: [AppLogger],
    })
], LoggerModule);
//# sourceMappingURL=logger.module.js.map