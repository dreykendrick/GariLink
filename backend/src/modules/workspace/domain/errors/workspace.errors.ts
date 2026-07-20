import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../../../../core/errors/app-error';

export class WorkspaceNotFoundError extends NotFoundError {
  override readonly code = 'WORKSPACE_NOT_FOUND';
  constructor() { super('Workspace not found'); }
}

export class WorkspaceSlugTakenError extends ConflictError {
  override readonly code = 'WORKSPACE_SLUG_TAKEN';
  constructor() { super('This workspace slug is already in use'); }
}

export class WorkspaceMemberAlreadyExistsError extends ConflictError {
  override readonly code = 'WORKSPACE_MEMBER_EXISTS';
  constructor() { super('User is already a member of this workspace'); }
}

export class WorkspaceMemberNotFoundError extends NotFoundError {
  override readonly code = 'WORKSPACE_MEMBER_NOT_FOUND';
  constructor() { super('Workspace member not found'); }
}

export class WorkspaceAccessDeniedError extends ForbiddenError {
  override readonly code = 'WORKSPACE_ACCESS_DENIED';
  constructor() { super('You do not have permission to perform this action on this workspace'); }
}

export class CannotRemoveOwnerError extends ForbiddenError {
  override readonly code = 'CANNOT_REMOVE_OWNER';
  constructor() { super('The workspace owner cannot be removed. Transfer ownership first.'); }
}
