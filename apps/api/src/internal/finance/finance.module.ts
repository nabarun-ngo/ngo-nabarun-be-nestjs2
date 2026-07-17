import { DynamicModule, FactoryProvider, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { createRequiredPortsGuard } from '@ce/nestjs-shared-core';
import { FinanceModuleInput, FinanceModuleOptions, FinanceModuleOptionsSchema } from './finance.schema';
import { FINANCE_OPTIONS } from './infrastructure/finance-options.token';
import { IFinanceReferenceDataPort } from './application/ports/finance-reference-data.port';
import { IAccountRepository } from './domain/repositories/account.repository';
import { IDonationRepository } from './domain/repositories/donation.repository';
import { IExpenseRepository } from './domain/repositories/expense.repository';
import { IEarningRepository } from './domain/repositories/earning.repository';
import { ITransactionRepository } from './domain/repositories/transaction.repository';
import { AccountPrismaRepository } from '../../shared/persistence/finance/account.prisma-repository';
import { DonationPrismaRepository } from '../../shared/persistence/finance/donation.prisma-repository';
import { ExpensePrismaRepository } from '../../shared/persistence/finance/expense.prisma-repository';
import { EarningPrismaRepository } from '../../shared/persistence/finance/earning.prisma-repository';
import { TransactionPrismaRepository } from '../../shared/persistence/finance/transaction.prisma-repository';
import { DmsFacade } from './infrastructure/adapters/dms.facade';
import { DonationSummaryReportProvider } from './application/reports/donation-summary.provider';
import { AnnualAuditReportProvider } from './application/reports/annual-audit.provider';
import { FinanceReportReferenceDataService } from './application/reports/finance-report-reference-data.service';

import { CreateDonationHandler } from './application/commands/create-donation/create-donation.handler';
import { CreateTransactionHandler } from './application/commands/create-transaction/create-transaction.handler';
import { SettleExpenseHandler } from './application/commands/settle-expense/settle-expense.handler';
import { CreateAccountHandler } from './application/commands/create-account/create-account.handler';
import { UpdateAccountHandler } from './application/commands/update-account/update-account.handler';
import { UpdateDonationHandler } from './application/commands/update-donation/update-donation.handler';
import { ProcessDonationPaymentHandler } from './application/commands/process-donation-payment/process-donation-payment.handler';
import { CreateExpenseHandler } from './application/commands/create-expense/create-expense.handler';
import { UpdateExpenseHandler } from './application/commands/update-expense/update-expense.handler';
import { FinalizeExpenseHandler } from './application/commands/finalize-expense/finalize-expense.handler';
import { CreateEarningHandler } from './application/commands/create-earning/create-earning.handler';
import { UpdateEarningHandler } from './application/commands/update-earning/update-earning.handler';
import { ReverseTransactionHandler } from './application/commands/reverse-transaction/reverse-transaction.handler';

import { ListDonationsHandler } from './application/queries/list-donations/list-donations.handler';
import { GetDonationByIdHandler } from './application/queries/get-donation-by-id/get-donation-by-id.handler';
import { GetDonationSummaryHandler } from './application/queries/get-donation-summary/get-donation-summary.handler';
import { GetDonationReferenceDataHandler } from './application/queries/get-donation-reference-data/get-donation-reference-data.handler';
import { ListAccountsHandler } from './application/queries/list-accounts/list-accounts.handler';
import { ListAccountTransactionsHandler } from './application/queries/list-account-transactions/list-account-transactions.handler';
import { GetPayableAccountsHandler } from './application/queries/get-payable-accounts/get-payable-accounts.handler';
import { GetAccountReferenceDataHandler } from './application/queries/get-account-reference-data/get-account-reference-data.handler';
import { ListExpensesHandler } from './application/queries/list-expenses/list-expenses.handler';
import { GetExpenseByIdHandler } from './application/queries/get-expense-by-id/get-expense-by-id.handler';
import { GetExpenseReferenceDataHandler } from './application/queries/get-expense-reference-data/get-expense-reference-data.handler';
import { ListEarningsHandler } from './application/queries/list-earnings/list-earnings.handler';
import { GetEarningByIdHandler } from './application/queries/get-earning-by-id/get-earning-by-id.handler';
import { GetEarningReferenceDataHandler } from './application/queries/get-earning-reference-data/get-earning-reference-data.handler';

import { OnDonationRaisedHandler } from './application/event-handlers/on-donation-raised/on-donation-raised.handler';
import { OnDonationPaidHandler } from './application/event-handlers/on-donation-paid/on-donation-paid.handler';
import { OnUserDeletedFinanceHandler } from './application/event-handlers/on-user-deleted-finance/on-user-deleted-finance.handler';

import { CreateDonationJobHandler } from './application/jobs/create-donation.handler';
import { TriggerMonthlyDonationHandler } from './application/jobs/trigger-monthly-donation.handler';
import { MarkDonationPendingHandler } from './application/jobs/mark-donation-pending.handler';
import { RemindPendingDonationsHandler } from './application/jobs/remind-pending-donations.handler';

import { FinanceDonationScheduleAdapter } from './infrastructure/adapters/finance-donation-schedule.adapter';
import { IFinanceDonationSchedulePort } from './application/ports/finance-donation-schedule.port';

import { DonationController } from './presentation/controllers/donation.controller';
import { AccountController } from './presentation/controllers/account.controller';
import { ExpenseController } from './presentation/controllers/expense.controller';
import { EarningController } from './presentation/controllers/earning.controller';

const FinanceRequiredPortsGuard = createRequiredPortsGuard('FinanceModule', [
  {
    token: IFinanceReferenceDataPort,
    fixHint: 'Register { provide: IFinanceReferenceDataPort, useClass: FinanceReferenceDataAdapter } in IntegrationsModule.',
  },
]);

const COMMAND_HANDLERS = [
  CreateDonationHandler,
  CreateTransactionHandler,
  SettleExpenseHandler,
  CreateAccountHandler,
  UpdateAccountHandler,
  UpdateDonationHandler,
  ProcessDonationPaymentHandler,
  CreateExpenseHandler,
  UpdateExpenseHandler,
  FinalizeExpenseHandler,
  CreateEarningHandler,
  UpdateEarningHandler,
  ReverseTransactionHandler,
];

const QUERY_HANDLERS = [
  ListDonationsHandler,
  GetDonationByIdHandler,
  GetDonationSummaryHandler,
  GetDonationReferenceDataHandler,
  ListAccountsHandler,
  ListAccountTransactionsHandler,
  GetPayableAccountsHandler,
  GetAccountReferenceDataHandler,
  ListExpensesHandler,
  GetExpenseByIdHandler,
  GetExpenseReferenceDataHandler,
  ListEarningsHandler,
  GetEarningByIdHandler,
  GetEarningReferenceDataHandler,
];

const EVENT_HANDLERS = [OnDonationRaisedHandler, OnDonationPaidHandler, OnUserDeletedFinanceHandler];

const JOB_HANDLERS = [
  CreateDonationJobHandler,
  TriggerMonthlyDonationHandler,
  MarkDonationPendingHandler,
  RemindPendingDonationsHandler,
];

export interface FinanceModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: FactoryProvider['inject'];
  useFactory: (...args: any[]) => FinanceModuleInput | Promise<FinanceModuleInput>;
}

@Module({})
export class FinanceModule {
  static forRoot(options: FinanceModuleInput): DynamicModule {
    const parsed = FinanceModuleOptionsSchema.parse(options);
    return FinanceModule.buildModule([{ provide: FINANCE_OPTIONS, useValue: parsed }]);
  }

  static forRootAsync(asyncOptions: FinanceModuleAsyncOptions): DynamicModule {
    const optionsProvider: FactoryProvider = {
      provide: FINANCE_OPTIONS,
      inject: asyncOptions.inject ?? [],
      useFactory: async (...args: any[]) => FinanceModuleOptionsSchema.parse(await asyncOptions.useFactory(...args)),
    };
    return FinanceModule.buildModule([optionsProvider], asyncOptions.imports ?? []);
  }

  private static buildModule(optionProviders: Provider[], extraImports: any[] = []): DynamicModule {
    return {
      module: FinanceModule,
      imports: [CqrsModule, ...extraImports],
      controllers: [DonationController, AccountController, ExpenseController, EarningController],
      providers: [
        ...optionProviders,
        FinanceRequiredPortsGuard,
        { provide: IAccountRepository, useClass: AccountPrismaRepository },
        { provide: IDonationRepository, useClass: DonationPrismaRepository },
        { provide: IExpenseRepository, useClass: ExpensePrismaRepository },
        { provide: IEarningRepository, useClass: EarningPrismaRepository },
        { provide: ITransactionRepository, useClass: TransactionPrismaRepository },
        { provide: IFinanceDonationSchedulePort, useClass: FinanceDonationScheduleAdapter },
        DmsFacade,
        FinanceReportReferenceDataService,
        DonationSummaryReportProvider,
        AnnualAuditReportProvider,
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
        ...JOB_HANDLERS,
      ],
      exports: [IDonationRepository, IAccountRepository, IExpenseRepository, DonationSummaryReportProvider, AnnualAuditReportProvider],
    };
  }
}

