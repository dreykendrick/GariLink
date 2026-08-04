"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceMember = exports.Workspace = void 0;
const openapi = require("@nestjs/swagger");
const aggregate_root_base_1 = require("../../../../shared/domain/aggregate-root.base");
class Workspace extends aggregate_root_base_1.AggregateRoot {
    constructor(id, props, createdAt, updatedAt) {
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
    get name() { return this._name; }
    get type() { return this._type; }
    get ownerId() { return this._ownerId; }
    get slug() { return this._slug; }
    get description() { return this._description; }
    get logoUrl() { return this._logoUrl; }
    get isVerified() { return this._isVerified; }
    get isActive() { return this._isActive; }
    get country() { return this._country; }
    update(fields) {
        if (fields.name !== undefined)
            this._name = fields.name;
        if (fields.description !== undefined)
            this._description = fields.description;
        if (fields.logoUrl !== undefined)
            this._logoUrl = fields.logoUrl;
        if (fields.slug !== undefined)
            this._slug = fields.slug;
        this.touch();
    }
    verify() {
        this._isVerified = true;
        this.touch();
    }
    deactivate() {
        this._isActive = false;
        this.touch();
    }
    activate() {
        this._isActive = true;
        this.touch();
    }
    static create(id, props) {
        return new Workspace(id, props);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { _name: { required: true, type: () => String }, _type: { required: true, type: () => Object }, _ownerId: { required: true, type: () => String }, _slug: { required: true, type: () => String, nullable: true }, _description: { required: true, type: () => String, nullable: true }, _logoUrl: { required: true, type: () => String, nullable: true }, _isVerified: { required: true, type: () => Boolean }, _isActive: { required: true, type: () => Boolean }, _country: { required: true, type: () => String } };
    }
}
exports.Workspace = Workspace;
class WorkspaceMember extends aggregate_root_base_1.AggregateRoot {
    constructor(id, workspaceId, userId, role, isActive, invitedBy, joinedAt, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.role = role;
        this.isActive = isActive;
        this.invitedBy = invitedBy;
        this.joinedAt = joinedAt;
    }
    promote(role) {
        this.role = role;
        this.touch();
    }
    deactivate() {
        this.isActive = false;
        this.touch();
    }
    static create(params) {
        return new WorkspaceMember(params.id, params.workspaceId, params.userId, params.role, true, params.invitedBy ?? null, new Date());
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.WorkspaceMember = WorkspaceMember;
//# sourceMappingURL=workspace.entity.js.map