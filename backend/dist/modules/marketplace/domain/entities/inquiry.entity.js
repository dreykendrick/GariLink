"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inquiry = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
const client_1 = require("@prisma/client");
class Inquiry extends entity_base_1.Entity {
    constructor(id, listingId, inquirerId, status, message, offeredPrice, offerCurrency, respondedAt, respondedById, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this.listingId = listingId;
        this.inquirerId = inquirerId;
        this.status = status;
        this.message = message;
        this.offeredPrice = offeredPrice;
        this.offerCurrency = offerCurrency;
        this.respondedAt = respondedAt;
        this.respondedById = respondedById;
    }
    accept() {
        this.status = client_1.InquiryStatus.ACCEPTED;
        this.respondedAt = new Date();
        this.touch();
    }
    decline() {
        this.status = client_1.InquiryStatus.DECLINED;
        this.respondedAt = new Date();
        this.touch();
    }
    close() {
        this.status = client_1.InquiryStatus.CLOSED;
        this.touch();
    }
    static create(params) {
        return new Inquiry(params.id, params.listingId, params.inquirerId, client_1.InquiryStatus.PENDING, params.message, params.offeredPrice ?? null, params.offerCurrency ?? null, null, null);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.Inquiry = Inquiry;
//# sourceMappingURL=inquiry.entity.js.map