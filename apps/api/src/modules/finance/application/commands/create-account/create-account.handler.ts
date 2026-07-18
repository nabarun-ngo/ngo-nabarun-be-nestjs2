import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AuthFacade } from '@nabarun-ngo/nestjs-shared-auth';
import { BusinessException, IUserLookupPort } from '@nabarun-ngo/nestjs-shared-core';
import { Account } from '../../../domain/aggregates/account/account.aggregate';
import { AccountStatus } from '../../../domain/enums/account-status.enum';
import { AccountType } from '../../../domain/enums/account-type.enum';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { CreateAccountCommand } from './create-account.command';

@CommandHandler(CreateAccountCommand)
@Injectable()
export class CreateAccountHandler implements ICommandHandler<CreateAccountCommand, Account> {
  constructor(
    @Inject(IAccountRepository) private readonly accountRepository: IAccountRepository,
    @Inject(IUserLookupPort) private readonly userLookup: IUserLookupPort,
    private readonly authFacade: AuthFacade,
    private readonly eventBus: EventBus,
  ) { }

  async execute({ params: request }: CreateAccountCommand): Promise<Account> {
    const user = await this.userLookup.findById(request.accountHolderId);
    if (!user) throw new BusinessException('User not found with id ' + request.accountHolderId);

    const accountHolderName =
      user.fullName ??
      ([user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email);

    let accountHolder: string | undefined;
    if (request.type !== AccountType.PRINCIPAL) accountHolder = request.accountHolderId;

    const existing = await this.accountRepository.findAll({
      status: [AccountStatus.ACTIVE],
      type: [request.type],
      accountHolderId: accountHolder,
    });
    if (existing.length > 0) {
      throw new BusinessException(
        'An active account of this type already exists' + (accountHolder ? ' for this account holder' : ''),
      );
    }

    if (user.idpSub) {
      const roles = await this.authFacade.getUserRoles(user.idpSub);
      const roleKeys = roles.map((r) => r.roleKey).filter((k): k is string => !!k);
      if (request.type === AccountType.PRINCIPAL && !roleKeys.includes('TREASURER')) {
        throw new BusinessException('Account Holder is not authorized to have this type of account');
      }
      if (request.type === AccountType.DONATION && !roleKeys.some((k) => ['CASHIER', 'ASSISTANT_CASHIER'].includes(k))) {
        throw new BusinessException('Account Holder is not authorized to have this type of account');
      }
    }

    const account = Account.create({
      name: request.name,
      type: request.type,
      currency: request.currency,
      description: request.description,
      accountHolderId: request.accountHolderId,
      accountHolderName,
    });

    const saved = await this.accountRepository.create(account);
    const events = [...saved.domainEvents];
    saved.clearEvents();
    this.eventBus.publishAll(events);
    return saved;
  }
}

