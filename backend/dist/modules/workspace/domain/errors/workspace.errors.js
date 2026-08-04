"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotRemoveOwnerError = exports.WorkspaceAccessDeniedError = exports.WorkspaceMemberNotFoundError = exports.WorkspaceMemberAlreadyExistsError = exports.WorkspaceSlugTakenError = exports.WorkspaceNotFoundError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class WorkspaceNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Workspace not found');
        this.code = 'WORKSPACE_NOT_FOUND';
    }
}
exports.WorkspaceNotFoundError = WorkspaceNotFoundError;
class WorkspaceSlugTakenError extends app_error_1.ConflictError {
    constructor() {
        super('This workspace slug is already in use');
        this.code = 'WORKSPACE_SLUG_TAKEN';
    }
}
exports.WorkspaceSlugTakenError = WorkspaceSlugTakenError;
class WorkspaceMemberAlreadyExistsError extends app_error_1.ConflictError {
    constructor() {
        super('User is already a member of this workspace');
        this.code = 'WORKSPACE_MEMBER_EXISTS';
    }
}
exports.WorkspaceMemberAlreadyExistsError = WorkspaceMemberAlreadyExistsError;
class WorkspaceMemberNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Workspace member not found');
        this.code = 'WORKSPACE_MEMBER_NOT_FOUND';
    }
}
exports.WorkspaceMemberNotFoundError = WorkspaceMemberNotFoundError;
class WorkspaceAccessDeniedError extends app_error_1.ForbiddenError {
    constructor() {
        super('You do not have permission to perform this action on this workspace');
        this.code = 'WORKSPACE_ACCESS_DENIED';
    }
}
exports.WorkspaceAccessDeniedError = WorkspaceAccessDeniedError;
class CannotRemoveOwnerError extends app_error_1.ForbiddenError {
    constructor() {
        super('The workspace owner cannot be removed. Transfer ownership first.');
        this.code = 'CANNOT_REMOVE_OWNER';
    }
}
exports.CannotRemoveOwnerError = CannotRemoveOwnerError;
//# sourceMappingURL=workspace.errors.js.map