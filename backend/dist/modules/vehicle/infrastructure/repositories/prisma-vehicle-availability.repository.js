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
exports.PrismaVehicleAvailabilityRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const vehicle_availability_mapper_1 = require("../persistence/vehicle-availability.mapper");
let PrismaVehicleAvailabilityRepository = class PrismaVehicleAvailabilityRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(block) {
        const data = vehicle_availability_mapper_1.VehicleAvailabilityMapper.toPersistence(block);
        await this.prisma.vehicleAvailabilityBlock.upsert({
            where: { id: block.id },
            update: data,
            create: data,
        });
    }
    async findOverlappingBlocks(vehicleId, startDate, endDate) {
        const records = await this.prisma.vehicleAvailabilityBlock.findMany({
            where: {
                vehicleId,
                AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gt: startDate } }
                ]
            }
        });
        return records.map(r => vehicle_availability_mapper_1.VehicleAvailabilityMapper.toDomain(r));
    }
    async findByVehicleId(vehicleId) {
        const records = await this.prisma.vehicleAvailabilityBlock.findMany({
            where: { vehicleId },
            orderBy: { startDate: 'asc' }
        });
        return records.map(r => vehicle_availability_mapper_1.VehicleAvailabilityMapper.toDomain(r));
    }
};
exports.PrismaVehicleAvailabilityRepository = PrismaVehicleAvailabilityRepository;
exports.PrismaVehicleAvailabilityRepository = PrismaVehicleAvailabilityRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaVehicleAvailabilityRepository);
//# sourceMappingURL=prisma-vehicle-availability.repository.js.map