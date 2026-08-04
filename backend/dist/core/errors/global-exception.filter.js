"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const app_error_1 = require("./app-error");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorResponse = this.buildErrorResponse(exception, request);
        if (errorResponse.statusCode >= 500) {
            this.logger.error(`[${errorResponse.code}] ${errorResponse.message}`, exception instanceof Error ? exception.stack : String(exception));
        }
        else {
            this.logger.warn(`[${errorResponse.code}] ${errorResponse.message} — ${request.method} ${request.url}`);
        }
        response.status(errorResponse.statusCode).json(errorResponse);
    }
    buildErrorResponse(exception, request) {
        const path = request.url;
        const timestamp = new Date().toISOString();
        if (exception instanceof app_error_1.AppError) {
            return {
                statusCode: exception.statusCode,
                code: exception.code,
                message: exception.message,
                path,
                timestamp,
            };
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            const message = typeof body === 'object' && body !== null && 'message' in body
                ? Array.isArray(body.message)
                    ? body.message.join('; ')
                    : String(body.message)
                : exception.message;
            return {
                statusCode: status,
                code: status === 400 ? 'VALIDATION_ERROR' : 'HTTP_ERROR',
                message,
                path,
                timestamp,
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                const fields = exception.meta?.target?.join(', ');
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
                    code: 'CONFLICT',
                    message: fields
                        ? `A record with this ${fields} already exists`
                        : 'A record with these values already exists',
                    path,
                    timestamp,
                };
            }
            if (exception.code === 'P2025') {
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    code: 'NOT_FOUND',
                    message: 'Record not found',
                    path,
                    timestamp,
                };
            }
            if (exception.code === 'P2003') {
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    code: 'BAD_REQUEST',
                    message: 'Related record not found',
                    path,
                    timestamp,
                };
            }
        }
        const isProduction = process.env.NODE_ENV === 'production';
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'INTERNAL_ERROR',
            message: isProduction
                ? 'An unexpected error occurred'
                : exception instanceof Error
                    ? exception.message
                    : 'Unknown error',
            path,
            timestamp,
        };
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map