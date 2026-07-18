import { TransactionRefType, TransactionStatus, TransactionType } from '../../domain/enums/transaction.enum';
import { AccountDetailDto } from './account.dto';

export class TransactionDetailDto {
  txnId!: string;
  txnNumber?: string;
  txnDate!: Date;
  txnAmount!: number;
  txnType!: TransactionType;
  txnStatus!: TransactionStatus;
  txnDescription!: string;
  txnParticulars?: string;
  txnRefId?: string;
  txnRefType?: TransactionRefType;
  accBalance?: number;
  accTxnType?: string;
  transferFrom?: string;
  transferTo?: string;
  transactionRef!: string;
  account?: AccountDetailDto;
}
