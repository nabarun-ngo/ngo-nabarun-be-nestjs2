import { ExpenseStatus, ExpenseRefType } from '../../enums/expense.enum';
import { ExpenseItem } from '../../value-objects/expense-item.vo';
import { AggregateRoot, BusinessException, generateUniqueNDigitNumber } from '@nabarun-ngo/nestjs-shared-core';
import { ExpenseRecordedEvent } from '../../events/expense-recorded.event';
import { FinanceUserRef } from '../../types/finance-user-ref';

/**
 * Expense Domain Model (Aggregate Root)
 * Represents an expense in the system
 * All business logic and validations are in this domain model
 */
export class Expense extends AggregateRoot<string> {
  // Private fields for encapsulation
  #name: string;
  #amount: number;
  #currency: string;
  #status: ExpenseStatus;
  #description: string;
  #referenceId: string | undefined;
  #referenceType: ExpenseRefType | undefined;
  #activityName: string | undefined;
  #requestedBy: Partial<FinanceUserRef>;
  #paidBy: Partial<FinanceUserRef>;
  #expenseDate: Date;
  #submittedBy: Partial<FinanceUserRef> | undefined;
  #submittedDate: Date | undefined;
  #finalizedBy: Partial<FinanceUserRef> | undefined;
  #finalizedDate: Date | undefined;
  #settledBy: Partial<FinanceUserRef> | undefined;
  #settledDate: Date | undefined;
  #rejectedBy: Partial<FinanceUserRef> | undefined;
  #rejectedDate: Date | undefined;
  #accountId: string | undefined;
  #transactionId: string | undefined;
  #expenseItems: ExpenseItem[];
  #txnNumber: string | undefined;
  #remarks: string | undefined;
  #isDelegated: boolean;

  constructor(
    id: string,
    name: string,
    amount: number,
    currency: string,
    status: ExpenseStatus,
    description: string,
    referenceId: string | undefined,
    referenceType: ExpenseRefType | undefined,
    activityName: string | undefined,
    requestedBy: Partial<FinanceUserRef>,
    submittedBy: Partial<FinanceUserRef> | undefined,
    finalizedBy: Partial<FinanceUserRef> | undefined,
    settledBy: Partial<FinanceUserRef> | undefined,
    rejectedBy: Partial<FinanceUserRef> | undefined,
    paidBy: Partial<FinanceUserRef>,
    accountId: string | undefined,
    transactionId: string | undefined,
    expenseDate: Date,
    submittedDate: Date | undefined,
    finalizedDate: Date | undefined,
    settledDate: Date | undefined,
    rejectedDate: Date | undefined,
    expenseItems: ExpenseItem[],
    txnNumber: string | undefined,
    remarks: string | undefined,
    isDelegated: boolean = false,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#name = name;
    this.#amount = amount;
    this.#currency = currency;
    this.#status = status;
    this.#description = description;
    this.#referenceId = referenceId;
    this.#referenceType = referenceType;
    this.#activityName = activityName;
    this.#requestedBy = requestedBy;
    this.#submittedBy = submittedBy;
    this.#finalizedBy = finalizedBy;
    this.#settledBy = settledBy;
    this.#rejectedBy = rejectedBy;
    this.#paidBy = paidBy;
    this.#accountId = accountId;
    this.#transactionId = transactionId;
    this.#expenseDate = expenseDate;
    this.#submittedDate = submittedDate;
    this.#finalizedDate = finalizedDate;
    this.#settledDate = settledDate;
    this.#rejectedDate = rejectedDate;
    this.#expenseItems = expenseItems;
    this.#txnNumber = txnNumber;
    this.#remarks = remarks;
    this.#isDelegated = isDelegated;
  }

  /**
   * Factory method to create a new Expense
   * Business validation: amount must be positive, name and description required
   */
  static create(props: {
    name: string;
    description: string;
    expenseItems: ExpenseItem[];
    requestedBy: Partial<FinanceUserRef>;
    paidBy: Partial<FinanceUserRef>;
    referenceId?: string;
    referenceType: ExpenseRefType;
    currency?: string;
    expenseDate?: Date;
  }): Expense {
    if (!props.name || props.name.trim().length === 0) {
      throw new BusinessException('Expense name is required');
    }
    // if (!props.description || props.description.trim().length === 0) {
    //   throw new BusinessException('Expense description is required');
    // }
    const amount = props.expenseItems.reduce((sum, item) => sum + item.amount, 0);
    if (amount <= 0) {
      throw new BusinessException('Expense amount must be greater than zero');
    }
    if (!props.requestedBy) {
      throw new BusinessException('Requested by user ID is required');
    }

    // Calculate final amount from items if provided, otherwise use amount
    const expenseItems = props.expenseItems || [];


    const expense = new Expense(
      `NEX${generateUniqueNDigitNumber(6)}`,
      props.name,
      amount,
      props.currency || 'INR',
      ExpenseStatus.DRAFT,
      props.description,
      props.referenceId,
      props.referenceType,
      undefined,
      props.requestedBy,
      undefined, // approvedBy
      undefined, // finalizedBy
      undefined, // settledBy
      undefined, // rejectedBy
      props.paidBy,//paidBy
      undefined, // accountId
      undefined, // transactionId
      props.expenseDate || new Date(),
      undefined, // approvedDate
      undefined, // finalizedDate
      undefined, // settledDate
      undefined, // rejectedDate
      expenseItems,
      undefined, // txnNumber
      undefined, // remarks
      props.requestedBy.id !== props.paidBy.id, // isDelegated
      new Date(),
      new Date(),
    );

    expense.addDomainEvent(new ExpenseRecordedEvent(
      expense.id,
      expense.amount,
      expense.requestedBy.id,
    ));

    return expense;
  }

  /**
   * Submit expense for approval
   * Business validation: Can only submit draft expenses
   */
  submit(submittedBy: Partial<FinanceUserRef>): void {
    if (this.#status !== ExpenseStatus.DRAFT) {
      throw new BusinessException('Can only submit draft expenses');
    }
    if (this.#amount <= 0) {
      throw new BusinessException('Expense amount must be greater than zero');
    }
    this.#status = ExpenseStatus.SUBMITTED;
    this.#submittedBy = submittedBy;
    this.#submittedDate = new Date();
    this.touch();
  }

  /**
   * Finalize expense (approve)
   * Business validation: Can only finalize submitted expenses
   */
  finalize(finalizedBy: Partial<FinanceUserRef>): void {
    if (this.#status !== ExpenseStatus.SUBMITTED) {
      throw new BusinessException('Can only finalize submitted expenses');
    }
    this.#status = ExpenseStatus.FINALIZED;
    this.#finalizedBy = finalizedBy;
    this.#finalizedDate = new Date();
    this.touch();
  }

  /**
   * Reject expense
   * Business validation: Can only reject submitted expenses
   */
  reject(rejectedBy: Partial<FinanceUserRef>, remarks?: string): void {
    if (this.#status !== ExpenseStatus.SUBMITTED && this.#status !== ExpenseStatus.FINALIZED) {
      throw new BusinessException('Can only reject submitted or finalized expenses');
    }
    this.#status = ExpenseStatus.REJECTED;
    this.#rejectedBy = rejectedBy;
    this.#rejectedDate = new Date();
    if (remarks) {
      this.#remarks = remarks;
    }
    this.touch();
  }

  /**
   * Settle expense (mark as paid)
   * Business validation: Can only settle finalized expenses
   */
  settle(props: {
    settledBy: Partial<FinanceUserRef>;
    accountId: string;
    transactionId: string;
  }): void {
    if (this.#status !== ExpenseStatus.FINALIZED) {
      throw new BusinessException('Can only settle finalized expenses');
    }

    this.#status = ExpenseStatus.SETTLED;
    this.#settledBy = props.settledBy;
    this.#settledDate = new Date();
    this.#accountId = props.accountId;
    this.#transactionId = props.transactionId;
    this.touch();
  }

  /**
   * Update expense details
   * Business validation: Can only update draft expenses
   */
  update(props: {
    name?: string;
    description?: string;
    expenseDate?: Date;
    expenseItems?: ExpenseItem[];
    remarks?: string;
    payerId?: string;
    expenseRefType?: ExpenseRefType;
    expenseRefId?: string;
  }): void {
    const allowedStatus = [ExpenseStatus.DRAFT, ExpenseStatus.SUBMITTED];
    if (!allowedStatus.includes(this.#status)) {
      throw new BusinessException('Can only update draft or submitted expenses');
    }

    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        throw new BusinessException('Expense name cannot be empty');
      }
      this.#name = props.name;
    }
    if (props.description !== undefined) {
      this.#description = props.description;
    }
    if (props.expenseDate !== undefined) {
      this.#expenseDate = props.expenseDate;
    }
    if (props.expenseItems !== undefined) {
      this.#expenseItems = props.expenseItems;
      // Recalculate final amount
      this.#amount = props.expenseItems.length > 0
        ? props.expenseItems.reduce((sum, item) => sum + item.amount, 0)
        : this.#amount;
      if (this.#amount <= 0) {
        throw new BusinessException('Expense amount must be greater than zero');
      }
    }
    if (props.remarks !== undefined) {
      this.#remarks = props.remarks;
    }
    if (props.payerId !== undefined) {
      this.#paidBy = { id: props.payerId };
    }
    this.#referenceType = props.expenseRefType ?? this.#referenceType;
    this.#referenceId = props.expenseRefId ?? this.#referenceId;
    this.touch();
  }

  // Getters
  get name(): string { return this.#name; }
  get amount(): number { return this.#amount; }
  get currency(): string { return this.#currency; }
  get status(): ExpenseStatus { return this.#status; }
  get description(): string { return this.#description; }
  get referenceId(): string | undefined { return this.#referenceId; }
  get referenceType(): ExpenseRefType | undefined { return this.#referenceType; }
  get activityId(): string | undefined { return this.#referenceId; }

  get activityName(): string | undefined { return this.#activityName; }
  get requestedBy(): Partial<FinanceUserRef> { return this.#requestedBy; }
  get paidBy(): Partial<FinanceUserRef> { return this.#paidBy; }
  get submittedBy(): Partial<FinanceUserRef> | undefined { return this.#submittedBy; }
  get finalizedBy(): Partial<FinanceUserRef> | undefined { return this.#finalizedBy; }
  get settledBy(): Partial<FinanceUserRef> | undefined { return this.#settledBy; }
  get rejectedBy(): Partial<FinanceUserRef> | undefined { return this.#rejectedBy; }
  get accountId(): string | undefined { return this.#accountId; }
  get transactionId(): string | undefined { return this.#transactionId; }
  get expenseDate(): Date { return this.#expenseDate; }
  get submittedDate(): Date | undefined { return this.#submittedDate; }
  get finalizedDate(): Date | undefined { return this.#finalizedDate; }
  get settledDate(): Date | undefined { return this.#settledDate; }
  get rejectedDate(): Date | undefined { return this.#rejectedDate; }
  get expenseItems(): ExpenseItem[] { return [...this.#expenseItems]; }
  get remarks(): string | undefined { return this.#remarks; }
  get isDelegated(): boolean { return this.#isDelegated; }

  /**
   * Check if expense needs approval
   */
  needsApproval(): boolean {
    return this.#status === ExpenseStatus.SUBMITTED;
  }

  /**
   * Check if expense is payable
   */
  isPayable(): boolean {
    return this.#status === ExpenseStatus.FINALIZED;
  }

  /**
   * Check if expense can be updated
   */
  linkToReference(referenceId: string, referenceType: ExpenseRefType, activityName?: string): void {
    this.#referenceId = referenceId;
    this.#referenceType = referenceType;
    if (activityName !== undefined) this.#activityName = activityName;
    this.touch();
  }

  canBeUpdated(): boolean {
    return this.#status === ExpenseStatus.DRAFT;
  }
}
