import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Result } from '../../../../shared/domain/result';
import { AppError, ForbiddenError, ConflictError } from '../../../../core/errors/app-error';
import { CreateListingDto } from '../dto/listing.dto';
import { Listing } from '../../domain/entities/listing.entity';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../../../audit/audit-log.service';
import { VehicleStatus, ListingStatus } from '@prisma/client';
import { RentalConfigVO } from '../../domain/value-objects/rental-config.vo';
import { DailyRate } from '../../domain/value-objects/daily-rate.vo';
import { Currency } from '../../domain/value-objects/currency.vo';

class ListingAccessDeniedError extends ForbiddenError {
  readonly code = 'LISTING_ACCESS_DENIED';
  constructor() { super('You do not have access to this listing'); }
}

@Injectable()
export class CreateListingUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(input: CreateListingDto & { userId: string }): Promise<Result<Listing, AppError>> {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
      });
      if (!vehicle || vehicle.workspaceId !== input.workspaceId) {
        return Result.fail(new ListingAccessDeniedError());
      }
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        return Result.fail(new ForbiddenError('Vehicle must be AVAILABLE to be listed'));
      }

      let rentalConfig: RentalConfigVO | undefined;
      if (input.type === 'FOR_HIRE' && input.rentalConfig) {
        const rc = input.rentalConfig;
        const currency = new Currency({ code: rc.currency ?? 'KES' });
        const dailyRate = new DailyRate({ amount: rc.dailyRate, currency });
        rentalConfig = new RentalConfigVO({
          dailyRate,
          depositAmount: rc.depositAmount,
          pickupCounty: rc.pickupCounty,
          pickupCity: rc.pickupCity,
          fuelPolicy: rc.fuelPolicy,
          minimumRentalDays: rc.minimumRentalDays,
        });
      }

      const id = uuidv4();
      const listing = Listing.create(id, {
        vehicleId: input.vehicleId,
        workspaceId: input.workspaceId,
        listerId: input.userId,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        currency: (input.pricingCurrency ?? 'KES') as any,
        askingPrice: input.askingPrice,
        negotiable: input.negotiable ?? true,
        status: ListingStatus.DRAFT,
        publishedAt: null,
        expiresAt: null,
        viewCount: 0,
        saveCount: 0,
        contactCount: 0,
        isFeatured: false,
        featuredUntil: null,
        conditionRating: input.conditionRating ?? null,
        conditionNotes: input.conditionNotes ?? null,
        tags: input.tags ?? [],
        county: input.county ?? null,
        country: 'KE',
        searchVector: null,
        deletedAt: null,
        rentalConfig,
      });

      await this.repository.save(listing);

      await this.auditLog.log({
        action: 'listing.created',
        actorId: input.userId,
        subjectType: 'Listing',
        subjectId: id,
        metadata: { vehicleId: input.vehicleId, type: input.type },
      });

      return Result.ok(listing);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}
