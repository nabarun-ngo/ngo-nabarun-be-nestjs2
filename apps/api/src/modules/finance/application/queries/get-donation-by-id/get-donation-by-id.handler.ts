import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DonationDto } from '../../dtos/donation.dto';
import { DonationMapper } from '../../mappers/donation.mapper';
import { GetDonationByIdQuery } from './get-donation-by-id.query';

@QueryHandler(GetDonationByIdQuery)
@Injectable()
export class GetDonationByIdHandler implements IQueryHandler<GetDonationByIdQuery, DonationDto> {
  constructor(@Inject(IDonationRepository) private readonly repo: IDonationRepository) {}

  async execute(query: GetDonationByIdQuery): Promise<DonationDto> {
    const donation = await this.repo.findById(query.id);
    if (!donation) throw new BusinessException('Donation not found with id: ' + query.id);
    return DonationMapper.toDto(donation);
  }
}

