"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMyRentalRequestsUseCase = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
let GetMyRentalRequestsUseCase = class GetMyRentalRequestsUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(customerId) {
        const rentals = await this.repo.findByCustomerId(customerId);
        return result_1.Result.ok(rentals);
    }
};
exports.GetMyRentalRequestsUseCase = GetMyRentalRequestsUseCase;
exports.GetMyRentalRequestsUseCase = GetMyRentalRequestsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IRentalRequestRepository')),
    __metadata("design:paramtypes", [Object])
], GetMyRentalRequestsUseCase);
//# sourceMappingURL=get-my-rental-requests.use-case.js.map