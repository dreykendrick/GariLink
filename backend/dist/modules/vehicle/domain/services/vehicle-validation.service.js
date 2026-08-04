"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleValidationService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../../../core/errors/app-error");
class VehicleValidationService {
    static validateStatusTransition(currentStatus, newStatus) {
        if (currentStatus === newStatus) {
            return;
        }
        if (currentStatus === client_1.VehicleStatus.RETIRED && newStatus !== client_1.VehicleStatus.RETIRED) {
            throw new app_error_1.ValidationError('Cannot change status of a retired vehicle');
        }
        if (currentStatus === client_1.VehicleStatus.ARCHIVED && newStatus === client_1.VehicleStatus.DRAFT) {
            throw new app_error_1.ValidationError('Cannot move an archived vehicle back to draft status');
        }
    }
}
exports.VehicleValidationService = VehicleValidationService;
//# sourceMappingURL=vehicle-validation.service.js.map