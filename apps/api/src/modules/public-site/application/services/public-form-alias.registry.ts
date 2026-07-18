export interface PublicFormWorkflowAlias {
  definitionId: string;
  formKey: string;
  entityType: 'workflow';
}

const PUBLIC_FORM_WORKFLOW_ALIASES: Record<string, PublicFormWorkflowAlias> = {
  contact: {
    definitionId: 'CONTACT_REQUEST',
    formKey: 'CONTACT_REQUEST:request',
    entityType: 'workflow',
  },
  volunteer: {
    definitionId: 'JOIN_REQUEST',
    formKey: 'JOIN_REQUEST:request',
    entityType: 'workflow',
  },
};

export function resolvePublicFormWorkflowAlias(
  publicFormId: string,
): PublicFormWorkflowAlias | null {
  return PUBLIC_FORM_WORKFLOW_ALIASES[publicFormId] ?? null;
}

export function resolvePublicFormEntityType(publicFormId: string): string {
  const alias = resolvePublicFormWorkflowAlias(publicFormId);
  return alias?.entityType ?? 'public_site';
}

export function resolvePublicFormLookupKey(publicFormId: string): string {
  const alias = resolvePublicFormWorkflowAlias(publicFormId);
  return alias?.formKey ?? publicFormId;
}
