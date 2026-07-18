import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { WorkflowTaskHandler, WorkflowTaskHandlerContract } from '@nabarun-ngo/nestjs-shared-workflow';
import { DonationType } from '../../domain/enums/donation-type.enum';
import { CreateDonationCommand } from '../commands/create-donation/create-donation.command';
import { DonationMapper } from '../mappers/donation.mapper';

@Injectable()
@WorkflowTaskHandler('GuestDonationCreationHandler')
export class GuestDonationCreationHandler implements WorkflowTaskHandlerContract {
  constructor(private readonly commandBus: CommandBus) { }

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const input = params.input;
    const donation = await this.commandBus.execute(
      new CreateDonationCommand({
        amount: Number(input.amount),
        type: DonationType.ONETIME,
        isGuest: true,
        donorEmail: String(input.email ?? ''),
        donorName: String(input.fullName ?? input.donorName ?? 'Guest'),
        donorNumber: input.contactNumber ? String(input.contactNumber) : undefined,
      }),
    );
    return { donationId: donation.id, donation: DonationMapper.toDto(donation) };
  }
}

