import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import type { AuthUser } from '@ce/nestjs-shared-auth';
import { CreateDonationCommand } from '../../application/commands/create-donation/create-donation.command';
import { UpdateDonationCommand } from '../../application/commands/update-donation/update-donation.command';
import { ProcessDonationPaymentCommand } from '../../application/commands/process-donation-payment/process-donation-payment.command';
import { ListDonationsQuery } from '../../application/queries/list-donations/list-donations.query';
import { GetDonationSummaryQuery } from '../../application/queries/get-donation-summary/get-donation-summary.query';
import { GetDonationReferenceDataQuery } from '../../application/queries/get-donation-reference-data/get-donation-reference-data.query';
import { DonationMapper } from '../../application/mappers/donation.mapper';
import { DonationType } from '../../domain/enums/donation-type.enum';
import { CreateDonationDto, CreateGuestDonationDto, DonationDetailFilterDto, DonationDto, DonationRefDataDto, DonationSummaryDto, ProcessDonationPaymentDto, UpdateDonationDto } from '../dtos/donation.dto';
import { DonationListResponseDto } from '../../application/dtos/donation-list.dto';

@ApiTags('Donation')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('donation')
export class DonationController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:donation')
  async createDonation(@Body() dto: CreateDonationDto): Promise<DonationDto> {
    const donation = await this.commandBus.execute(
      new CreateDonationCommand({
        type: dto.type,
        amount: dto.amount,
        isGuest: false,
        endDate: dto.endDate,
        startDate: dto.startDate,
        donorId: dto.donorId,
        forEventId: dto.type === DonationType.ONETIME ? dto.forEventId : undefined,
      }),
    );
    return DonationMapper.toDto(donation);
  }

  @Post('create/guest')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:donation_guest')
  async createGuestDonation(@Body() dto: CreateGuestDonationDto): Promise<DonationDto> {
    const donation = await this.commandBus.execute(
      new CreateDonationCommand({
        type: DonationType.ONETIME,
        amount: dto.amount,
        isGuest: true,
        donorName: dto.donorName,
        donorEmail: dto.donorEmail,
        donorNumber: dto.donorNumber,
        forEventId: dto.forEventId,
      }),
    );
    return DonationMapper.toDto(donation);
  }

  @Patch(':id/update')
  @RequirePermissions('update:donation')
  async update(@Param('id') id: string, @Body() dto: UpdateDonationDto, @CurrentUser() user: AuthUser): Promise<DonationDto> {
    const donation = await this.commandBus.execute(
      new UpdateDonationCommand({
        id,
        status: dto.status,
        remarks: dto.remarks,
        amount: dto.amount,
        forEvent: dto.forEvent,
        paidToAccountId: dto.paidToAccountId,
        confirmedById: user.userId,
        paidUsingUPI: dto.paidUsingUPI,
        paymentMethod: dto.paymentMethod,
        paidOn: dto.paidOn,
        isPaymentNotified: dto.isPaymentNotified,
      }),
    );
    return DonationMapper.toDto(donation);
  }

  @Post(':id/notify')
  async notify(@Param('id') id: string, @Body() dto: ProcessDonationPaymentDto): Promise<DonationDto> {
    const donation = await this.commandBus.execute(
      new ProcessDonationPaymentCommand({ donationId: id, isPaymentNotified: dto.isPaymentNotified }),
    );
    return DonationMapper.toDto(donation);
  }

  @Get('static/referenceData')
  getReferenceData(): Promise<DonationRefDataDto> {
    return this.queryBus.execute(new GetDonationReferenceDataQuery());
  }

  @Get('list/me')
  getSelfDonations(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: DonationDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<DonationListResponseDto> {
    return this.queryBus.execute(new ListDonationsQuery({ ...filter, donorId: user?.userId }, pageIndex, pageSize));
  }

  @Get('list')
  @RequirePermissions('read:donations')
  list(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: DonationDetailFilterDto,
  ): Promise<DonationListResponseDto> {
    return this.queryBus.execute(new ListDonationsQuery(filter ?? {}, pageIndex, pageSize));
  }

  @Get('list/guest')
  @RequirePermissions('read:donation_guest')
  listGuest(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: DonationDetailFilterDto,
  ): Promise<DonationListResponseDto> {
    return this.queryBus.execute(new ListDonationsQuery({ ...filter, isGuest: 'Y' }, pageIndex, pageSize));
  }

  @Get(':donorId/summary')
  getDonationSummary(@Param('donorId') donorId: string): Promise<DonationSummaryDto> {
    return this.queryBus.execute(new GetDonationSummaryQuery(donorId));
  }

  @Get(':memberId/list')
  @RequirePermissions('read:user_donations')
  getMemberDonations(
    @Param('memberId') memberId: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: DonationDetailFilterDto,
  ): Promise<DonationListResponseDto> {
    return this.queryBus.execute(new ListDonationsQuery({ ...filter, donorId: memberId }, pageIndex, pageSize));
  }
}

