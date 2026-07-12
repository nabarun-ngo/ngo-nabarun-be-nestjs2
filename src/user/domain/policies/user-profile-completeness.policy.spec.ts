import { UserProfileCompletenessPolicy } from './user-profile-completeness.policy';

const complete = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'MALE',
  email: 'john.doe@example.com',
};

describe('UserProfileCompletenessPolicy', () => {
  describe('evaluate()', () => {
    it('returns true when all required fields are present', () => {
      expect(UserProfileCompletenessPolicy.evaluate(complete)).toBe(true);
    });

    it('returns false when firstName is missing', () => {
      expect(UserProfileCompletenessPolicy.evaluate({ ...complete, firstName: '' })).toBe(false);
    });

    it('returns false when lastName is missing', () => {
      expect(UserProfileCompletenessPolicy.evaluate({ ...complete, lastName: '' })).toBe(false);
    });

    it('returns false when dateOfBirth is undefined', () => {
      expect(UserProfileCompletenessPolicy.evaluate({ ...complete, dateOfBirth: undefined })).toBe(false);
    });

    it('returns false when gender is undefined', () => {
      expect(UserProfileCompletenessPolicy.evaluate({ ...complete, gender: undefined })).toBe(false);
    });

    it('returns false when email is empty', () => {
      expect(UserProfileCompletenessPolicy.evaluate({ ...complete, email: '' })).toBe(false);
    });

    it('returns false when firstName is whitespace only', () => {
      expect(UserProfileCompletenessPolicy.evaluate({ ...complete, firstName: '   ' })).toBe(false);
    });
  });

  describe('missingFields()', () => {
    it('returns empty array when profile is complete', () => {
      expect(UserProfileCompletenessPolicy.missingFields(complete)).toEqual([]);
    });

    it('returns all missing fields when all are absent', () => {
      const missing = UserProfileCompletenessPolicy.missingFields({
        firstName: '',
        lastName: '',
        dateOfBirth: undefined,
        gender: undefined,
        email: '',
      });
      expect(missing).toEqual(
        expect.arrayContaining(['firstName', 'lastName', 'dateOfBirth', 'gender', 'email']),
      );
      expect(missing).toHaveLength(5);
    });

    it('returns only the missing fields', () => {
      const missing = UserProfileCompletenessPolicy.missingFields({
        ...complete,
        dateOfBirth: undefined,
        gender: undefined,
      });
      expect(missing).toEqual(['dateOfBirth', 'gender']);
    });
  });
});
