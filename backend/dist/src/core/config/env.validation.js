"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
const Joi = require("joi");
exports.envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),
    API_PREFIX: Joi.string().default('api/v1'),
    DATABASE_URL: Joi.string().default('postgresql://postgres.orlrgjjbmnjxqbhheago:Kibaja0658%23@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true'),
    JWT_ACCESS_SECRET: Joi.string().min(32).default('dev_access_secret_change_me_in_production_minimum_32_chars'),
    JWT_REFRESH_SECRET: Joi.string().min(32).default('dev_refresh_secret_change_me_in_production_minimum_32_chars'),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
    OTP_EXPIRY_MINUTES: Joi.number().default(10),
    OTP_MAX_ATTEMPTS: Joi.number().default(5),
    OTP_RESEND_COOLDOWN_SECONDS: Joi.number().default(60),
    OTP_LENGTH: Joi.number().default(6),
    LOCKOUT_MAX_ATTEMPTS: Joi.number().default(5),
    LOCKOUT_DURATION_MINUTES: Joi.number().default(30),
    THROTTLE_TTL: Joi.number().default(60000),
    THROTTLE_LIMIT: Joi.number().default(60),
    AUTH_THROTTLE_LIMIT: Joi.number().default(10),
    MEDIA_STORAGE_PROVIDER: Joi.string()
        .valid('local', 's3', 'r2')
        .default('local'),
    MEDIA_LOCAL_PATH: Joi.string().default('./uploads'),
    MEDIA_MAX_FILE_SIZE_MB: Joi.number().default(10),
    MEDIA_PUBLIC_BASE_URL: Joi.string().default('http://localhost:3000/uploads'),
    EMAIL_PROVIDER: Joi.string().valid('console', 'sendgrid').default('console'),
    SMS_PROVIDER: Joi.string()
        .valid('console', 'africastalking')
        .default('console'),
    CORS_ORIGINS: Joi.string().default('*'),
});
//# sourceMappingURL=env.validation.js.map