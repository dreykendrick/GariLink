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
exports.GetListingUseCase = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
let GetListingUseCase = class GetListingUseCase {
    constructor(listingRepository) {
        this.listingRepository = listingRepository;
    }
    async execute(request) {
        const listing = await this.listingRepository.findById(request.id);
        if (!listing || listing.status === 'ARCHIVED') {
            return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
        }
        listing.incrementView();
        await this.listingRepository.save(listing);
        return result_1.Result.ok(listing);
    }
};
exports.GetListingUseCase = GetListingUseCase;
exports.GetListingUseCase = GetListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object])
], GetListingUseCase);
//# sourceMappingURL=get-listing.use-case.js.map