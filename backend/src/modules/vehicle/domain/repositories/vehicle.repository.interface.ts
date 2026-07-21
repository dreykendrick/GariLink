import { Vehicle } from '../entities/vehicle.entity';

export interface IVehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByVin(vin: string): Promise<Vehicle | null>;
  findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null>;
  findByWorkspaceId(workspaceId: string, limit: number, offset: number): Promise<{ data: Vehicle[]; total: number }>;
  save(vehicle: Vehicle): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(limit: number, offset: number): Promise<{ data: Vehicle[]; total: number }>;
}
