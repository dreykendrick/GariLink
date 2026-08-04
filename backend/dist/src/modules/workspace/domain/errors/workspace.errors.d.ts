import { ConflictError, NotFoundError, ForbiddenError } from '../../../../core/errors/app-error';
export declare class WorkspaceNotFoundError extends NotFoundError {
    readonly code = "WORKSPACE_NOT_FOUND";
    constructor();
}
export declare class WorkspaceSlugTakenError extends ConflictError {
    readonly code = "WORKSPACE_SLUG_TAKEN";
    constructor();
}
export declare class WorkspaceMemberAlreadyExistsError extends ConflictError {
    readonly code = "WORKSPACE_MEMBER_EXISTS";
    constructor();
}
export declare class WorkspaceMemberNotFoundError extends NotFoundError {
    readonly code = "WORKSPACE_MEMBER_NOT_FOUND";
    constructor();
}
export declare class WorkspaceAccessDeniedError extends ForbiddenError {
    readonly code = "WORKSPACE_ACCESS_DENIED";
    constructor();
}
export declare class CannotRemoveOwnerError extends ForbiddenError {
    readonly code = "CANNOT_REMOVE_OWNER";
    constructor();
}
