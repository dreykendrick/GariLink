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
var ConsoleEmailProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleEmailProvider = void 0;
const common_1 = require("@nestjs/common");
let ConsoleEmailProvider = ConsoleEmailProvider_1 = class ConsoleEmailProvider {
    constructor() {
        this.logger = new common_1.Logger(ConsoleEmailProvider_1.name);
        if (process.env.NODE_ENV === 'production') {
            throw new Error('ConsoleEmailProvider cannot be used in production. Configure a real email provider.');
        }
    }
    async sendVerificationEmail(to, code) {
        this.logger.log(`[DEV EMAIL] Verification code for ${to}: ${code}`);
    }
    async sendPasswordResetEmail(to, code) {
        this.logger.log(`[DEV EMAIL] Password reset code for ${to}: ${code}`);
    }
    async sendWelcomeEmail(to, name) {
        this.logger.log(`[DEV EMAIL] Welcome email sent to ${to} (${name})`);
    }
};
exports.ConsoleEmailProvider = ConsoleEmailProvider;
exports.ConsoleEmailProvider = ConsoleEmailProvider = ConsoleEmailProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ConsoleEmailProvider);
//# sourceMappingURL=console-email.provider.js.map