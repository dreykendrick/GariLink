import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import { HASHING_SERVICE } from './hashing.interface';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CapabilitiesGuard } from './guards/capabilities.guard';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<string>('app.jwt.accessExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    { provide: HASHING_SERVICE, useClass: BcryptPasswordHasher },
    TokenService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    RolesGuard,
    CapabilitiesGuard,
  ],
  exports: [
    HASHING_SERVICE,
    TokenService,
    JwtModule,
    PassportModule,
    RolesGuard,
    CapabilitiesGuard,
  ],
})
export class SecurityModule {}
