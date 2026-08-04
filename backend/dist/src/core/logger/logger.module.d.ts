export declare class AppLogger {
    private readonly logger;
    constructor(context?: string);
    forContext(context: string): AppLogger;
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
}
export declare class LoggerModule {
}
