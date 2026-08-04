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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRentalRequestRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const rental_request_mapper_1 = require("./rental-request.mapper");
let PrismaRentalRequestRepository = class PrismaRentalRequestRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const raw = await this.prisma.rentalRequest.findUnique({ where: { id } });
        if (!raw)
            return null;
        return rental_request_mapper_1.RentalRequestMapper.toDomain(raw);
    }
    async findByCustomerId(customerId) {
        const raw = await this.prisma.rentalRequest.findMany({ where: { customerId } });
        return raw.map(rental_request_mapper_1.RentalRequestMapper.toDomain);
    }
    async findByWorkspaceId(workspaceId) {
        const raw = await this.prisma.rentalRequest.findMany({ where: { workspaceId } });
        return raw.map(rental_request_mapper_1.RentalRequestMapper.toDomain);
    }
    async save(rental) {
        const data = rental_request_mapper_1.RentalRequestMapper.toPersistence(rental);
        await this.prisma.rentalRequest.upsert({
            where: { id: rental.id },
            update: data,
            create: data,
        });
    }
};
exports.PrismaRentalRequestRepository = PrismaRentalRequestRepository;
exports.PrismaRentalRequestRepository = PrismaRentalRequestRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaRentalRequestRepository);
//# sourceMappingURL=prisma-rental-request.repository.js.map