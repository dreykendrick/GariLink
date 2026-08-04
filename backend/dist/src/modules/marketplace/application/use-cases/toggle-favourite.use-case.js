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
exports.ToggleFavouriteUseCase = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
let ToggleFavouriteUseCase = class ToggleFavouriteUseCase {
    constructor(listingRepository) {
        this.listingRepository = listingRepository;
    }
    async execute(request) {
        const listing = await this.listingRepository.findById(request.listingId);
        if (!listing || listing.status === 'ARCHIVED') {
            return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
        }
        await this.listingRepository.toggleFavourite(request.userId, listing.vehicleId, request.action);
        return result_1.Result.ok(undefined);
    }
};
exports.ToggleFavouriteUseCase = ToggleFavouriteUseCase;
exports.ToggleFavouriteUseCase = ToggleFavouriteUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object])
], ToggleFavouriteUseCase);
//# sourceMappingURL=toggle-favourite.use-case.js.map