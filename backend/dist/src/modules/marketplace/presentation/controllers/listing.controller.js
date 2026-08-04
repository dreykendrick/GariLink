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
exports.ListingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../../../core/security/decorators/current-user.decorator");
const public_decorator_1 = require("../../../../core/security/decorators/public.decorator");
const listing_dto_1 = require("../../application/dto/listing.dto");
const create_listing_use_case_1 = require("../../application/use-cases/create-listing.use-case");
const search_listings_use_case_1 = require("../../application/use-cases/search-listings.use-case");
const get_listing_use_case_1 = require("../../application/use-cases/get-listing.use-case");
const get_saved_listings_use_case_1 = require("../../application/use-cases/get-saved-listings.use-case");
const toggle_favourite_use_case_1 = require("../../application/use-cases/toggle-favourite.use-case");
const owner_listing_use_cases_1 = require("../../application/use-cases/owner-listing.use-cases");
let ListingController = class ListingController {
    constructor(createListingUseCase, searchListingsUseCase, getListingUseCase, getSavedListingsUseCase, toggleFavouriteUseCase, getMyListingsUseCase, publishListingUseCase, pauseListingUseCase, archiveListingUseCase, restoreListingUseCase, deleteListingUseCase, updateListingUseCase) {
        this.createListingUseCase = createListingUseCase;
        this.searchListingsUseCase = searchListingsUseCase;
        this.getListingUseCase = getListingUseCase;
        this.getSavedListingsUseCase = getSavedListingsUseCase;
        this.toggleFavouriteUseCase = toggleFavouriteUseCase;
        this.getMyListingsUseCase = getMyListingsUseCase;
        this.publishListingUseCase = publishListingUseCase;
        this.pauseListingUseCase = pauseListingUseCase;
        this.archiveListingUseCase = archiveListingUseCase;
        this.restoreListingUseCase = restoreListingUseCase;
        this.deleteListingUseCase = deleteListingUseCase;
        this.updateListingUseCase = updateListingUseCase;
    }
    async create(dto, user) {
        const result = await this.createListingUseCase.execute({ ...dto, userId: user.userId });
        if (result.isFail)
            throw result.error;
        const val = result.value;
        return {
            id: val.id,
            ...val.props,
            rentalConfig: val.rentalConfig ? {
                dailyRate: val.rentalConfig.dailyRate.amount,
                currency: val.rentalConfig.dailyRate.currency.code,
                depositAmount: val.rentalConfig.depositAmount,
                pickupCounty: val.rentalConfig.pickupCounty,
                pickupCity: val.rentalConfig.pickupCity,
                fuelPolicy: val.rentalConfig.fuelPolicy,
                minimumRentalDays: val.rentalConfig.minimumRentalDays,
            } : undefined
        };
    }
    async search(query) {
        const result = await this.searchListingsUseCase.execute(query);
        return {
            data: result.data.map(listing => {
                const { rentalConfig, ...props } = listing.props;
                return {
                    id: listing.id,
                    ...props,
                    vehicle: listing.vehicle,
                    rentalConfig: listing.rentalConfig ? {
                        dailyRate: listing.rentalConfig.dailyRate.amount,
                        currency: listing.rentalConfig.dailyRate.currency.code,
                        depositAmount: listing.rentalConfig.depositAmount,
                        pickupCounty: listing.rentalConfig.pickupCounty,
                        pickupCity: listing.rentalConfig.pickupCity,
                        fuelPolicy: listing.rentalConfig.fuelPolicy,
                        minimumRentalDays: listing.rentalConfig.minimumRentalDays,
                    } : undefined
                };
            }),
            meta: result.meta,
        };
    }
    async getMyListings(query, user) {
        const result = await this.getMyListingsUseCase.execute(user.userId, query);
        if (result.isFail)
            throw result.error;
        return {
            data: result.value.data.map(listing => {
                const { rentalConfig, ...props } = listing.props;
                return {
                    id: listing.id,
                    ...props,
                    vehicle: listing.vehicle,
                    rentalConfig: listing.rentalConfig ? {
                        dailyRate: listing.rentalConfig.dailyRate.amount,
                        currency: listing.rentalConfig.dailyRate.currency.code,
                        depositAmount: listing.rentalConfig.depositAmount,
                        pickupCounty: listing.rentalConfig.pickupCounty,
                        pickupCity: listing.rentalConfig.pickupCity,
                        fuelPolicy: listing.rentalConfig.fuelPolicy,
                        minimumRentalDays: listing.rentalConfig.minimumRentalDays,
                    } : undefined
                };
            }),
            meta: result.value.meta,
        };
    }
    async getSavedListings(user) {
        const result = await this.getSavedListingsUseCase.execute({ userId: user.userId });
        if (result.isFail)
            throw result.error;
        return result.value.map(listing => {
            const { rentalConfig, ...props } = listing.props;
            return {
                id: listing.id,
                ...props,
                vehicle: listing.vehicle,
                rentalConfig: listing.rentalConfig ? {
                    dailyRate: listing.rentalConfig.dailyRate.amount,
                    currency: listing.rentalConfig.dailyRate.currency.code,
                    depositAmount: listing.rentalConfig.depositAmount,
                    pickupCounty: listing.rentalConfig.pickupCounty,
                    pickupCity: listing.rentalConfig.pickupCity,
                    fuelPolicy: listing.rentalConfig.fuelPolicy,
                    minimumRentalDays: listing.rentalConfig.minimumRentalDays,
                } : undefined
            };
        });
    }
    async getListing(id) {
        const result = await this.getListingUseCase.execute({ id });
        if (result.isFail)
            throw result.error;
        const listing = result.value;
        const { rentalConfig, ...props } = listing.props;
        return {
            id: listing.id,
            ...props,
            vehicle: listing.vehicle,
            rentalConfig: listing.rentalConfig ? {
                dailyRate: listing.rentalConfig.dailyRate.amount,
                currency: listing.rentalConfig.dailyRate.currency.code,
                depositAmount: listing.rentalConfig.depositAmount,
                pickupCounty: listing.rentalConfig.pickupCounty,
                pickupCity: listing.rentalConfig.pickupCity,
                fuelPolicy: listing.rentalConfig.fuelPolicy,
                minimumRentalDays: listing.rentalConfig.minimumRentalDays,
            } : undefined
        };
    }
    async saveListing(id, user) {
        const result = await this.toggleFavouriteUseCase.execute({ userId: user.userId, listingId: id, action: 'save' });
        if (result.isFail)
            throw result.error;
        return { saved: true };
    }
    async removeSavedListing(id, user) {
        const result = await this.toggleFavouriteUseCase.execute({ userId: user.userId, listingId: id, action: 'remove' });
        if (result.isFail)
            throw result.error;
    }
    async updateListing(id, updateData, user) {
        const result = await this.updateListingUseCase.execute(user.userId, id, updateData);
        if (result.isFail)
            throw result.error;
        return { id: result.value.id, ...result.value.props };
    }
    async publishListing(id, user) {
        const result = await this.publishListingUseCase.execute(user.userId, id);
        if (result.isFail)
            throw result.error;
        return { id: result.value.id, status: result.value.status };
    }
    async pauseListing(id, user) {
        const result = await this.pauseListingUseCase.execute(user.userId, id);
        if (result.isFail)
            throw result.error;
        return { id: result.value.id, status: result.value.status };
    }
    async archiveListing(id, user) {
        const result = await this.archiveListingUseCase.execute(user.userId, id);
        if (result.isFail)
            throw result.error;
        return { id: result.value.id, status: result.value.status };
    }
    async restoreListing(id, user) {
        const result = await this.restoreListingUseCase.execute(user.userId, id);
        if (result.isFail)
            throw result.error;
        return { id: result.value.id, status: result.value.status };
    }
    async deleteListing(id, user) {
        const result = await this.deleteListingUseCase.execute(user.userId, id);
        if (result.isFail)
            throw result.error;
    }
};
exports.ListingController = ListingController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new listing' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [listing_dto_1.CreateListingDto, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search listings' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [listing_dto_1.SearchRentalListingsDto]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get listings owned by the current user' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "getMyListings", null);
__decorate([
    (0, common_1.Get)('saved'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get saved listings for the current user' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "getSavedListings", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get listing by ID' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "getListing", null);
__decorate([
    (0, common_1.Post)(':id/save'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Save a listing' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "saveListing", null);
__decorate([
    (0, common_1.Delete)(':id/save'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a saved listing' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "removeSavedListing", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a listing' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "updateListing", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a listing' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "publishListing", null);
__decorate([
    (0, common_1.Post)(':id/pause'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Pause a listing' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "pauseListing", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a listing' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "archiveListing", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a listing' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "restoreListing", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a listing (soft delete)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingController.prototype, "deleteListing", null);
exports.ListingController = ListingController = __decorate([
    (0, swagger_1.ApiTags)('Listings'),
    (0, common_1.Controller)('listings'),
    __metadata("design:paramtypes", [create_listing_use_case_1.CreateListingUseCase,
        search_listings_use_case_1.SearchListingsUseCase,
        get_listing_use_case_1.GetListingUseCase,
        get_saved_listings_use_case_1.GetSavedListingsUseCase,
        toggle_favourite_use_case_1.ToggleFavouriteUseCase,
        owner_listing_use_cases_1.GetMyListingsUseCase,
        owner_listing_use_cases_1.PublishListingUseCase,
        owner_listing_use_cases_1.PauseListingUseCase,
        owner_listing_use_cases_1.ArchiveListingUseCase,
        owner_listing_use_cases_1.RestoreListingUseCase,
        owner_listing_use_cases_1.DeleteListingUseCase,
        owner_listing_use_cases_1.UpdateListingUseCase])
], ListingController);
//# sourceMappingURL=listing.controller.js.map