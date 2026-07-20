import { Global, Injectable, Logger, Module } from '@nestjs/common';

@Injectable()
export class AppLogger {
  private readonly logger: Logger;

  constructor(context?: string) {
    this.logger = new Logger(context ?? 'App');
  }

  forContext(context: string): AppLogger {
    return new AppLogger(context);
  }

  log(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'production') {
      process.stdout.write(
        JSON.stringify({ level: 'info', message, context, ts: new Date().toISOString() }) + '\n',
      );
    } else {
      this.logger.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string): void {
    if (process.env.NODE_ENV === 'production') {
      process.stdout.write(
        JSON.stringify({ level: 'error', message, trace, context, ts: new Date().toISOString() }) + '\n',
      );
    } else {
      this.logger.error(message, trace, context);
    }
  }

  warn(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'production') {
      process.stdout.write(
        JSON.stringify({ level: 'warn', message, context, ts: new Date().toISOString() }) + '\n',
      );
    } else {
      this.logger.warn(message, context);
    }
  }

  debug(message: string, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(message, context);
    }
  }
}

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
