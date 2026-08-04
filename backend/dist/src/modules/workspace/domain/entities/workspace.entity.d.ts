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
export declare class Workspace extends AggregateRoot<string> {
    private _name;
    private _type;
    private _ownerId;
    private _slug;
    private _description;
    private _logoUrl;
    private _isVerified;
    private _isActive;
    private _country;
    constructor(id: string, props: WorkspaceProps, createdAt?: Date, updatedAt?: Date);
    get name(): string;
    get type(): WorkspaceType;
    get ownerId(): string;
    get slug(): string | null;
    get description(): string | null;
    get logoUrl(): string | null;
    get isVerified(): boolean;
    get isActive(): boolean;
    get country(): string;
    update(fields: Partial<Pick<WorkspaceProps, 'name' | 'description' | 'logoUrl' | 'slug'>>): void;
    verify(): void;
    deactivate(): void;
    activate(): void;
    static create(id: string, props: WorkspaceProps): Workspace;
}
export declare class WorkspaceMember extends AggregateRoot<string> {
    readonly workspaceId: string;
    readonly userId: string;
    role: WorkspaceMemberRole;
    isActive: boolean;
    readonly invitedBy: string | null;
    readonly joinedAt: Date | null;
    constructor(id: string, workspaceId: string, userId: string, role: WorkspaceMemberRole, isActive: boolean, invitedBy: string | null, joinedAt: Date | null, createdAt?: Date, updatedAt?: Date);
    promote(role: WorkspaceMemberRole): void;
    deactivate(): void;
    static create(params: {
        id: string;
        workspaceId: string;
        userId: string;
        role: WorkspaceMemberRole;
        invitedBy?: string;
    }): WorkspaceMember;
}
