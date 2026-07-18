import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Account } from '../../../domain/aggregates/account/account.aggregate';
import { BankDetail } from '../../../domain/value-objects/bank-detail.vo';
import { UPIDetail } from '../../../domain/value-objects/upi-detail.vo';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { UpdateAccountCommand } from './update-account.command';

@CommandHandler(UpdateAccountCommand)
@Injectable()
export class UpdateAccountHandler implements ICommandHandler<UpdateAccountCommand, Account> {
  constructor(@Inject(IAccountRepository) private readonly accountRepository: IAccountRepository) { }

  async execute({ params: request }: UpdateAccountCommand): Promise<Account> {
    const account = await this.accountRepository.findById(request.id);
    if (!account) throw new BusinessException('Account not found with id: ' + request.id);

    if (request.actorUserId && account.accountHolderId !== request.actorUserId) {
      throw new BusinessException('Account does not belongs to user.');
    }

    let bankDetail: BankDetail | undefined;
    if (request.bankDetail) {
      bankDetail = new BankDetail(
        request.bankDetail.bankAccountHolderName,
        request.bankDetail.bankName,
        request.bankDetail.bankBranch,
        request.bankDetail.bankAccountNumber,
        request.bankDetail.bankAccountType,
        request.bankDetail.IFSCNumber,
      );
    }

    let upiDetail: UPIDetail | undefined;
    if (request.upiDetail) {
      upiDetail = new UPIDetail(
        request.upiDetail.payeeName,
        request.upiDetail.upiId,
        request.upiDetail.mobileNumber,
        request.upiDetail.qrData,
      );
    }

    account.update({
      name: request.name,
      description: request.description,
      bankDetail,
      upiDetail,
      accountHolderName: request.name,
    });

    if (request.accountStatus === 'ACTIVE') account.activate();
    else if (request.accountStatus === 'CLOSED') account.close();

    return this.accountRepository.update(request.id, account);
  }
}

