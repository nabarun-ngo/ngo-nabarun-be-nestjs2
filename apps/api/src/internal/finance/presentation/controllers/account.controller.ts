import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import type { AuthUser } from '@ce/nestjs-shared-auth';
import { CreateAccountCommand } from '../../application/commands/create-account/create-account.command';
import { UpdateAccountCommand } from '../../application/commands/update-account/update-account.command';
import { CreateTransactionCommand } from '../../application/commands/create-transaction/create-transaction.command';
import { ListAccountsQuery } from '../../application/queries/list-accounts/list-accounts.query';
import { ListAccountTransactionsQuery } from '../../application/queries/list-account-transactions/list-account-transactions.query';
import { GetPayableAccountsQuery } from '../../application/queries/get-payable-accounts/get-payable-accounts.query';
import { GetAccountReferenceDataQuery } from '../../application/queries/get-account-reference-data/get-account-reference-data.query';
import { AccountMapper } from '../../application/mappers/account.mapper';
import { TransactionRefType } from '../../domain/enums/transaction.enum';
import { AccountDetailDto, AccountDetailFilterDto, AccountRefDataDto, CreateAccountDto, TransferDto, UpdateAccountDto, UpdateAccountSelfDto } from '../dtos/account.dto';
import { AccountListResponseDto, TransactionListResponseDto } from '../../application/dtos/account-list.dto';
import { ReverseTransactionDto, TransactionDetailFilterDto } from '../dtos/transaction.dto';

@ApiTags('Account')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get('static/referenceData')
  getAccountReferenceData(): Promise<AccountRefDataDto> {
    return this.queryBus.execute(new GetAccountReferenceDataQuery());
  }

  @Get('payable-account')
  payableAccount(@Query('isTransfer') isTransfer?: boolean): Promise<AccountDetailDto[]> {
    return this.queryBus.execute(new GetPayableAccountsQuery(isTransfer === true));
  }

  @Get('list')
  @RequirePermissions('read:accounts')
  listAccounts(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: AccountDetailFilterDto,
  ): Promise<AccountListResponseDto> {
    return this.queryBus.execute(new ListAccountsQuery(filter ?? {}, pageIndex, pageSize));
  }

  @Get('list/me')
  listSelfAccounts(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: AccountDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<AccountListResponseDto> {
    return this.queryBus.execute(new ListAccountsQuery(filter ?? {}, pageIndex, pageSize, user?.userId));
  }

  @Post('create')
  @RequirePermissions('create:account')
  async createAccount(@Body() dto: CreateAccountDto): Promise<AccountDetailDto> {
    const account = await this.commandBus.execute(
      new CreateAccountCommand({
        name: dto.name,
        type: dto.type,
        currency: dto.currency,
        description: dto.description,
        accountHolderId: dto.accountHolderId,
      }),
    );
    return AccountMapper.toDto(account, { includeBankDetail: true, includeUpiDetail: true });
  }

  @Put(':id/update')
  @RequirePermissions('update:account')
  async updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto): Promise<AccountDetailDto> {
    const account = await this.commandBus.execute(
      new UpdateAccountCommand({
        id,
        name: dto.name,
        description: dto.description,
        accountStatus: dto.accountStatus,
        bankDetail: dto.bankDetail,
        upiDetail: dto.upiDetail,
      }),
    );
    return AccountMapper.toDto(account, { includeBankDetail: true, includeUpiDetail: true });
  }

  @Put(':id/update/me')
  async updateSelf(@Param('id') id: string, @Body() dto: UpdateAccountSelfDto, @CurrentUser() user: AuthUser): Promise<AccountDetailDto> {
    const account = await this.commandBus.execute(
      new UpdateAccountCommand({ id, bankDetail: dto.bankDetail, upiDetail: dto.upiDetail, actorUserId: user.userId }),
    );
    return AccountMapper.toDto(account, { includeBankDetail: true, includeUpiDetail: true });
  }

  @Get(':id/transactions')
  @RequirePermissions('read:transactions')
  listAccountTransactions(
    @Param('id') accountId: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: TransactionDetailFilterDto,
  ): Promise<TransactionListResponseDto> {
    return this.queryBus.execute(new ListAccountTransactionsQuery(accountId, filter ?? {}, pageIndex, pageSize));
  }

  @Get(':id/transactions/me')
  listSelfAccountTransactions(
    @Param('id') accountId: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: TransactionDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<TransactionListResponseDto> {
    return this.queryBus.execute(new ListAccountTransactionsQuery(accountId, filter ?? {}, pageIndex, pageSize, user?.userId));
  }

  @Post(':id/transfer')
  @RequirePermissions('update:accounts', 'update:transactions')
  transferAmount(@Param('id') accountId: string, @Body() dto: TransferDto): Promise<string> {
    return this.commandBus.execute(
      new CreateTransactionCommand({
        accountId,
        transferToAccountId: dto.toAccountId,
        txnAmount: dto.amount,
        txnDescription: dto.description,
        txnDate: dto.transferDate,
        txnType: 'TRANSFER',
        currency: 'INR',
        txnRefType: TransactionRefType.NONE,
      }),
    );
  }

  @Post(':id/transfer/me')
  transferAmountSelf(@Param('id') accountId: string, @Body() dto: TransferDto, @CurrentUser() user: AuthUser): Promise<string> {
    return this.commandBus.execute(
      new CreateTransactionCommand({
        accountId,
        transferToAccountId: dto.toAccountId,
        txnAmount: dto.amount,
        txnDescription: dto.description,
        txnDate: dto.transferDate,
        txnType: 'TRANSFER',
        currency: 'INR',
        txnRefType: TransactionRefType.NONE,
        actorUserId: user.userId,
      }),
    );
  }
}

