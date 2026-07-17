import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import type { AuthUser } from '@ce/nestjs-shared-auth';
import { CreateExpenseCommand } from '../../application/commands/create-expense/create-expense.command';
import { UpdateExpenseCommand } from '../../application/commands/update-expense/update-expense.command';
import { FinalizeExpenseCommand } from '../../application/commands/finalize-expense/finalize-expense.command';
import { SettleExpenseCommand } from '../../application/commands/settle-expense/settle-expense.command';
import { ListExpensesQuery } from '../../application/queries/list-expenses/list-expenses.query';
import { GetExpenseByIdQuery } from '../../application/queries/get-expense-by-id/get-expense-by-id.query';
import { GetExpenseReferenceDataQuery } from '../../application/queries/get-expense-reference-data/get-expense-reference-data.query';
import { ExpenseMapper } from '../../application/mappers/expense.mapper';
import { CreateExpenseDto, ExpenseDetailDto, ExpenseDetailFilterDto, ExpenseRefDataDto, UpdateExpenseDto } from '../dtos/expense.dto';
import { ExpenseListResponseDto } from '../../application/dtos/expense-list.dto';

@ApiTags('Expense')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('expense')
export class ExpenseController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get('static/referenceData')
  getExpenseReferenceData(): Promise<ExpenseRefDataDto> {
    return this.queryBus.execute(new GetExpenseReferenceDataQuery());
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('create:expense')
  async createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser): Promise<ExpenseDetailDto> {
    const expense = await this.commandBus.execute(
      new CreateExpenseCommand({
        name: dto.name,
        description: dto.description,
        currency: dto.currency,
        expenseDate: dto.expenseDate,
        expenseRefId: dto.expenseRefId,
        expenseRefType: dto.expenseRefType,
        expenseItems: dto.expenseItems,
        requestedById: user.userId!,
        paidById: dto.payerId,
      }),
    );
    return ExpenseMapper.toDto(expense);
  }

  @Put(':id/update')
  @RequirePermissions('update:expense')
  async updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto, @CurrentUser() user: AuthUser): Promise<ExpenseDetailDto> {
    const expense = await this.commandBus.execute(
      new UpdateExpenseCommand({
        id,
        updatedById: user.userId!,
        name: dto.name,
        description: dto.description,
        expenseDate: dto.expenseDate,
        expenseRefId: dto.expenseRefId,
        expenseRefType: dto.expenseRefType,
        expenseItems: dto.expenseItems,
        payerId: dto.payerId,
        remarks: dto.remarks,
        status: dto.status,
      }),
    );
    return ExpenseMapper.toDto(expense);
  }

  @Post(':id/finalize')
  @RequirePermissions('create:expense_final')
  async finalizeExpense(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<ExpenseDetailDto> {
    const expense = await this.commandBus.execute(new FinalizeExpenseCommand({ id, finalizedById: user.userId! }));
    return ExpenseMapper.toDto(expense);
  }

  @Post(':id/settle')
  @RequirePermissions('create:expense_settle')
  async settleExpense(@Param('id') id: string, @Query('accountId') accountId: string, @CurrentUser() user: AuthUser): Promise<ExpenseDetailDto> {
    const expense = await this.commandBus.execute(new SettleExpenseCommand({ id, accountId, settledById: user.userId! }));
    return ExpenseMapper.toDto(expense);
  }

  @Get('list')
  @RequirePermissions('read:expenses')
  listExpenses(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ExpenseDetailFilterDto,
  ): Promise<ExpenseListResponseDto> {
    return this.queryBus.execute(new ListExpensesQuery(filter ?? {}, pageIndex, pageSize));
  }

  @Get('list/me')
  listSelfExpenses(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ExpenseDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<ExpenseListResponseDto> {
    return this.queryBus.execute(new ListExpensesQuery({ ...filter, payerId: user?.userId }, pageIndex, pageSize));
  }

  @Get(':id')
  @RequirePermissions('read:expenses')
  getExpenseById(@Param('id') id: string): Promise<ExpenseDetailDto> {
    return this.queryBus.execute(new GetExpenseByIdQuery(id));
  }
}

