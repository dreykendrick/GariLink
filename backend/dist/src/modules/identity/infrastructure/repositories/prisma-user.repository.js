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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const user_mapper_1 = require("../persistence/user.mapper");
let PrismaUserRepository = class PrismaUserRepository {
    constructor(prisma) {
        this.prisma = prisma;
        this.include = { roles: true };
    }
    async findById(id) {
        const record = await this.prisma.user.findUnique({
            where: { id },
            include: this.include,
        });
        return record ? user_mapper_1.UserMapper.toDomain(record) : null;
    }
    async findByEmail(email) {
        const record = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: this.include,
        });
        return record ? user_mapper_1.UserMapper.toDomain(record) : null;
    }
    async findByPhoneNumber(phone) {
        const record = await this.prisma.user.findUnique({
            where: { phoneNumber: phone },
            include: this.include,
        });
        return record ? user_mapper_1.UserMapper.toDomain(record) : null;
    }
    async findByIdentifier(identifier) {
        const isEmail = identifier.includes('@');
        if (isEmail)
            return this.findByEmail(identifier);
        let phone = identifier.trim();
        if (phone.startsWith('0') && phone.length >= 10) {
            phone = '+255' + phone.substring(1);
        }
        else if (!phone.startsWith('+') && phone.length >= 9) {
            phone = '+' + phone;
        }
        const userByPhone = await this.findByPhoneNumber(phone);
        if (userByPhone)
            return userByPhone;
        return this.findByPhoneNumber(identifier);
    }
    async save(user) {
        const exists = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true },
        });
        if (!exists) {
            await this.prisma.user.create({
                data: {
                    ...user_mapper_1.UserMapper.toPrismaCreate(user),
                    roles: {
                        create: user.roles.map((role) => ({ role })),
                    },
                },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: user_mapper_1.UserMapper.toPrismaUpdate(user),
            });
            await this.prisma.userRoleRecord.deleteMany({ where: { userId: user.id } });
            if (user.roles.length > 0) {
                await this.prisma.userRoleRecord.createMany({
                    data: user.roles.map((role) => ({ userId: user.id, role })),
                    skipDuplicates: true,
                });
            }
        }
    }
    async delete(id) {
        await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=prisma-user.repository.js.map