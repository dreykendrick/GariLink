"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vehicle_year_vo_1 = require("./vehicle-year.vo");
const app_error_1 = require("../../../../core/errors/app-error");
describe('VehicleYear Value Object', () => {
    it('should create a valid year', () => {
        const year = new vehicle_year_vo_1.VehicleYear({ value: 2015 });
        expect(year.value).toBe(2015);
    });
    it('should throw ValidationError if year is before 1900', () => {
        expect(() => new vehicle_year_vo_1.VehicleYear({ value: 1899 })).toThrow(app_error_1.ValidationError);
    });
    it('should throw ValidationError if year is in the future (beyond next year)', () => {
        const futureYear = new Date().getFullYear() + 2;
        expect(() => new vehicle_year_vo_1.VehicleYear({ value: futureYear })).toThrow(app_error_1.ValidationError);
    });
    it('should allow current year', () => {
        const currentYear = new Date().getFullYear();
        const year = new vehicle_year_vo_1.VehicleYear({ value: currentYear });
        expect(year.value).toBe(currentYear);
    });
    it('should allow next year', () => {
        const nextYear = new Date().getFullYear() + 1;
        const year = new vehicle_year_vo_1.VehicleYear({ value: nextYear });
        expect(year.value).toBe(nextYear);
    });
});
//# sourceMappingURL=vehicle-year.vo.spec.js.map