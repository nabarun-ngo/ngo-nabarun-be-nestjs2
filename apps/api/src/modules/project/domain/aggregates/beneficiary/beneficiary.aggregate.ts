import { randomUUID } from 'crypto';
import { AggregateRoot, BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { BeneficiaryGender, BeneficiaryStatus, BeneficiaryType } from '../../enums/beneficiary.enum';

export interface BeneficiaryFilter { projectId?: string; status?: BeneficiaryStatus; type?: BeneficiaryType; category?: string; }

export interface BeneficiaryCreateProps {
  projectId: string; name: string; type: BeneficiaryType; enrollmentDate: Date;
  gender?: BeneficiaryGender; age?: number; dateOfBirth?: Date; contactNumber?: string; email?: string;
  address?: string; location?: string; category?: string; benefitsReceived?: string[]; notes?: string; metadata?: Record<string, unknown>;
}

export class Beneficiary extends AggregateRoot<string> {
  #projectId: string; #name: string; #type: BeneficiaryType; #gender?: BeneficiaryGender; #age?: number;
  #dateOfBirth?: Date; #contactNumber?: string; #email?: string; #address?: string; #location?: string;
  #category?: string; #enrollmentDate: Date; #exitDate?: Date; #status: BeneficiaryStatus;
  #benefitsReceived: string[]; #notes?: string; #metadata?: Record<string, unknown>;

  private constructor(
    id: string,
    projectId: string,
    name: string,
    type: BeneficiaryType,
    enrollmentDate: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#projectId = projectId;
    this.#name = name;
    this.#type = type;
    this.#enrollmentDate = enrollmentDate;
    this.#status = BeneficiaryStatus.ACTIVE;
    this.#benefitsReceived = [];
  }

  static create(props: BeneficiaryCreateProps): Beneficiary {
    if (!props.projectId || !props.name) throw new BusinessException('Project ID and name are required');
    const b = new Beneficiary(randomUUID(), props.projectId, props.name, props.type, props.enrollmentDate);
    b.#gender = props.gender; b.#age = props.age; b.#dateOfBirth = props.dateOfBirth;
    b.#contactNumber = props.contactNumber; b.#email = props.email; b.#address = props.address;
    b.#location = props.location; b.#category = props.category;
    b.#benefitsReceived = props.benefitsReceived ?? []; b.#notes = props.notes; b.#metadata = props.metadata;
    return b;
  }

  static rehydrate(id: string, props: BeneficiaryCreateProps & { status: BeneficiaryStatus; exitDate?: Date; createdAt?: Date; updatedAt?: Date }): Beneficiary {
    const b = new Beneficiary(
      id,
      props.projectId,
      props.name,
      props.type,
      props.enrollmentDate,
      props.createdAt,
      props.updatedAt,
    );
    b.#gender = props.gender; b.#age = props.age; b.#dateOfBirth = props.dateOfBirth;
    b.#contactNumber = props.contactNumber; b.#email = props.email; b.#address = props.address;
    b.#location = props.location; b.#category = props.category; b.#status = props.status; b.#exitDate = props.exitDate;
    b.#benefitsReceived = props.benefitsReceived ?? []; b.#notes = props.notes; b.#metadata = props.metadata;
    return b;
  }

  update(props: Partial<BeneficiaryCreateProps>): void {
    if (props.name) this.#name = props.name;
    if (props.gender !== undefined) this.#gender = props.gender;
    if (props.age !== undefined) this.#age = props.age;
    if (props.dateOfBirth !== undefined) this.#dateOfBirth = props.dateOfBirth;
    if (props.contactNumber !== undefined) this.#contactNumber = props.contactNumber;
    if (props.email !== undefined) this.#email = props.email;
    if (props.address !== undefined) this.#address = props.address;
    if (props.location !== undefined) this.#location = props.location;
    if (props.category !== undefined) this.#category = props.category;
    if (props.benefitsReceived) this.#benefitsReceived = props.benefitsReceived;
    if (props.notes !== undefined) this.#notes = props.notes;
    if (props.metadata) this.#metadata = props.metadata;
    this.touch();
  }

  markAsExited(exitDate?: Date): void {
    const exit = exitDate ?? new Date();
    if (exit <= this.#enrollmentDate) throw new BusinessException('Exit date must be after enrollment date');
    this.#exitDate = exit; this.#status = BeneficiaryStatus.COMPLETED; this.touch();
  }

  get projectId() { return this.#projectId; }
  get name() { return this.#name; }
  get type() { return this.#type; }
  get gender() { return this.#gender; }
  get age() { return this.#age; }
  get dateOfBirth() { return this.#dateOfBirth; }
  get contactNumber() { return this.#contactNumber; }
  get email() { return this.#email; }
  get address() { return this.#address; }
  get location() { return this.#location; }
  get category() { return this.#category; }
  get enrollmentDate() { return this.#enrollmentDate; }
  get exitDate() { return this.#exitDate; }
  get status() { return this.#status; }
  get benefitsReceived() { return [...this.#benefitsReceived]; }
  get notes() { return this.#notes; }
  get metadata() { return this.#metadata ? { ...this.#metadata } : undefined; }
}
