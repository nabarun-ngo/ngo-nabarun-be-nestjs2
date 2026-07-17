import {
  resolvePublicFormEntityType,
  resolvePublicFormLookupKey,
  resolvePublicFormWorkflowAlias,
} from './public-form-alias.registry';

describe('public-form-alias.registry', () => {
  it('resolves contact workflow alias', () => {
    expect(resolvePublicFormWorkflowAlias('contact')).toEqual({
      definitionId: 'CONTACT_REQUEST',
      formKey: 'CONTACT_REQUEST:request',
      entityType: 'workflow',
    });
  });

  it('resolves volunteer workflow alias', () => {
    expect(resolvePublicFormWorkflowAlias('volunteer')).toEqual({
      definitionId: 'JOIN_REQUEST',
      formKey: 'JOIN_REQUEST:request',
      entityType: 'workflow',
    });
  });

  it('returns null for generic public forms', () => {
    expect(resolvePublicFormWorkflowAlias('drawing-competition-registration')).toBeNull();
  });

  it('maps workflow aliases to workflow entity type and form key', () => {
    expect(resolvePublicFormEntityType('contact')).toBe('workflow');
    expect(resolvePublicFormLookupKey('contact')).toBe('CONTACT_REQUEST:request');
  });

  it('maps generic forms to public_site entity type and public id', () => {
    expect(resolvePublicFormEntityType('drawing-competition-registration')).toBe('public_site');
    expect(resolvePublicFormLookupKey('drawing-competition-registration')).toBe(
      'drawing-competition-registration',
    );
  });
});
