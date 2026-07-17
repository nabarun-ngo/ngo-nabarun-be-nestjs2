import { EventBus } from '@nestjs/cqrs';
import { CreateDonationHandler } from './create-donation.handler';
import { CreateDonationCommand } from './create-donation.command';
import { DonationType } from '../../../domain/enums/donation-type.enum';
import { Donation } from '../../../domain/aggregates/donation/donation.aggregate';

describe('CreateDonationHandler', () => {
  it('creates and persists a one-time guest donation', async () => {
    const created = Donation.create({
      type: DonationType.ONETIME,
      amount: 500,
      donorName: 'Guest User',
      isGuest: true,
    });

    const donationRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(created),
    };
    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;

    const handler = new CreateDonationHandler(donationRepository as any, eventBus);
    const result = await handler.execute(
      new CreateDonationCommand({
        type: DonationType.ONETIME,
        amount: 500,
        donorName: 'Guest User',
        isGuest: true,
      }),
    );

    expect(donationRepository.create).toHaveBeenCalled();
    expect(result.amount).toBe(500);
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('rejects duplicate regular donation for same donor and period', async () => {
    const donationRepository = {
      findAll: jest.fn().mockResolvedValue([{ id: 'existing' }]),
      create: jest.fn(),
    };
    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;
    const handler = new CreateDonationHandler(donationRepository as any, eventBus);

    await expect(
      handler.execute(
        new CreateDonationCommand({
          type: DonationType.REGULAR,
          amount: 500,
          donorId: 'user-1',
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-31'),
          isGuest: false,
        }),
      ),
    ).rejects.toThrow('Donation already exists for this donor in the given period');

    expect(donationRepository.create).not.toHaveBeenCalled();
  });
});
