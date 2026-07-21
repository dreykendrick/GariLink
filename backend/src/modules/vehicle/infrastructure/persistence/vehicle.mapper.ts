import { Vehicle as PrismaVehicle } from '@prisma/client';
import { Vehicle, VehicleProps } from '../../domain/entities/vehicle.entity';
import { Vin } from '../../domain/value-objects/vin.vo';
import { RegistrationNumber } from '../../domain/value-objects/registration-number.vo';
import { EngineCapacity } from '../../domain/value-objects/engine-capacity.vo';
import { Mileage } from '../../domain/value-objects/mileage.vo';
import { VehicleYear } from '../../domain/value-objects/vehicle-year.vo';
import { Seats } from '../../domain/value-objects/seats.vo';

export class VehicleMapper {
  static toDomain(prismaVehicle: PrismaVehicle): Vehicle {
    return Vehicle.create(prismaVehicle.id, {
      workspaceId: prismaVehicle.workspaceId,
      type: prismaVehicle.type as any, // assuming type is in PrismaVehicle
      bodyType: prismaVehicle.bodyType as any,
      make: prismaVehicle.make,
      model: prismaVehicle.model,
      year: new VehicleYear({ value: prismaVehicle.year }),
      trim: prismaVehicle.trim,
      fuelType: prismaVehicle.fuelType as any,
      transmission: prismaVehicle.transmission as any,
      drivetrain: prismaVehicle.drivetrain as any,
      engineCapacity: prismaVehicle.engineCapacity ? new EngineCapacity({ value: prismaVehicle.engineCapacity }) : null,
      engineNumber: (prismaVehicle as any).engineNumber ?? null,
      horsepower: (prismaVehicle as any).horsepower ?? null,
      torque: (prismaVehicle as any).torque ?? null,
      fuelTankCapacity: (prismaVehicle as any).fuelTankCapacity ?? null,
      groundClearance: (prismaVehicle as any).groundClearance ?? null,
      wheelbase: (prismaVehicle as any).wheelbase ?? null,
      doors: prismaVehicle.doors,
      seats: prismaVehicle.seats ? new Seats({ value: prismaVehicle.seats }) : null,
      condition: prismaVehicle.condition as any,
      mileage: new Mileage({ value: prismaVehicle.mileage }),
      exteriorColor: prismaVehicle.exteriorColor,
      interiorColor: prismaVehicle.interiorColor,
      vin: prismaVehicle.vin ? new Vin({ value: prismaVehicle.vin }) : null,
      registrationNumber: prismaVehicle.registrationNumber ? new RegistrationNumber({ value: prismaVehicle.registrationNumber }) : null,
      features: (prismaVehicle.features as string[]) ?? [],
      description: prismaVehicle.description,
      primaryImageId: (prismaVehicle as any).primaryImageId ?? null,
      status: prismaVehicle.status as any,
      isVerified: prismaVehicle.isVerified,
      geofenceEnabled: prismaVehicle.geofenceEnabled,
    });
  }

  static toPersistence(vehicle: Vehicle): PrismaVehicle {
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
    } as any;
  }
}
