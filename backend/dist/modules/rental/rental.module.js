"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_rental_request_repository_1 = require("./infrastructure/persistence/prisma-rental-request.repository");
const create_rental_request_use_case_1 = require("./use-cases/customer/create-rental-request.use-case");
const cancel_rental_request_use_case_1 = require("./use-cases/customer/cancel-rental-request.use-case");
const get_my_rental_requests_use_case_1 = require("./use-cases/customer/get-my-rental-requests.use-case");
const get_workspace_rental_requests_use_case_1 = require("./use-cases/owner/get-workspace-rental-requests.use-case");
const approve_rental_request_use_case_1 = require("./use-cases/owner/approve-rental-request.use-case");
const reject_rental_request_use_case_1 = require("./use-cases/owner/reject-rental-request.use-case");
const mark_rental_ready_use_case_1 = require("./use-cases/owner/mark-rental-ready.use-case");
const start_rental_use_case_1 = require("./use-cases/owner/start-rental.use-case");
const complete_rental_use_case_1 = require("./use-cases/owner/complete-rental.use-case");
const customer_rental_controller_1 = require("./controllers/customer-rental.controller");
const owner_rental_controller_1 = require("./controllers/owner-rental.controller");
const prisma_service_1 = require("../../shared/infrastructure/prisma.service");
const useCases = [
    create_rental_request_use_case_1.CreateRentalRequestUseCase,
    cancel_rental_request_use_case_1.CancelRentalRequestUseCase,
    get_my_rental_requests_use_case_1.GetMyRentalRequestsUseCase,
    get_workspace_rental_requests_use_case_1.GetWorkspaceRentalRequestsUseCase,
    approve_rental_request_use_case_1.ApproveRentalRequestUseCase,
    reject_rental_request_use_case_1.RejectRentalRequestUseCase,
    mark_rental_ready_use_case_1.MarkRentalReadyUseCase,
    start_rental_use_case_1.StartRentalUseCase,
    complete_rental_use_case_1.CompleteRentalUseCase,
];
let RentalModule = class RentalModule {
};
exports.RentalModule = RentalModule;
exports.RentalModule = RentalModule = __decorate([
    (0, common_1.Module)({
        controllers: [customer_rental_controller_1.CustomerRentalController, owner_rental_controller_1.OwnerRentalController],
        providers: [
            prisma_service_1.PrismaService,
            {
                provide: 'IRentalRequestRepository',
                useClass: prisma_rental_request_repository_1.PrismaRentalRequestRepository,
            },
            ...useCases,
        ],
        exports: [
            'IRentalRequestRepository',
            ...useCases,
        ],
    })
], RentalModule);
//# sourceMappingURL=rental.module.js.map