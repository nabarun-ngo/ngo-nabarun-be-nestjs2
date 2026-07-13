import { User, UserRehydrateProps } from './user.aggregate';
import { UserStatus } from '../../enums/user-status.enum';
import { UserCreatedEvent } from '../../events/user-created.event';
import { UserProfileUpdatedEvent } from '../../events/user-profile-updated.event';
import { UserStatusChangedEvent } from '../../events/user-status-changed.event';
import { UserDeletedEvent } from '../../events/user-deleted.event';
import {
  InvalidStatusTransitionError,
  DuplicateEmailError,
} from '../../errors/user.errors';

function makeUser(overrides: Partial<UserRehydrateProps> = {}): User {
  return User.rehydrate({
    id: 'user-id-1',
    email: 'john.doe@example.com',
    status: UserStatus.ACTIVE,
    firstName: 'John',
    lastName: 'Doe',
    isProfileComplete: false,
    isPublic: true,
    socialMediaLinks: [],
    deletedAt: null,
    version: 0,
    idpSub: 'auth0|abc123',
    ...overrides,
  });
}

describe('User aggregate', () => {
  // ── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a user in DRAFT status', () => {
      const user = User.create({ email: 'a@b.com', firstName: 'A', lastName: 'B' });
      expect(user.status).toBe(UserStatus.DRAFT);
    });

    it('idpSub is undefined immediately after create', () => {
      const user = User.create({ email: 'a@b.com', firstName: 'A', lastName: 'B' });
      expect(user.idpSub).toBeUndefined();
    });

    it('fires a UserCreatedEvent', () => {
      const user = User.create({ email: 'a@b.com', firstName: 'A', lastName: 'B' });
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0]).toBeInstanceOf(UserCreatedEvent);
    });

    it('reuses ID and social links from a soft-deleted user', () => {
      const existing = makeUser({ status: UserStatus.DELETED, deletedAt: new Date(), socialMediaLinks: [] });
      const user = User.create({ email: 'a@b.com', firstName: 'A', lastName: 'B' }, existing);
      expect(user.id).toBe(existing.id);
    });

    it('throws when firstName is blank', () => {
      expect(() =>
        User.create({ email: 'a@b.com', firstName: '  ', lastName: 'B' }),
      ).toThrow('firstName is required');
    });

    it('throws when lastName is blank', () => {
      expect(() =>
        User.create({ email: 'a@b.com', firstName: 'A', lastName: '' }),
      ).toThrow('lastName is required');
    });

    it('throws when email is blank', () => {
      expect(() =>
        User.create({ email: '', firstName: 'A', lastName: 'B' }),
      ).toThrow('email is required');
    });
  });

  // ── rehydrate ────────────────────────────────────────────────────────────────

  describe('rehydrate()', () => {
    it('reconstitutes without domain events', () => {
      const user = makeUser();
      expect(user.domainEvents).toHaveLength(0);
    });

    it('restores createdById and updatedById audit fields', () => {
      const user = User.rehydrate({
        id: 'u1',
        email: 'a@b.com',
        status: UserStatus.ACTIVE,
        firstName: 'A',
        lastName: 'B',
        isProfileComplete: false,
        isPublic: true,
        socialMediaLinks: [],
        deletedAt: null,
        version: 1,
        createdById: 'admin-1',
        updatedById: 'admin-2',
      });
      expect(user.createdById).toBe('admin-1');
      expect(user.updatedById).toBe('admin-2');
    });
  });

  // ── linkIdentity ─────────────────────────────────────────────────────────────

  describe('linkIdentity()', () => {
    it('sets idpSub', () => {
      const user = User.create({ email: 'a@b.com', firstName: 'A', lastName: 'B' });
      user.linkIdentity('auth0|newSub');
      expect(user.idpSub).toBe('auth0|newSub');
    });

    it('throws when idpSub is empty', () => {
      const user = makeUser();
      expect(() => user.linkIdentity('')).toThrow('idpSub is required');
    });

    it('throws when idpSub is whitespace', () => {
      const user = makeUser();
      expect(() => user.linkIdentity('   ')).toThrow('idpSub is required');
    });
  });

  // ── markSystemPasswordRequired ────────────────────────────────────────────────

  describe('markSystemPasswordRequired()', () => {
    it('sets systemGeneratedPassword to true', () => {
      const user = makeUser();
      expect(user.systemGeneratedPassword).toBe(false);
      user.markSystemPasswordRequired();
      expect(user.systemGeneratedPassword).toBe(true);
    });
  });

  // ── applyCompleteness ─────────────────────────────────────────────────────────

  describe('applyCompleteness()', () => {
    it('sets isProfileComplete flag', () => {
      const user = makeUser({ isProfileComplete: false });
      user.applyCompleteness(true);
      expect(user.isProfileComplete).toBe(true);
    });
  });

  // ── updateProfile ─────────────────────────────────────────────────────────────

  describe('updateProfile()', () => {
    it('updates basic scalar fields', () => {
      const user = makeUser();
      user.updateProfile({ firstName: 'Jane', gender: 'FEMALE' });
      expect(user.firstName).toBe('Jane');
      expect(user.gender).toBe('FEMALE');
    });

    it('fires UserProfileUpdatedEvent', () => {
      const user = makeUser();
      user.updateProfile({ firstName: 'Jane' });
      const event = user.domainEvents.find((e) => e instanceof UserProfileUpdatedEvent) as UserProfileUpdatedEvent;
      expect(event).toBeDefined();
      expect(event.userId).toBe(user.id);
      expect(event.idpSub).toBe('auth0|abc123');
    });

    it('recomputes isProfileComplete after update', () => {
      const user = makeUser({ isProfileComplete: false });
      user.updateProfile({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
      });
      expect(user.isProfileComplete).toBe(true);
    });

    it('sets primary phone', () => {
      const user = makeUser();
      user.updateProfile({ primaryPhone: { phoneCode: '+91', phoneNumber: '9876543210' } });
      expect(user.primaryPhone?.phoneCode).toBe('+91');
      expect(user.primaryPhone?.phoneNumber).toBe('9876543210');
    });

    it('clears secondary phone when null is passed', () => {
      const user = makeUser();
      user.updateProfile({ primaryPhone: { phoneCode: '+91', phoneNumber: '9876543210' } });
      user.clearEvents();
      user.updateProfile({ secondaryPhone: null });
      expect(user.secondaryPhone).toBeUndefined();
    });

    it('throws when user is BLOCKED', () => {
      const user = makeUser({ status: UserStatus.BLOCKED });
      expect(() => user.updateProfile({ firstName: 'X' })).toThrow(InvalidStatusTransitionError);
    });

    it('adds a social link', () => {
      const user = makeUser();
      user.updateProfile({
        socialMediaLinks: [{ linkName: 'LinkedIn', linkType: 'linkedin', linkValue: 'https://linkedin.com/in/test' }],
      });
      expect(user.socialMediaLinks).toHaveLength(1);
      expect(user.socialMediaLinks[0].linkType).toBe('linkedin');
    });

    it('updates an existing social link by linkType', () => {
      const user = makeUser();
      user.updateProfile({
        socialMediaLinks: [{ linkName: 'LinkedIn', linkType: 'linkedin', linkValue: 'https://linkedin.com/in/old' }],
      });
      user.clearEvents();
      user.updateProfile({
        socialMediaLinks: [{ linkName: 'LinkedIn', linkType: 'linkedin', linkValue: 'https://linkedin.com/in/new' }],
      });
      expect(user.socialMediaLinks).toHaveLength(1);
      expect(user.socialMediaLinks[0].linkValue).toBe('https://linkedin.com/in/new');
    });
  });

  // ── updateAdmin ───────────────────────────────────────────────────────────────

  describe('updateAdmin()', () => {
    it('changes status from ACTIVE to BLOCKED and fires UserStatusChangedEvent', () => {
      const user = makeUser({ status: UserStatus.ACTIVE });
      user.updateAdmin({ status: UserStatus.BLOCKED });
      expect(user.status).toBe(UserStatus.BLOCKED);
      const event = user.domainEvents.find((e) => e instanceof UserStatusChangedEvent) as UserStatusChangedEvent;
      expect(event.previousStatus).toBe(UserStatus.ACTIVE);
      expect(event.newStatus).toBe(UserStatus.BLOCKED);
      expect(event.idpSub).toBe('auth0|abc123');
    });

    it('does not fire event when status is unchanged', () => {
      const user = makeUser({ status: UserStatus.ACTIVE });
      user.updateAdmin({ status: UserStatus.ACTIVE });
      expect(user.domainEvents).toHaveLength(0);
    });

    it('throws on invalid status transition (DRAFT → DELETED)', () => {
      const user = makeUser({ status: UserStatus.DRAFT, idpSub: undefined });
      expect(() => user.updateAdmin({ status: UserStatus.DELETED })).toThrow(InvalidStatusTransitionError);
    });

  });

  // ── softDelete ────────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('sets status to DELETED and records deletedAt', () => {
      const user = makeUser({ status: UserStatus.ACTIVE });
      user.softDelete();
      expect(user.status).toBe(UserStatus.DELETED);
      expect(user.deletedAt).toBeInstanceOf(Date);
    });

    it('clears isProfileComplete flag', () => {
      const user = makeUser({ isProfileComplete: true });
      user.softDelete();
      expect(user.isProfileComplete).toBe(false);
    });

    it('fires both UserStatusChangedEvent and UserDeletedEvent', () => {
      const user = makeUser({ status: UserStatus.ACTIVE });
      user.softDelete();
      const statusEvent = user.domainEvents.find((e) => e instanceof UserStatusChangedEvent) as UserStatusChangedEvent;
      const deleteEvent = user.domainEvents.find((e) => e instanceof UserDeletedEvent) as UserDeletedEvent;
      expect(statusEvent).toBeDefined();
      expect(statusEvent.newStatus).toBe(UserStatus.DELETED);
      expect(statusEvent.idpSub).toBe('auth0|abc123');
      expect(deleteEvent).toBeDefined();
      expect(deleteEvent.email).toBe('john.doe@example.com');
      expect(deleteEvent.idpSub).toBe('auth0|abc123');
    });

    it('throws when already DELETED', () => {
      const user = makeUser({ status: UserStatus.DELETED, deletedAt: new Date() });
      expect(() => user.softDelete()).toThrow(InvalidStatusTransitionError);
    });
  });

  // ── restoreFromDeletion ───────────────────────────────────────────────────────

  describe('restoreFromDeletion()', () => {
    it('restores a DELETED user to ACTIVE', () => {
      const user = makeUser({ status: UserStatus.DELETED, deletedAt: new Date() });
      user.restoreFromDeletion();
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.deletedAt).toBeNull();
    });

    it('clears idpSub after restoration (stale sub removed)', () => {
      const user = makeUser({ status: UserStatus.DELETED, deletedAt: new Date() });
      user.restoreFromDeletion();
      expect(user.idpSub).toBeUndefined();
    });

    it('fires UserStatusChangedEvent with ACTIVE as new status', () => {
      const user = makeUser({ status: UserStatus.DELETED, deletedAt: new Date() });
      user.restoreFromDeletion();
      const event = user.domainEvents.find((e) => e instanceof UserStatusChangedEvent) as UserStatusChangedEvent;
      expect(event.previousStatus).toBe(UserStatus.DELETED);
      expect(event.newStatus).toBe(UserStatus.ACTIVE);
    });

    it('throws when user is ACTIVE (not deleted)', () => {
      const user = makeUser({ status: UserStatus.ACTIVE });
      expect(() => user.restoreFromDeletion()).toThrow(InvalidStatusTransitionError);
    });
  });

  // ── setCreatedById / setUpdatedById ──────────────────────────────────────────

  describe('setCreatedById() / setUpdatedById()', () => {
    it('sets audit fields', () => {
      const user = makeUser();
      user.setCreatedById('admin-uuid');
      user.setUpdatedById('editor-uuid');
      expect(user.createdById).toBe('admin-uuid');
      expect(user.updatedById).toBe('editor-uuid');
    });
  });

  // ── computed properties ───────────────────────────────────────────────────────

  describe('fullName and initials', () => {
    it('computes fullName', () => {
      const user = makeUser({ firstName: 'Jane', lastName: 'Smith' });
      expect(user.fullName).toBe('Jane Smith');
    });

    it('computes initials', () => {
      const user = makeUser({ firstName: 'Jane', lastName: 'Smith' });
      expect(user.initials).toBe('JS');
    });
  });
});
