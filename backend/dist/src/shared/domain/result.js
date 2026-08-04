"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
class Result {
    constructor(isOk, value, error) {
        this._isOk = isOk;
        this._value = value;
        this._error = error;
        Object.freeze(this);
    }
    static ok(value) {
        return new Result(true, value, undefined);
    }
    static fail(error) {
        return new Result(false, undefined, error);
    }
    get isOk() {
        return this._isOk;
    }
    get isFail() {
        return !this._isOk;
    }
    get value() {
        if (!this._isOk) {
            throw new Error('Cannot get value of a failed Result. Check isOk before accessing value.');
        }
        return this._value;
    }
    get error() {
        if (this._isOk) {
            throw new Error('Cannot get error of a successful Result. Check isFail before accessing error.');
        }
        return this._error;
    }
    map(fn) {
        if (this._isOk) {
            return Result.ok(fn(this._value));
        }
        return Result.fail(this._error);
    }
    flatMap(fn) {
        if (this._isOk) {
            return fn(this._value);
        }
        return Result.fail(this._error);
    }
    mapError(fn) {
        if (!this._isOk) {
            return Result.fail(fn(this._error));
        }
        return Result.ok(this._value);
    }
    tap(fn) {
        if (this._isOk) {
            fn(this._value);
        }
        return this;
    }
    tapError(fn) {
        if (!this._isOk) {
            fn(this._error);
        }
        return this;
    }
    getOrElse(defaultValue) {
        return this._isOk ? this._value : defaultValue;
    }
    static combine(results) {
        const values = [];
        for (const result of results) {
            if (result.isFail) {
                return Result.fail(result.error);
            }
            values.push(result.value);
        }
        return Result.ok(values);
    }
}
exports.Result = Result;
//# sourceMappingURL=result.js.map