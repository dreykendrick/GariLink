"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const media_storage_port_1 = require("./application/ports/media-storage.port");
const upload_media_use_case_1 = require("./application/use-cases/upload-media.use-case");
const file_validator_service_1 = require("./application/services/file-validator.service");
const local_media_storage_provider_1 = require("./infrastructure/storage/local-media-storage.provider");
const media_controller_1 = require("./presentation/media.controller");
let MediaModule = class MediaModule {
};
exports.MediaModule = MediaModule;
exports.MediaModule = MediaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.memoryStorage)(),
            }),
        ],
        controllers: [media_controller_1.MediaController],
        providers: [
            { provide: media_storage_port_1.MEDIA_STORAGE, useClass: local_media_storage_provider_1.LocalMediaStorageProvider },
            file_validator_service_1.FileValidatorService,
            upload_media_use_case_1.UploadMediaUseCase,
        ],
        exports: [media_storage_port_1.MEDIA_STORAGE, file_validator_service_1.FileValidatorService, upload_media_use_case_1.UploadMediaUseCase],
    })
], MediaModule);
//# sourceMappingURL=media.module.js.map