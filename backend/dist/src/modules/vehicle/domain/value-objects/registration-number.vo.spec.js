"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registration_number_vo_1 = require("./registration-number.vo");
const app_error_1 = require("../../../../core/errors/app-error");
describe('RegistrationNumber Value Object', () => {
    it('should create a valid registration number', () => {
        const reg = new registration_number_vo_1.RegistrationNumber({ value: 'KCA 123A' });
        expect(reg.value).toBe('KCA 123A');
    });
    it('should format registration number to uppercase', () => {
        const reg = new registration_number_vo_1.RegistrationNumber({ value: 'kca 123a' });
        expect(reg.value).toBe('KCA 123A');
    });
    it('should throw ValidationError if empty string', () => {
        expect(() => new registration_number_vo_1.RegistrationNumber({ value: '' })).toThrow(app_error_1.ValidationError);
    });
    it('should throw ValidationError if it contains invalid characters', () => {
        expect(() => new registration_number_vo_1.RegistrationNumber({ value: 'KCA@123A' })).toThrow(app_error_1.ValidationError);
    });
});
//# sourceMappingURL=registration-number.vo.spec.js.map