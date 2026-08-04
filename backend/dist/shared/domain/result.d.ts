export declare class Result<Ok, Err = Error> {
    private readonly _isOk;
    private readonly _value;
    private readonly _error;
    private constructor();
    static ok<Ok, Err = Error>(value: Ok): Result<Ok, Err>;
    static fail<Ok, Err = Error>(error: Err): Result<Ok, Err>;
    get isOk(): boolean;
    get isFail(): boolean;
    get value(): Ok;
    get error(): Err;
    map<NewOk>(fn: (value: Ok) => NewOk): Result<NewOk, Err>;
    flatMap<NewOk>(fn: (value: Ok) => Result<NewOk, Err>): Result<NewOk, Err>;
    mapError<NewErr>(fn: (error: Err) => NewErr): Result<Ok, NewErr>;
    tap(fn: (value: Ok) => void): Result<Ok, Err>;
    tapError(fn: (error: Err) => void): Result<Ok, Err>;
    getOrElse(defaultValue: Ok): Ok;
    static combine<T, E = Error>(results: Result<T, E>[]): Result<T[], E>;
}
