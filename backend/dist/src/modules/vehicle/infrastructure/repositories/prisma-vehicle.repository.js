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
exports.PrismaVehicleRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const vehicle_mapper_1 = require("../persistence/vehicle.mapper");
let PrismaVehicleRepository = class PrismaVehicleRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const record = await this.prisma.vehicle.findUnique({ where: { id } });
        if (!record)
            return null;
        return vehicle_mapper_1.VehicleMapper.toDomain(record);
    }
    async findByVin(vin) {
        const record = await this.prisma.vehicle.findUnique({ where: { vin } });
        if (!record)
            return null;
        return vehicle_mapper_1.VehicleMapper.toDomain(record);
    }
    async findByRegistrationNumber(registrationNumber) {
        const record = await this.prisma.vehicle.findUnique({ where: { registrationNumber } });
        if (!record)
            return null;
        return vehicle_mapper_1.VehicleMapper.toDomain(record);
    }
    async findByWorkspaceId(workspaceId, limit, offset) {
        const [records, total] = await this.prisma.$transaction([
            this.prisma.vehicle.findMany({
                where: { workspaceId },
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.vehicle.count({ where: { workspaceId } }),
        ]);
        return {
            data: records.map(r => vehicle_mapper_1.VehicleMapper.toDomain(r)),
            total,
        };
    }
    async save(vehicle) {
        const data = vehicle_mapper_1.VehicleMapper.toPersistence(vehicle);
        await this.prisma.vehicle.upsert({
            where: { id: vehicle.id },
            update: data,
            create: data,
        });
    }
    async delete(id) {
        await this.prisma.vehicle.delete({ where: { id } });
    }
    async findAll(limit, offset) {
        const [records, total] = await this.prisma.$transaction([
            this.prisma.vehicle.findMany({
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.vehicle.count(),
        ]);
        return {
            data: records.map(r => vehicle_mapper_1.VehicleMapper.toDomain(r)),
            total,
        };
    }
};
exports.PrismaVehicleRepository = PrismaVehicleRepository;
exports.PrismaVehicleRepository = PrismaVehicleRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaVehicleRepository);
//# sourceMappingURL=prisma-vehicle.repository.js.map