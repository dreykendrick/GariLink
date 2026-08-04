"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const openapi = require("@nestjs/swagger");
const aggregate_root_base_1 = require("../../../../shared/domain/aggregate-root.base");
class User extends aggregate_root_base_1.AggregateRoot {
    constructor(id, props, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this._email = props.email;
        this._phoneNumber = props.phoneNumber;
        this._passwordHash = props.passwordHash;
        this._roles = [...props.roles];
        this._isEmailVerified = props.isEmailVerified;
        this._isPhoneVerified = props.isPhoneVerified;
        this._isActive = props.isActive;
        this._lastLoginAt = props.lastLoginAt;
        this._failedLoginAttempts = props.failedLoginAttempts;
        this._lockedUntil = props.lockedUntil;
    }
    get email() { return this._email; }
    get phoneNumber() { return this._phoneNumber; }
    get passwordHash() { return this._passwordHash; }
    get roles() { return [...this._roles]; }
    get isEmailVerified() { return this._isEmailVerified; }
    get isPhoneVerified() { return this._isPhoneVerified; }
    get isActive() { return this._isActive; }
    get lastLoginAt() { return this._lastLoginAt; }
    get failedLoginAttempts() { return this._failedLoginAttempts; }
    get lockedUntil() { return this._lockedUntil; }
    static create(props, id) {
        const { v4: uuidv4 } = require('uuid');
        return new User(id ?? uuidv4(), props);
    }
    verifyPhone() {
        this._isPhoneVerified = true;
        this.touch();
    }
    verifyEmail() {
        this._isEmailVerified = true;
        this.touch();
    }
    updateEmail(email) {
        this._email = email;
        this._isEmailVerified = false;
        this.touch();
    }
    recordFailedLogin() {
        this._failedLoginAttempts += 1;
        this.touch();
    }
    lock(until) {
        this._lockedUntil = until;
        this.touch();
    }
    unlock() {
        this._lockedUntil = null;
        this._failedLoginAttempts = 0;
        this.touch();
    }
    isLocked() {
        if (!this._lockedUntil)
            return false;
        return this._lockedUntil > new Date();
    }
    updateLastLogin() {
        this._lastLoginAt = new Date();
        this._failedLoginAttempts = 0;
        this._lockedUntil = null;
        this.touch();
    }
    deactivate() {
        this._isActive = false;
        this.touch();
    }
    activate() {
        this._isActive = true;
        this.touch();
    }
    hasRole(role) {
        return this._roles.includes(role);
    }
    addRole(role) {
        if (!this._roles.includes(role)) {
            this._roles.push(role);
            this.touch();
        }
    }
    removeRole(role) {
        this._roles = this._roles.filter((r) => r !== role);
        this.touch();
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { _email: { required: true, type: () => require("../value-objects/email.vo").Email, nullable: true }, _phoneNumber: { required: true, type: () => require("../value-objects/phone-number.vo").PhoneNumber }, _passwordHash: { required: true, type: () => String }, _roles: { required: true, type: () => [Object] }, _isEmailVerified: { required: true, type: () => Boolean }, _isPhoneVerified: { required: true, type: () => Boolean }, _isActive: { required: true, type: () => Boolean }, _lastLoginAt: { required: true, type: () => Date, nullable: true }, _failedLoginAttempts: { required: true, type: () => Number }, _lockedUntil: { required: true, type: () => Date, nullable: true } };
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map