import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { IBeneficiaryRepository } from '../../../domain/repositories/beneficiary.repository';
import { BeneficiaryMapper } from '../../mappers/beneficiary.mapper';
import { BeneficiaryDetailDto } from '../../dtos/beneficiary.dto';
import { GetBeneficiaryByIdQuery } from './get-beneficiary-by-id.query';

@QueryHandler(GetBeneficiaryByIdQuery)
@Injectable()
export class GetBeneficiaryByIdHandler implements IQueryHandler<GetBeneficiaryByIdQuery, BeneficiaryDetailDto> {
  constructor(@Inject(IBeneficiaryRepository) private readonly repo: IBeneficiaryRepository) {}
  async execute(q: GetBeneficiaryByIdQuery): Promise<BeneficiaryDetailDto> {
    const b = await this.repo.findById(q.id);
    if (!b) throw new BusinessException('Beneficiary not found');
    return BeneficiaryMapper.toDto(b);
  }
}