import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Donation } from '../../../domain/aggregates/donation/donation.aggregate';
import { DonationStatus } from '../../../domain/enums/donation-status.enum';
import { TransactionRefType, TransactionType } from '../../../domain/enums/transaction.enum';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DmsFacade } from '../../../infrastructure/adapters/dms.facade';
import { CreateTransactionCommand } from '../create-transaction/create-transaction.command';
import { ReverseTransactionCommand } from '../reverse-transaction/reverse-transaction.command';
import { UpdateDonationCommand } from './update-donation.command';

@CommandHandler(UpdateDonationCommand)
@Injectable()
export class UpdateDonationHandler implements ICommandHandler<UpdateDonationCommand, Donation> {
  constructor(
    @Inject(IDonationRepository) private readonly donationRepository: IDonationRepository,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly dmsFacade: DmsFacade,
  ) { }

  async execute({ params: request }: UpdateDonationCommand): Promise<Donation> {
    const donation = await this.donationRepository.findById(request.id);
    if (!donation) throw new BusinessException('Donation not found with id: ' + request.id);

    donation.update({ amount: request.amount, remarks: request.remarks, forEventId: request.forEvent });

    if (request.status) {
      switch (request.status) {
        case DonationStatus.CANCELLED:
          donation.cancel(request.remarks);
          break;
        case DonationStatus.PAYMENT_FAILED:
          donation.markAsFailed(request.remarks);
          break;
        case DonationStatus.PAY_LATER:
          donation.markAsPayLater(request.remarks!);
          break;
        case DonationStatus.UPDATE_MISTAKE:
          donation.markForUpdateMistake();
          if (donation.transactionRef) {
            await this.commandBus.execute(
              new ReverseTransactionCommand({ transactionRef: donation.transactionRef, reason: request.remarks || 'Update mistake' }),
            );
          }
          donation.resetPaymentDetails();
          for (const doc of await this.dmsFacade.getDocuments('donation', donation.id)) {
            await this.dmsFacade.deleteFile(doc.id);
          }
          break;
        case DonationStatus.PENDING:
          donation.markAsPending();
          break;
        case DonationStatus.PAID:
          donation.markAsPaid({
            paidToAccountId: request.paidToAccountId!,
            paymentMethod: request.paymentMethod!,
            paidUsingUPI: request.paidUsingUPI!,
            confirmedById: request.confirmedById!,
            paidDate: request.paidOn!,
          });
          const txnRef = await this.commandBus.execute(
            new CreateTransactionCommand({
              accountId: donation.paidToAccount?.id!,
              txnAmount: donation.amount,
              currency: 'INR',
              txnDescription: `Donation amount for ${donation.id}`,
              txnType: TransactionType.IN,
              txnDate: donation.paidOn,
              txnRefId: donation.id,
              txnRefType: TransactionRefType.DONATION,
            }),
          );
          donation.linkTransaction(txnRef);
          break;
      }
    }

    if (request.isPaymentNotified) donation.markPaymentNotified();

    const updated = await this.donationRepository.update(request.id, donation);
    const events = [...donation.domainEvents];
    donation.clearEvents();
    this.eventBus.publishAll(events);
    return updated;
  }
}

