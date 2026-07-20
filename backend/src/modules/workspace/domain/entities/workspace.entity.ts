import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { WorkspaceType, WorkspaceMemberRole } from '@prisma/client';

export interface WorkspaceProps {
  name: string;
  type: WorkspaceType;
  ownerId: string;
  slug: string | null;
  description: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  country: string;
}

export class Workspace extends AggregateRoot<string> {
  private _name: string;
  private _type: WorkspaceType;
  private _ownerId: string;
  private _slug: string | null;
  private _description: string | null;
  private _logoUrl: string | null;
  private _isVerified: boolean;
  private _isActive: boolean;
  private _country: string;

  constructor(id: string, props: WorkspaceProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._name = props.name;
    this._type = props.type;
    this._ownerId = props.ownerId;
    this._slug = props.slug;
    this._description = props.description;
    this._logoUrl = props.logoUrl;
    this._isVerified = props.isVerified;
    this._isActive = props.isActive;
    this._country = props.country;
  }

  get name(): string { return this._name; }
  get type(): WorkspaceType { return this._type; }
  get ownerId(): string { return this._ownerId; }
  get slug(): string | null { return this._slug; }
  get description(): string | null { return this._description; }
  get logoUrl(): string | null { return this._logoUrl; }
  get isVerified(): boolean { return this._isVerified; }
  get isActive(): boolean { return this._isActive; }
  get country(): string { return this._country; }

  update(fields: Partial<Pick<WorkspaceProps, 'name' | 'description' | 'logoUrl' | 'slug'>>): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.description !== undefined) this._description = fields.description;
    if (fields.logoUrl !== undefined) this._logoUrl = fields.logoUrl;
    if (fields.slug !== undefined) this._slug = fields.slug;
    this.touch();
  }

  verify(): void {
    this._isVerified = true;
    this.touch();
  }

  deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  activate(): void {
    this._isActive = true;
    this.touch();
  }

  static create(id: string, props: WorkspaceProps): Workspace {
    return new Workspace(id, props);
  }
}

export class WorkspaceMember extends AggregateRoot<string> {
  constructor(
    id: string,
    public readonly workspaceId: string,
    public readonly userId: string,
    public role: WorkspaceMemberRole,
    public isActive: boolean,
    public readonly invitedBy: string | null,
    public readonly joinedAt: Date | null,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  promote(role: WorkspaceMemberRole): void {
    this.role = role;
    this.touch();
  }

  deactivate(): void {
    this.isActive = false;
    this.touch();
  }

  static create(params: {
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceMemberRole;
    invitedBy?: string;
  }): WorkspaceMember {
    return new WorkspaceMember(
      params.id,
      params.workspaceId,
      params.userId,
      params.role,
      true,
      params.invitedBy ?? null,
      new Date(),
    );
  }
}
