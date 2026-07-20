/**
 * Railway-oriented programming Result type.
 * Represents either a successful value (Ok) or a failure (Err).
 */
export class Result<Ok, Err = Error> {
  private readonly _isOk: boolean;
  private readonly _value: Ok | undefined;
  private readonly _error: Err | undefined;

  private constructor(isOk: boolean, value?: Ok, error?: Err) {
    this._isOk = isOk;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  /** Creates a successful result wrapping the given value. */
  static ok<Ok, Err = Error>(value: Ok): Result<Ok, Err> {
    return new Result<Ok, Err>(true, value, undefined);
  }

  /** Creates a failure result wrapping the given error. */
  static fail<Ok, Err = Error>(error: Err): Result<Ok, Err> {
    return new Result<Ok, Err>(false, undefined, error);
  }

  /** True when the result is a success. */
  get isOk(): boolean {
    return this._isOk;
  }

  /** True when the result is a failure. */
  get isFail(): boolean {
    return !this._isOk;
  }

  /**
   * Returns the success value.
   * @throws Error if the result is a failure.
   */
  get value(): Ok {
    if (!this._isOk) {
      throw new Error(
        'Cannot get value of a failed Result. Check isOk before accessing value.',
      );
    }
    return this._value as Ok;
  }

  /**
   * Returns the error value.
   * @throws Error if the result is a success.
   */
  get error(): Err {
    if (this._isOk) {
      throw new Error(
        'Cannot get error of a successful Result. Check isFail before accessing error.',
      );
    }
    return this._error as Err;
  }

  /**
   * Maps the success value using the provided function.
   * If the result is a failure, returns itself unchanged.
   */
  map<NewOk>(fn: (value: Ok) => NewOk): Result<NewOk, Err> {
    if (this._isOk) {
      return Result.ok<NewOk, Err>(fn(this._value as Ok));
    }
    return Result.fail<NewOk, Err>(this._error as Err);
  }

  /**
   * FlatMaps the success value using the provided function.
   * If the result is a failure, returns itself unchanged.
   */
  flatMap<NewOk>(fn: (value: Ok) => Result<NewOk, Err>): Result<NewOk, Err> {
    if (this._isOk) {
      return fn(this._value as Ok);
    }
    return Result.fail<NewOk, Err>(this._error as Err);
  }

  /**
   * Maps the error value using the provided function.
   * If the result is a success, returns itself unchanged.
   */
  mapError<NewErr>(fn: (error: Err) => NewErr): Result<Ok, NewErr> {
    if (!this._isOk) {
      return Result.fail<Ok, NewErr>(fn(this._error as Err));
    }
    return Result.ok<Ok, NewErr>(this._value as Ok);
  }

  /**
   * Executes the provided function if the result is a success.
   * Returns the original result unchanged.
   */
  tap(fn: (value: Ok) => void): Result<Ok, Err> {
    if (this._isOk) {
      fn(this._value as Ok);
    }
    return this;
  }

  /**
   * Executes the provided function if the result is a failure.
   * Returns the original result unchanged.
   */
  tapError(fn: (error: Err) => void): Result<Ok, Err> {
    if (!this._isOk) {
      fn(this._error as Err);
    }
    return this;
  }

  /**
   * Returns the success value or the provided default.
   */
  getOrElse(defaultValue: Ok): Ok {
    return this._isOk ? (this._value as Ok) : defaultValue;
  }

  /**
   * Combines multiple Results into a single Result containing an array.
   * Returns the first failure encountered.
   */
  static combine<T, E = Error>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (result.isFail) {
        return Result.fail<T[], E>(result.error);
      }
      values.push(result.value);
    }
    return Result.ok<T[], E>(values);
  }
}
