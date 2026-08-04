"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleMapper = void 0;
const vehicle_entity_1 = require("../../domain/entities/vehicle.entity");
const vin_vo_1 = require("../../domain/value-objects/vin.vo");
const registration_number_vo_1 = require("../../domain/value-objects/registration-number.vo");
const engine_capacity_vo_1 = require("../../domain/value-objects/engine-capacity.vo");
const mileage_vo_1 = require("../../domain/value-objects/mileage.vo");
const vehicle_year_vo_1 = require("../../domain/value-objects/vehicle-year.vo");
const seats_vo_1 = require("../../domain/value-objects/seats.vo");
class VehicleMapper {
    static toDomain(prismaVehicle) {
        return vehicle_entity_1.Vehicle.create(prismaVehicle.id, {
            workspaceId: prismaVehicle.workspaceId,
            type: prismaVehicle.type,
            bodyType: prismaVehicle.bodyType,
            make: prismaVehicle.make,
            model: prismaVehicle.model,
            year: new vehicle_year_vo_1.VehicleYear({ value: prismaVehicle.year }),
            trim: prismaVehicle.trim,
            fuelType: prismaVehicle.fuelType,
            transmission: prismaVehicle.transmission,
            drivetrain: prismaVehicle.drivetrain,
            engineCapacity: prismaVehicle.engineCapacity ? new engine_capacity_vo_1.EngineCapacity({ value: prismaVehicle.engineCapacity }) : null,
            engineNumber: prismaVehicle.engineNumber ?? null,
            horsepower: prismaVehicle.horsepower ?? null,
            torque: prismaVehicle.torque ?? null,
            fuelTankCapacity: prismaVehicle.fuelTankCapacity ?? null,
            groundClearance: prismaVehicle.groundClearance ?? null,
            wheelbase: prismaVehicle.wheelbase ?? null,
            doors: prismaVehicle.doors,
            seats: prismaVehicle.seats ? new seats_vo_1.Seats({ value: prismaVehicle.seats }) : null,
            condition: prismaVehicle.condition,
            mileage: new mileage_vo_1.Mileage({ value: prismaVehicle.mileage }),
            exteriorColor: prismaVehicle.exteriorColor,
            interiorColor: prismaVehicle.interiorColor,
            vin: prismaVehicle.vin ? new vin_vo_1.Vin({ value: prismaVehicle.vin }) : null,
            registrationNumber: prismaVehicle.registrationNumber ? new registration_number_vo_1.RegistrationNumber({ value: prismaVehicle.registrationNumber }) : null,
            features: prismaVehicle.features ?? [],
            description: prismaVehicle.description,
            primaryImageId: prismaVehicle.primaryImageId ?? null,
            status: prismaVehicle.status,
            isVerified: prismaVehicle.isVerified,
            geofenceEnabled: prismaVehicle.geofenceEnabled,
        });
    }
    static toPersistence(vehicle) {
        const props = vehicle.props;
        return {
            id: vehicle.id,
            workspaceId: props.workspaceId,
            type: props.type,
            bodyType: props.bodyType,
            make: props.make,
            model: props.model,
            year: props.year.value,
            trim: props.trim,
            fuelType: props.fuelType,
            transmission: props.transmission,
            drivetrain: props.drivetrain,
            engineCapacity: props.engineCapacity ? props.engineCapacity.value : null,
            engineNumber: props.engineNumber,
            horsepower: props.horsepower,
            torque: props.torque,
            fuelTankCapacity: props.fuelTankCapacity,
            groundClearance: props.groundClearance,
            wheelbase: props.wheelbase,
            doors: props.doors,
            seats: props.seats ? props.seats.value : null,
            condition: props.condition,
            mileage: props.mileage.value,
            exteriorColor: props.exteriorColor,
            interiorColor: props.interiorColor,
            vin: props.vin ? props.vin.value : null,
            registrationNumber: props.registrationNumber ? props.registrationNumber.value : null,
            features: props.features,
            description: props.description,
            primaryImageId: props.primaryImageId,
            status: props.status,
            isVerified: props.isVerified,
            geofenceEnabled: props.geofenceEnabled,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt,
        };
    }
}
exports.VehicleMapper = VehicleMapper;
//# sourceMappingURL=vehicle.mapper.js.map