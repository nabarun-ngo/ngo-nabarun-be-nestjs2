import { Address } from './address.vo';

describe('Address value object', () => {
  const valid = () =>
    Address.of('123 Main St', 'Springfield', '400001', 'MH', 'MH_MUMBAI', 'IN');

  it('creates an Address with required fields', () => {
    const addr = valid();
    expect(addr.addressLine1).toBe('123 Main St');
    expect(addr.hometown).toBe('Springfield');
    expect(addr.zipCode).toBe('400001');
    expect(addr.state).toBe('MH');
    expect(addr.district).toBe('MH_MUMBAI');
    expect(addr.country).toBe('IN');
  });

  it('trims whitespace from fields', () => {
    const addr = Address.of('  123 Main St  ', '  Springfield  ', '400001', 'MH', 'MH_MUMBAI', 'IN');
    expect(addr.addressLine1).toBe('123 Main St');
    expect(addr.hometown).toBe('Springfield');
  });

  it('stores optional addressLine2 and addressLine3', () => {
    const addr = Address.of('123 Main St', 'Springfield', '400001', 'MH', 'MH_MUMBAI', 'IN', 'Apt 4', 'Block B');
    expect(addr.addressLine2).toBe('Apt 4');
    expect(addr.addressLine3).toBe('Block B');
  });

  it('addressLine2 and addressLine3 default to undefined', () => {
    const addr = valid();
    expect(addr.addressLine2).toBeUndefined();
    expect(addr.addressLine3).toBeUndefined();
  });

  it('throws when addressLine1 is empty', () => {
    expect(() =>
      Address.of('', 'Springfield', '400001', 'MH', 'MH_MUMBAI', 'IN'),
    ).toThrow('addressLine1 is required');
  });

  it('throws when addressLine1 is whitespace only', () => {
    expect(() =>
      Address.of('   ', 'Springfield', '400001', 'MH', 'MH_MUMBAI', 'IN'),
    ).toThrow('addressLine1 is required');
  });

  describe('equals()', () => {
    it('returns true for identical addresses', () => {
      const a = valid();
      const b = valid();
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when any field differs', () => {
      const a = valid();
      const b = Address.of('999 Other St', 'Springfield', '400001', 'MH', 'MH_MUMBAI', 'IN');
      expect(a.equals(b)).toBe(false);
    });

    it('returns false when optional field differs', () => {
      const a = Address.of('123 Main St', 'Springfield', '400001', 'MH', 'MH_MUMBAI', 'IN', 'Apt 4');
      const b = Address.of('123 Main St', 'Springfield', '400001', 'MH', 'MH_MUMBAI', 'IN', 'Apt 5');
      expect(a.equals(b)).toBe(false);
    });
  });
});
