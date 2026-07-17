import { FinanceUserRef, financeUserFullName } from '../../domain/types/finance-user-ref';
import { FinanceUserDto } from '../dtos/finance-user.dto';

export class FinanceUserMapper {
  static toDto(ref?: Partial<FinanceUserRef>): FinanceUserDto | undefined {
    if (!ref?.id) return undefined;
    return {
      id: ref.id,
      email: ref.email,
      firstName: ref.firstName,
      lastName: ref.lastName,
      fullName: financeUserFullName(ref as FinanceUserRef),
    };
  }
}

