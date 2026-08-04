"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vehicle = void 0;
const openapi = require("@nestjs/swagger");
const aggregate_root_base_1 = require("../../../../shared/domain/aggregate-root.base");
const client_1 = require("@prisma/client");
const mileage_vo_1 = require("../value-objects/mileage.vo");
const vehicle_events_1 = require("../events/vehicle-events");
const vehicle_validation_service_1 = require("../services/vehicle-validation.service");
class Vehicle extends aggregate_root_base_1.AggregateRoot {
    constructor(id, props, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this._props = { ...props };
    }
    get workspaceId() { return this._props.workspaceId; }
    get type() { return this._props.type; }
    get bodyType() { return this._props.bodyType; }
    get make() { return this._props.make; }
    get model() { return this._props.model; }
    get year() { return this._props.year; }
    get trim() { return this._props.trim; }
    get fuelType() { return this._props.fuelType; }
    get transmission() { return this._props.transmission; }
    get drivetrain() { return this._props.drivetrain; }
    get engineCapacity() { return this._props.engineCapacity; }
    get engineNumber() { return this._props.engineNumber; }
    get horsepower() { return this._props.horsepower; }
    get torque() { return this._props.torque; }
    get fuelTankCapacity() { return this._props.fuelTankCapacity; }
    get groundClearance() { return this._props.groundClearance; }
    get wheelbase() { return this._props.wheelbase; }
    get doors() { return this._props.doors; }
    get seats() { return this._props.seats; }
    get condition() { return this._props.condition; }
    get mileage() { return this._props.mileage; }
    get exteriorColor() { return this._props.exteriorColor; }
    get interiorColor() { return this._props.interiorColor; }
    get vin() { return this._props.vin; }
    get registrationNumber() { return this._props.registrationNumber; }
    get features() { return [...this._props.features]; }
    get description() { return this._props.description; }
    get primaryImageId() { return this._props.primaryImageId; }
    get status() { return this._props.status; }
    get isVerified() { return this._props.isVerified; }
    get geofenceEnabled() { return this._props.geofenceEnabled; }
    get props() { return { ...this._props }; }
    update(fields) {
        const updatedFields = Object.keys(fields);
        this._props = { ...this._props, ...fields };
        this.touch();
        this.addDomainEvent(new vehicle_events_1.VehicleUpdatedEvent(this.id, updatedFields));
    }
    updateStatus(newStatus) {
        const oldStatus = this._props.status;
        vehicle_validation_service_1.VehicleValidationService.validateStatusTransition(oldStatus, newStatus);
        this._props.status = newStatus;
        this.touch();
        this.addDomainEvent(new vehicle_events_1.VehicleStatusChangedEvent(this.id, oldStatus, newStatus));
        if (newStatus === client_1.VehicleStatus.ARCHIVED) {
            this.addDomainEvent(new vehicle_events_1.VehicleArchivedEvent(this.id));
        }
    }
    updateMileage(km) {
        this._props.mileage = new mileage_vo_1.Mileage({ value: km });
        this.touch();
        this.addDomainEvent(new vehicle_events_1.VehicleUpdatedEvent(this.id, ['mileage']));
    }
    retire() {
        this.updateStatus(client_1.VehicleStatus.RETIRED);
    }
    get displayTitle() {
        return `${this._props.year.value} ${this._props.make} ${this._props.model}${this._props.trim ? ` ${this._props.trim}` : ''}`;
    }
    static create(id, props) {
        const vehicle = new Vehicle(id, {
            ...props,
            status: props.status ?? client_1.VehicleStatus.DRAFT,
            features: props.features ?? [],
        });
        vehicle.addDomainEvent(new vehicle_events_1.VehicleCreatedEvent(vehicle.id, vehicle.workspaceId));
        return vehicle;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { _props: { required: true, type: () => Object } };
    }
}
exports.Vehicle = Vehicle;
//# sourceMappingURL=vehicle.entity.js.map