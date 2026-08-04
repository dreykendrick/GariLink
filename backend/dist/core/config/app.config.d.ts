export declare const appConfig: (() => {
    app: {
        port: number;
        env: string;
        prefix: string;
        corsOrigins: string[];
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    otp: {
        expiryMinutes: number;
        maxAttempts: number;
        resendCooldownSeconds: number;
        length: number;
    };
    lockout: {
        maxAttempts: number;
        durationMinutes: number;
    };
    throttle: {
        ttl: number;
        limit: number;
        authLimit: number;
    };
    media: {
        storageProvider: string;
        localPath: string;
        maxFileSizeMb: number;
        publicBaseUrl: string;
        allowedImageTypes: string[];
        allowedVideoTypes: string[];
        allowedDocTypes: string[];
        maxImagesPerVehicle: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    app: {
        port: number;
        env: string;
        prefix: string;
        corsOrigins: string[];
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    otp: {
        expiryMinutes: number;
        maxAttempts: number;
        resendCooldownSeconds: number;
        length: number;
    };
    lockout: {
        maxAttempts: number;
        durationMinutes: number;
    };
    throttle: {
        ttl: number;
        limit: number;
        authLimit: number;
    };
    media: {
        storageProvider: string;
        localPath: string;
        maxFileSizeMb: number;
        publicBaseUrl: string;
        allowedImageTypes: string[];
        allowedVideoTypes: string[];
        allowedDocTypes: string[];
        maxImagesPerVehicle: number;
    };
}>;
export type AppConfig = ReturnType<typeof appConfig>;
