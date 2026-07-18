import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { IEarningRepository } from '../../../domain/repositories/earning.repository';
import { EarningDetailDto } from '../../dtos/earning.dto';
import { EarningMapper } from '../../mappers/earning.mapper';
import { GetEarningByIdQuery } from './get-earning-by-id.query';

@QueryHandler(GetEarningByIdQuery)
@Injectable()
export class GetEarningByIdHandler implements IQueryHandler<GetEarningByIdQuery, EarningDetailDto> {
  constructor(@Inject(IEarningRepository) private readonly repo: IEarningRepository) { }

  async execute(query: GetEarningByIdQuery): Promise<EarningDetailDto> {
    const earning = await this.repo.findById(query.id);
    if (!earning) throw new BusinessException('Earning not found with id: ' + query.id);
    return EarningMapper.toDto(earning);
  }
}

