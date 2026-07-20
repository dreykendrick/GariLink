import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // OTP
  OTP_EXPIRY_MINUTES: Joi.number().default(10),
  OTP_MAX_ATTEMPTS: Joi.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: Joi.number().default(60),
  OTP_LENGTH: Joi.number().default(6),

  // Account lockout
  LOCKOUT_MAX_ATTEMPTS: Joi.number().default(5),
  LOCKOUT_DURATION_MINUTES: Joi.number().default(30),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(60),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),

  // Media
  MEDIA_STORAGE_PROVIDER: Joi.string()
    .valid('local', 's3', 'r2')
    .default('local'),
  MEDIA_LOCAL_PATH: Joi.string().default('./uploads'),
  MEDIA_MAX_FILE_SIZE_MB: Joi.number().default(10),
  MEDIA_PUBLIC_BASE_URL: Joi.string().default('http://localhost:3000/uploads'),

  // Email
  EMAIL_PROVIDER: Joi.string().valid('console', 'sendgrid').default('console'),

  // SMS
  SMS_PROVIDER: Joi.string()
    .valid('console', 'africastalking')
    .default('console'),

  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
});
