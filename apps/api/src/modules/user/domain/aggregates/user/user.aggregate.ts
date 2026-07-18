import { randomUUID } from 'crypto';
import { AggregateRoot } from '@nabarun-ngo/nestjs-shared-core';
import { UserStatus } from '../../enums/user-status.enum';
import { PhoneNumber } from '../../value-objects/phone-number.vo';
import { Address } from '../../value-objects/address.vo';
import { SocialLink, SocialLinkProps } from '../../entities/social-link.entity';
import { UserCreatedEvent } from '../../events/user-created.event';
import { UserProfileUpdatedEvent } from '../../events/user-profile-updated.event';
import { UserStatusChangedEvent } from '../../events/user-status-changed.event';
import { UserDeletedEvent } from '../../events/user-deleted.event';
import {
  InvalidStatusTransitionError,
} from '../../errors/user.errors';
import { UserStatusTransitionPolicy } from '../../policies/user-status-transition.policy';
import { UserProfileCompletenessPolicy } from '../../policies/user-profile-completeness.policy';

// ── Create / update props ─────────────────────────────────────────────────────

export interface UserCreateProps {
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  middleName?: string;
  dateOfBirth?: Date;
  gender?: string;
  about?: string;
  picture?: string;
  isPublic?: boolean;
}

export interface UserUpdateProps {
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  about?: string;
  picture?: string;
  isPublic?: boolean;
  isSameAddress?: boolean;
  primaryPhone?: { phoneCode: string; phoneNumber: string; hidden?: boolean };
  secondaryPhone?: { phoneCode: string; phoneNumber: string; hidden?: boolean } | null;
  presentAddress?: {
    addressLine1: string; addressLine2?: string; addressLine3?: string;
    hometown: string; zipCode: string; state: string; district: string; country: string;
  } | null;
  permanentAddress?: {
    addressLine1: string; addressLine2?: string; addressLine3?: string;
    hometown: string; zipCode: string; state: string; district: string; country: string;
  } | null;
  socialMediaLinks?: SocialLinkProps[];
}

export interface UserAdminUpdateProps {
  status?: UserStatus;
  donationAmount?: number;
  donationPauseStart?: Date;
  donationPauseEnd?: Date;
}

// ── Rehydrate props (from DB row, includes all persisted fields) ──────────────

export interface UserRehydrateProps {
  id: string;
  email: string;
  idpSub?: string;
  status: UserStatus;
  firstName: string;
  lastName: string;
  isProfileComplete: boolean;
  title?: string;
  middleName?: string;
  dateOfBirth?: Date;
  gender?: string;
  about?: string;
  picture?: string;
  isPublic: boolean;
  isSameAddress?: boolean;
  primaryPhone?: PhoneNumber;
  secondaryPhone?: PhoneNumber;
  presentAddress?: Address;
  permanentAddress?: Address;
  socialMediaLinks?: SocialLink[];
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
  /** App profile UUID of the user who created this record (never idpSub). */
  createdById?: string;
  /** App profile UUID of the user who last modified this record (never idpSub). */
  updatedById?: string;
  donationAmount?: number;
  donationPauseStart?: Date;
  donationPauseEnd?: Date;
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export class User extends AggregateRoot<string> {
  #email: string;
  #idpSub: string | undefined;
  #status: UserStatus;
  #isProfileComplete: boolean;

  // Name
  #title: string | undefined;
  #firstName: string;
  #middleName: string | undefined;
  #lastName: string;

  // Profile
  #dateOfBirth: Date | undefined;
  #gender: string | undefined;
  #about: string | undefined;
  #picture: string | undefined;
  #isPublic: boolean;
  #isSameAddress: boolean | undefined;

  // Contact
  #primaryPhone: PhoneNumber | undefined;
  #secondaryPhone: PhoneNumber | undefined;
  #presentAddress: Address | undefined;
  #permanentAddress: Address | undefined;

  // Collection
  #socialMediaLinks: SocialLink[];

  // Timestamps / soft-delete
  #deletedAt: Date | null;

  // Audit — app profile UUID of the acting user (never idpSub)
  #createdById: string | undefined;
  #updatedById: string | undefined;

  // Finance preferences
  #donationAmount: number | undefined;
  #donationPauseStart: Date | undefined;
  #donationPauseEnd: Date | undefined;

  // Transient — not persisted
  #systemGeneratedPassword: boolean;

  version: number;

  // ── Private constructor ───────────────────────────────────────────────────

  private constructor(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    status: UserStatus,
    isProfileComplete: boolean,
    isPublic: boolean,
    socialMediaLinks: SocialLink[],
    deletedAt: Date | null,
    version: number,
    createdAt?: Date,
    updatedAt?: Date,
    idpSub?: string,
    title?: string,
    middleName?: string,
    dateOfBirth?: Date,
    gender?: string,
    about?: string,
    picture?: string,
    isSameAddress?: boolean,
    primaryPhone?: PhoneNumber,
    secondaryPhone?: PhoneNumber,
    presentAddress?: Address,
    permanentAddress?: Address,
  ) {
    super(id, createdAt, updatedAt);
    this.#email = email;
    this.#firstName = firstName;
    this.#lastName = lastName;
    this.#status = status;
    this.#isProfileComplete = isProfileComplete;
    this.#isPublic = isPublic;
    this.#socialMediaLinks = socialMediaLinks;
    this.#deletedAt = deletedAt;
    this.version = version;
    this.#idpSub = idpSub;
    this.#title = title;
    this.#middleName = middleName;
    this.#dateOfBirth = dateOfBirth;
    this.#gender = gender;
    this.#about = about;
    this.#picture = picture;
    this.#isSameAddress = isSameAddress;
    this.#primaryPhone = primaryPhone;
    this.#secondaryPhone = secondaryPhone;
    this.#presentAddress = presentAddress;
    this.#permanentAddress = permanentAddress;
    this.#createdById = undefined;
    this.#updatedById = undefined;
    this.#systemGeneratedPassword = false;
  }

  // ── Factory — create (new or reuse soft-deleted) ──────────────────────────

  /**
   * Admin-only provisioning path.
   * When `existingDeletedUser` is provided, the aggregate retains the same id
   * and preserved profile fields; caller must then call `restoreFromDeletion()`.
   */
  static create(props: UserCreateProps, existingDeletedUser?: User): User {
    if (!props.firstName?.trim()) throw new Error('firstName is required');
    if (!props.lastName?.trim()) throw new Error('lastName is required');
    if (!props.email?.trim()) throw new Error('email is required');

    const id = existingDeletedUser?.id ?? randomUUID();

    const user = new User(
      id,
      props.email,
      props.firstName,
      props.lastName,
      UserStatus.DRAFT,
      false, // completeness applied separately
      props.isPublic ?? true,
      existingDeletedUser?.socialMediaLinks ? [...existingDeletedUser.socialMediaLinks] : [],
      existingDeletedUser?.deletedAt ?? null,
      existingDeletedUser?.version ?? 0,
      undefined,
      undefined,
      undefined, // idpSub — linked after IdP provision
      props.title ?? existingDeletedUser?.title,
      props.middleName ?? existingDeletedUser?.middleName,
      props.dateOfBirth ?? existingDeletedUser?.dateOfBirth,
      props.gender ?? existingDeletedUser?.gender,
      props.about ?? existingDeletedUser?.about,
      props.picture ?? existingDeletedUser?.picture,
      existingDeletedUser?.isSameAddress,
      existingDeletedUser?.primaryPhone,
      existingDeletedUser?.secondaryPhone,
      existingDeletedUser?.presentAddress,
      existingDeletedUser?.permanentAddress,
    );

    user.addDomainEvent(
      new UserCreatedEvent(id, props.email, undefined, false),
    );
    return user;
  }

  /** Reconstitution path — DB → aggregate. Does NOT raise events. */
  static rehydrate(props: UserRehydrateProps): User {
    const user = new User(
      props.id,
      props.email,
      props.firstName,
      props.lastName,
      props.status,
      props.isProfileComplete,
      props.isPublic,
      props.socialMediaLinks ?? [],
      props.deletedAt ?? null,
      props.version ?? 0,
      props.createdAt,
      props.updatedAt,
      props.idpSub,
      props.title,
      props.middleName,
      props.dateOfBirth,
      props.gender,
      props.about,
      props.picture,
      props.isSameAddress,
      props.primaryPhone,
      props.secondaryPhone,
      props.presentAddress,
      props.permanentAddress,
    );
    user.#createdById = props.createdById;
    user.#updatedById = props.updatedById;
    user.#donationAmount = props.donationAmount;
    user.#donationPauseStart = props.donationPauseStart;
    user.#donationPauseEnd = props.donationPauseEnd;
    return user;
  }

  // ── Domain methods ────────────────────────────────────────────────────────

  /**
   * Restores a soft-deleted user.
   * Guard: only valid when status === DELETED.
   * Called by CreateUserHandler when findByEmail returns a deleted profile.
   */
  restoreFromDeletion(): void {
    if (this.#status !== UserStatus.DELETED && this.#deletedAt === null) {
      throw new InvalidStatusTransitionError(this.#status, UserStatus.ACTIVE);
    }
    const previous = this.#status;
    this.#status = UserStatus.ACTIVE;
    this.#deletedAt = null;
    this.#idpSub = undefined; // stale sub cleared; new one provisioned next
    this.#isProfileComplete = false; // recomputed after props applied
    this.touch();
    this.addDomainEvent(
      new UserStatusChangedEvent(this.id, this.#idpSub, previous, UserStatus.ACTIVE),
    );
  }

  /**
   * Signals that a password must be generated by the IdP adapter.
   * The actual password is produced inside the infrastructure adapter, which knows
   * the target IdP's password policy. Sets systemGeneratedPassword = true, driving
   * the resetPassword flag so the user is forced to change it on first login.
   */
  markSystemPasswordRequired(): void {
    this.#systemGeneratedPassword = true;
    this.touch();
  }

  /** Persists the completeness flag — computed by UserProfileCompletenessPolicy externally. */
  applyCompleteness(isComplete: boolean): void {
    this.#isProfileComplete = isComplete;
    this.touch();
  }

  /**
   * Stores the Auth0 sub after successful IdP provisioning.
   * Called after createUser() returns externalSub.
   */
  linkIdentity(idpSub: string): void {
    if (!idpSub?.trim()) throw new Error('idpSub is required');
    this.#idpSub = idpSub;
    this.touch();
  }

  /** Profile self-update (user or admin on profile fields). Raises UserProfileUpdatedEvent. */
  updateProfile(detail: UserUpdateProps): void {
    UserStatusTransitionPolicy.assertCanSelfUpdate(this.#status);

    if (detail.title !== undefined) this.#title = detail.title;
    if (detail.firstName !== undefined) this.#firstName = detail.firstName;
    if (detail.middleName !== undefined) this.#middleName = detail.middleName;
    if (detail.lastName !== undefined) this.#lastName = detail.lastName;
    if (detail.dateOfBirth !== undefined) this.#dateOfBirth = detail.dateOfBirth;
    if (detail.gender !== undefined) this.#gender = detail.gender;
    if (detail.about !== undefined) this.#about = detail.about;
    if (detail.picture !== undefined) this.#picture = detail.picture;
    if (detail.isPublic !== undefined) this.#isPublic = detail.isPublic;
    if (detail.isSameAddress !== undefined) this.#isSameAddress = detail.isSameAddress;

    if (detail.primaryPhone) {
      this.#primaryPhone = PhoneNumber.of(
        detail.primaryPhone.phoneCode,
        detail.primaryPhone.phoneNumber,
        detail.primaryPhone.hidden ?? false,
      );
    }

    if (detail.secondaryPhone === null) {
      this.#secondaryPhone = undefined;
    } else if (detail.secondaryPhone) {
      this.#secondaryPhone = PhoneNumber.of(
        detail.secondaryPhone.phoneCode,
        detail.secondaryPhone.phoneNumber,
        detail.secondaryPhone.hidden ?? false,
      );
    }

    if (detail.presentAddress === null) {
      this.#presentAddress = undefined;
    } else if (detail.presentAddress) {
      const a = detail.presentAddress;
      this.#presentAddress = Address.of(
        a.addressLine1, a.hometown, a.zipCode, a.state, a.district, a.country,
        a.addressLine2, a.addressLine3,
      );
    }

    if (detail.permanentAddress === null) {
      this.#permanentAddress = undefined;
    } else if (detail.permanentAddress) {
      const a = detail.permanentAddress;
      this.#permanentAddress = Address.of(
        a.addressLine1, a.hometown, a.zipCode, a.state, a.district, a.country,
        a.addressLine2, a.addressLine3,
      );
    }

    if (detail.socialMediaLinks) {
      for (const incoming of detail.socialMediaLinks) {
        const existing = this.#socialMediaLinks.find(
          (l) => l.linkType === incoming.linkType,
        );
        if (existing) {
          existing.update(incoming);
        } else {
          this.#socialMediaLinks.push(
            SocialLink.create(incoming.linkName, incoming.linkType, incoming.linkValue),
          );
        }
      }
    }

    // Recompute completeness
    const isComplete = UserProfileCompletenessPolicy.evaluate(this);
    this.#isProfileComplete = isComplete;

    this.touch();
    this.addDomainEvent(
      new UserProfileUpdatedEvent(
        this.id,
        this.#idpSub,
        isComplete,
        this.#firstName,
        this.#lastName,
        this.#picture,
      ),
    );
  }

  /** Admin-only attribute update (status, PAN, donation). */
  updateAdmin(detail: UserAdminUpdateProps): void {
    if (detail.status && detail.status !== this.#status) {
      UserStatusTransitionPolicy.assertTransition(this.#status, detail.status);
      const previous = this.#status;
      this.#status = detail.status;
      this.addDomainEvent(
        new UserStatusChangedEvent(this.id, this.#idpSub, previous, detail.status),
      );
    }
    if (detail.donationAmount !== undefined) {
      this.#donationAmount = detail.donationAmount;
    }
    if (detail.donationPauseStart !== undefined) {
      this.#donationPauseStart = detail.donationPauseStart;
    }
    if (detail.donationPauseEnd !== undefined) {
      this.#donationPauseEnd = detail.donationPauseEnd;
    }
    this.touch();
  }

  /** Soft-delete the user profile. Guard: must not already be DELETED. */
  softDelete(): void {
    if (this.#status === UserStatus.DELETED) {
      throw new InvalidStatusTransitionError(UserStatus.DELETED, UserStatus.DELETED);
    }
    const previous = this.#status;
    this.#status = UserStatus.DELETED;
    this.#deletedAt = new Date();
    this.#isProfileComplete = false;
    this.touch();
    this.addDomainEvent(
      new UserStatusChangedEvent(this.id, this.#idpSub, previous, UserStatus.DELETED),
    );
    this.addDomainEvent(
      new UserDeletedEvent(this.id, this.#email, this.#idpSub),
    );
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get email(): string { return this.#email; }
  get idpSub(): string | undefined { return this.#idpSub; }
  get status(): UserStatus { return this.#status; }
  get isProfileComplete(): boolean { return this.#isProfileComplete; }
  get title(): string | undefined { return this.#title; }
  get firstName(): string { return this.#firstName; }
  get middleName(): string | undefined { return this.#middleName; }
  get lastName(): string { return this.#lastName; }
  get fullName(): string { return `${this.#firstName} ${this.#lastName}`.trim(); }
  get initials(): string {
    return (this.#firstName[0] + this.#lastName[0]).toUpperCase();
  }
  get dateOfBirth(): Date | undefined { return this.#dateOfBirth; }
  get gender(): string | undefined { return this.#gender; }
  get about(): string | undefined { return this.#about; }
  get picture(): string | undefined { return this.#picture; }
  get isPublic(): boolean { return this.#isPublic; }
  get isSameAddress(): boolean | undefined { return this.#isSameAddress; }
  get primaryPhone(): PhoneNumber | undefined { return this.#primaryPhone; }
  get secondaryPhone(): PhoneNumber | undefined { return this.#secondaryPhone; }
  get presentAddress(): Address | undefined { return this.#presentAddress; }
  get permanentAddress(): Address | undefined { return this.#permanentAddress; }
  get socialMediaLinks(): SocialLink[] { return [...this.#socialMediaLinks]; }
  get deletedAt(): Date | null { return this.#deletedAt; }
  get donationAmount(): number | undefined { return this.#donationAmount; }
  get donationPauseStart(): Date | undefined { return this.#donationPauseStart; }
  get donationPauseEnd(): Date | undefined { return this.#donationPauseEnd; }

  /** True when the IdP adapter must generate the password and force a reset on first login. */
  get systemGeneratedPassword(): boolean { return this.#systemGeneratedPassword; }

  /** App profile UUID of the user who created this record (never idpSub). */
  get createdById(): string | undefined { return this.#createdById; }

  /** App profile UUID of the user who last modified this record (never idpSub). */
  get updatedById(): string | undefined { return this.#updatedById; }

  /**
   * Record the app profile UUID of the admin/user performing a write operation.
   * Called by command handlers before repo.create() / repo.update().
   * MUST be a `userId` — never an idpSub.
   */
  setCreatedById(userId: string): void { this.#createdById = userId; }
  setUpdatedById(userId: string): void { this.#updatedById = userId; }
}
