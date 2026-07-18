import { Earning } from '../../domain/aggregates/earning/earning.aggregate';
import { EarningDetailDto } from '../dtos/earning.dto';

export class EarningMapper {
  static toDto(earning: Earning): EarningDetailDto {
    return {
      id: earning.id,
      category: earning.category,
      amount: earning.amount,
      currency: earning.currency,
      status: earning.status,
      description: earning.description,
      source: earning.source,
      referenceId: earning.referenceId,
      referenceType: earning.referenceType,
      accountId: earning.accountId,
      transactionId: earning.transactionId,
      earningDate: earning.earningDate,
      createdAt: earning.createdAt,
      updatedAt: earning.updatedAt,
    };
  }
}

