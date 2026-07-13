import { PhoneNumber } from './phone-number.vo';

describe('PhoneNumber value object', () => {
  it('creates a PhoneNumber with required fields', () => {
    const p = PhoneNumber.of('+91', '9876543210');
    expect(p.phoneCode).toBe('+91');
    expect(p.phoneNumber).toBe('9876543210');
    expect(p.hidden).toBe(false);
  });

  it('trims whitespace from phoneCode and phoneNumber', () => {
    const p = PhoneNumber.of('  +91  ', '  9876543210  ');
    expect(p.phoneCode).toBe('+91');
    expect(p.phoneNumber).toBe('9876543210');
  });

  it('sets hidden flag when provided', () => {
    const p = PhoneNumber.of('+91', '9876543210', true);
    expect(p.hidden).toBe(true);
  });

  it('throws when phoneCode is empty', () => {
    expect(() => PhoneNumber.of('', '9876543210')).toThrow('phoneCode is required');
  });

  it('throws when phoneCode is whitespace only', () => {
    expect(() => PhoneNumber.of('  ', '9876543210')).toThrow('phoneCode is required');
  });

  it('throws when phoneNumber is empty', () => {
    expect(() => PhoneNumber.of('+91', '')).toThrow('phoneNumber is required');
  });

  describe('equals()', () => {
    it('returns true for identical phone numbers', () => {
      const a = PhoneNumber.of('+91', '9876543210');
      const b = PhoneNumber.of('+91', '9876543210');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when phoneCode differs', () => {
      const a = PhoneNumber.of('+91', '9876543210');
      const b = PhoneNumber.of('+1', '9876543210');
      expect(a.equals(b)).toBe(false);
    });

    it('returns false when hidden flag differs', () => {
      const a = PhoneNumber.of('+91', '9876543210', false);
      const b = PhoneNumber.of('+91', '9876543210', true);
      expect(a.equals(b)).toBe(false);
    });
  });
});
