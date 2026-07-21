import { Controller, Post, Get, Delete, Patch, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../../core/security/decorators/current-user.decorator';
import { Public } from '../../../../core/security/decorators/public.decorator';
import { AccessJwtPayload } from '../../../../core/security/token.service';
import { CreateListingDto, SearchRentalListingsDto } from '../../application/dto/listing.dto';
import { CreateListingUseCase } from '../../application/use-cases/create-listing.use-case';
import { SearchListingsUseCase } from '../../application/use-cases/search-listings.use-case';
import { GetListingUseCase } from '../../application/use-cases/get-listing.use-case';
import { GetSavedListingsUseCase } from '../../application/use-cases/get-saved-listings.use-case';
import { ToggleFavouriteUseCase } from '../../application/use-cases/toggle-favourite.use-case';
import { GetMyListingsUseCase, PublishListingUseCase, PauseListingUseCase, ArchiveListingUseCase, RestoreListingUseCase, DeleteListingUseCase, UpdateListingUseCase } from '../../application/use-cases/owner-listing.use-cases';

@ApiTags('Listings')
@Controller('listings')
export class ListingController {
  constructor(
    private readonly createListingUseCase: CreateListingUseCase,
    private readonly searchListingsUseCase: SearchListingsUseCase,
    private readonly getListingUseCase: GetListingUseCase,
    private readonly getSavedListingsUseCase: GetSavedListingsUseCase,
    private readonly toggleFavouriteUseCase: ToggleFavouriteUseCase,
    private readonly getMyListingsUseCase: GetMyListingsUseCase,
    private readonly publishListingUseCase: PublishListingUseCase,
    private readonly pauseListingUseCase: PauseListingUseCase,
    private readonly archiveListingUseCase: ArchiveListingUseCase,
    private readonly restoreListingUseCase: RestoreListingUseCase,
    private readonly deleteListingUseCase: DeleteListingUseCase,
    private readonly updateListingUseCase: UpdateListingUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  async create(@Body() dto: CreateListingDto, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.createListingUseCase.execute({ ...dto, userId: user.userId });
    if (result.isFail) throw result.error;
    
    const val = result.value;
    return {
      id: val.id,
      ...val.props,
      rentalConfig: val.rentalConfig ? {
        dailyRate: val.rentalConfig.dailyRate.amount,
        currency: val.rentalConfig.dailyRate.currency.code,
        depositAmount: val.rentalConfig.depositAmount,
        pickupCounty: val.rentalConfig.pickupCounty,
        pickupCity: val.rentalConfig.pickupCity,
        fuelPolicy: val.rentalConfig.fuelPolicy,
        minimumRentalDays: val.rentalConfig.minimumRentalDays,
      } : undefined
    };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search listings' })
  async search(@Query() query: SearchRentalListingsDto) {
    const result = await this.searchListingsUseCase.execute(query);
    
    return {
      data: result.data.map(listing => {
        const { rentalConfig, ...props } = listing.props;
        return {
          id: listing.id,
          ...props,
          vehicle: (listing as any).vehicle,
          rentalConfig: listing.rentalConfig ? {
            dailyRate: listing.rentalConfig.dailyRate.amount,
            currency: listing.rentalConfig.dailyRate.currency.code,
            depositAmount: listing.rentalConfig.depositAmount,
            pickupCounty: listing.rentalConfig.pickupCounty,
            pickupCity: listing.rentalConfig.pickupCity,
            fuelPolicy: listing.rentalConfig.fuelPolicy,
            minimumRentalDays: listing.rentalConfig.minimumRentalDays,
          } : undefined
        };
      }),
      meta: result.meta,
    };
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get listings owned by the current user' })
  async getMyListings(@Query() query: any, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.getMyListingsUseCase.execute(user.userId, query);
    if (result.isFail) throw result.error;

    return {
      data: result.value.data.map(listing => {
        const { rentalConfig, ...props } = listing.props;
        return {
          id: listing.id,
          ...props,
          vehicle: (listing as any).vehicle,
          rentalConfig: listing.rentalConfig ? {
            dailyRate: listing.rentalConfig.dailyRate.amount,
            currency: listing.rentalConfig.dailyRate.currency.code,
            depositAmount: listing.rentalConfig.depositAmount,
            pickupCounty: listing.rentalConfig.pickupCounty,
            pickupCity: listing.rentalConfig.pickupCity,
            fuelPolicy: listing.rentalConfig.fuelPolicy,
            minimumRentalDays: listing.rentalConfig.minimumRentalDays,
          } : undefined
        };
      }),
      meta: result.value.meta,
    };
  }

  @Get('saved')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved listings for the current user' })
  async getSavedListings(@CurrentUser() user: AccessJwtPayload) {
    const result = await this.getSavedListingsUseCase.execute({ userId: user.userId });
    if (result.isFail) throw result.error;
    
    return result.value.map(listing => {
      const { rentalConfig, ...props } = listing.props;
      return {
        id: listing.id,
        ...props,
        vehicle: (listing as any).vehicle,
        rentalConfig: listing.rentalConfig ? {
          dailyRate: listing.rentalConfig.dailyRate.amount,
          currency: listing.rentalConfig.dailyRate.currency.code,
          depositAmount: listing.rentalConfig.depositAmount,
          pickupCounty: listing.rentalConfig.pickupCounty,
          pickupCity: listing.rentalConfig.pickupCity,
          fuelPolicy: listing.rentalConfig.fuelPolicy,
          minimumRentalDays: listing.rentalConfig.minimumRentalDays,
        } : undefined
      };
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get listing by ID' })
  async getListing(@Param('id') id: string) {
    const result = await this.getListingUseCase.execute({ id });
    if (result.isFail) throw result.error;
    
    const listing = result.value;
    const { rentalConfig, ...props } = listing.props;
    
    return {
      id: listing.id,
      ...props,
      vehicle: (listing as any).vehicle,
      rentalConfig: listing.rentalConfig ? {
        dailyRate: listing.rentalConfig.dailyRate.amount,
        currency: listing.rentalConfig.dailyRate.currency.code,
        depositAmount: listing.rentalConfig.depositAmount,
        pickupCounty: listing.rentalConfig.pickupCounty,
        pickupCity: listing.rentalConfig.pickupCity,
        fuelPolicy: listing.rentalConfig.fuelPolicy,
        minimumRentalDays: listing.rentalConfig.minimumRentalDays,
      } : undefined
    };
  }

  @Post(':id/save')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a listing' })
  async saveListing(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.toggleFavouriteUseCase.execute({ userId: user.userId, listingId: id, action: 'save' });
    if (result.isFail) throw result.error;
    return { saved: true };
  }

  @Delete(':id/save')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a saved listing' })
  async removeSavedListing(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.toggleFavouriteUseCase.execute({ userId: user.userId, listingId: id, action: 'remove' });
    if (result.isFail) throw result.error;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  async updateListing(@Param('id') id: string, @Body() updateData: any, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.updateListingUseCase.execute(user.userId, id, updateData);
    if (result.isFail) throw result.error;
    return { id: result.value.id, ...result.value.props };
  }

  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a listing' })
  async publishListing(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.publishListingUseCase.execute(user.userId, id);
    if (result.isFail) throw result.error;
    return { id: result.value.id, status: result.value.status };
  }

  @Post(':id/pause')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause a listing' })
  async pauseListing(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.pauseListingUseCase.execute(user.userId, id);
    if (result.isFail) throw result.error;
    return { id: result.value.id, status: result.value.status };
  }

  @Post(':id/archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a listing' })
  async archiveListing(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.archiveListingUseCase.execute(user.userId, id);
    if (result.isFail) throw result.error;
    return { id: result.value.id, status: result.value.status };
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a listing' })
  async restoreListing(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.restoreListingUseCase.execute(user.userId, id);
    if (result.isFail) throw result.error;
    return { id: result.value.id, status: result.value.status };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a listing (soft delete)' })
  async deleteListing(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.deleteListingUseCase.execute(user.userId, id);
    if (result.isFail) throw result.error;
  }
}
