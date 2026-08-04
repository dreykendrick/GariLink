"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    app: {
        port: parseInt(process.env.PORT ?? '3000', 10),
        env: process.env.NODE_ENV ?? 'development',
        prefix: process.env.API_PREFIX ?? 'api/v1',
        corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
        refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    },
    otp: {
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? '10', 10),
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
        resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? '60', 10),
        length: parseInt(process.env.OTP_LENGTH ?? '6', 10),
    },
    lockout: {
        maxAttempts: parseInt(process.env.LOCKOUT_MAX_ATTEMPTS ?? '5', 10),
        durationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES ?? '30', 10),
    },
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10),
        authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
    },
    media: {
        storageProvider: process.env.MEDIA_STORAGE_PROVIDER ?? 'local',
        localPath: process.env.MEDIA_LOCAL_PATH ?? './uploads',
        maxFileSizeMb: parseInt(process.env.MEDIA_MAX_FILE_SIZE_MB ?? '10', 10),
        publicBaseUrl: process.env.MEDIA_PUBLIC_BASE_URL ?? 'http://localhost:3000/uploads',
        allowedImageTypes: (process.env.MEDIA_ALLOWED_IMAGE_TYPES ??
            'image/jpeg,image/png,image/webp').split(','),
        allowedVideoTypes: (process.env.MEDIA_ALLOWED_VIDEO_TYPES ?? 'video/mp4,video/quicktime').split(','),
        allowedDocTypes: (process.env.MEDIA_ALLOWED_DOC_TYPES ?? 'application/pdf').split(','),
        maxImagesPerVehicle: parseInt(process.env.MEDIA_MAX_IMAGES_PER_VEHICLE ?? '20', 10),
    },
}));
//# sourceMappingURL=app.config.js.map