import { readFileSync } from 'fs';
import { join } from 'path';
import type { PrismaClient } from '../../generated/prisma/client';

const ENTITY_TYPE = 'workflow';

type FieldSeed = {
  key: string;
  label: string;
  fieldType: string;
  mandatory?: boolean;
  options?: string[];
  sortOrder: number;
};

type FormSeed = {
  key: string;
  label: string;
  description?: string;
  fields: FieldSeed[];
};

const YES_NO: FieldSeed['options'] = ['Yes', 'No'];
const APPROVE_DECLINE: FieldSeed['options'] = ['Approve', 'Decline'];

/** Hand-tuned forms for workflows migrated manually (JOIN_REQUEST, CONTACT_REQUEST). */
const HAND_CRAFTED_FORMS: FormSeed[] = [
  {
    key: 'JOIN_REQUEST:request',
    label: 'Join Request — Initial Data',
    fields: [
      { key: 'firstName', label: 'First Name', fieldType: 'text', mandatory: true, sortOrder: 0 },
      { key: 'lastName', label: 'Last Name', fieldType: 'text', mandatory: true, sortOrder: 1 },
      { key: 'email', label: 'Email Address', fieldType: 'text', mandatory: true, sortOrder: 2 },
      { key: 'contactNumber', label: 'Contact Number', fieldType: 'text', mandatory: true, sortOrder: 3 },
      { key: 'hometown', label: 'Home Town', fieldType: 'text', mandatory: true, sortOrder: 4 },
      { key: 'howDoUKnowAboutUs', label: 'How did you hear about us?', fieldType: 'text', sortOrder: 5 },
    ],
  },
  {
    key: 'JOIN_REQUEST_VERIFY_INFO',
    label: 'Verify Member Data',
    fields: [
      {
        key: 'correctionNeeded',
        label: 'Is data correction needed?',
        fieldType: 'select',
        mandatory: true,
        options: YES_NO,
        sortOrder: 0,
      },
    ],
  },
  {
    key: 'JOIN_REQUEST_POLICY_ACCEPTANCE',
    label: 'Policy Acceptance',
    fields: [
      {
        key: 'rulesAccepted',
        label: 'Did requester agree to Rules & Regulations?',
        fieldType: 'select',
        mandatory: true,
        options: YES_NO,
        sortOrder: 0,
      },
    ],
  },
  {
    key: 'JOIN_REQUEST_CORRECTION',
    label: 'Data Correction',
    fields: [
      {
        key: 'isCorrected',
        label: 'Has the data been corrected?',
        fieldType: 'select',
        mandatory: true,
        options: YES_NO,
        sortOrder: 0,
      },
    ],
  },
  {
    key: 'JOIN_REQUEST_APPROVAL',
    label: 'Onboarding Approval',
    fields: [
      {
        key: 'decision',
        label: 'Approve onboarding?',
        fieldType: 'select',
        mandatory: true,
        options: APPROVE_DECLINE,
        sortOrder: 0,
      },
    ],
  },
  {
    key: 'JOIN_REQUEST_WHATSAPP',
    label: 'WhatsApp Group',
    fields: [
      {
        key: 'userAdded',
        label: 'Added to official WhatsApp group?',
        fieldType: 'select',
        mandatory: true,
        options: YES_NO,
        sortOrder: 0,
      },
    ],
  },
  {
    key: 'CONTACT_REQUEST:request',
    label: 'Contact Request — Initial Data',
    fields: [
      { key: 'fullName', label: 'Full Name', fieldType: 'text', mandatory: true, sortOrder: 0 },
      { key: 'email', label: 'Email Address', fieldType: 'text', mandatory: true, sortOrder: 1 },
      { key: 'contactNumber', label: 'Contact Number', fieldType: 'text', mandatory: true, sortOrder: 2 },
      { key: 'subject', label: 'Subject', fieldType: 'text', mandatory: true, sortOrder: 3 },
      { key: 'message', label: 'Message', fieldType: 'text', mandatory: true, sortOrder: 4 },
    ],
  },
  {
    key: 'CONTACT_REQUEST_SUPPORT',
    label: 'Support Resolution',
    fields: [
      {
        key: 'isResolved',
        label: 'Has the request been resolved?',
        fieldType: 'select',
        mandatory: true,
        options: YES_NO,
        sortOrder: 0,
      },
      {
        key: 'resolutionRemarks',
        label: 'Resolution Remarks',
        fieldType: 'text',
        mandatory: true,
        sortOrder: 1,
      },
    ],
  },
];

function loadGeneratedForms(): FormSeed[] {
  const manifestPath = join(__dirname, 'workflow-forms.generated.json');
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      forms?: FormSeed[];
    };
    return raw.forms ?? [];
  } catch {
    console.warn('[workflow-forms-seed] No generated forms manifest found — skipping.');
    return [];
  }
}

function mergeForms(handCrafted: FormSeed[], generated: FormSeed[]): FormSeed[] {
  const byKey = new Map<string, FormSeed>();
  for (const form of generated) {
    byKey.set(form.key, form);
  }
  for (const form of handCrafted) {
    byKey.set(form.key, form);
  }
  return Array.from(byKey.values());
}

const WORKFLOW_FORMS = mergeForms(HAND_CRAFTED_FORMS, loadGeneratedForms());

function fieldOptionsJson(options?: string[]): string | null {
  if (!options?.length) return null;
  return JSON.stringify(options.map((value, index) => ({ value, label: value, sortOrder: index })));
}

export async function seedWorkflowForms(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  for (const formSeed of WORKFLOW_FORMS) {
    const formId = `wf-form-${formSeed.key.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;

    await prisma.form.upsert({
      where: { entityType_key: { entityType: ENTITY_TYPE, key: formSeed.key } },
      create: {
        id: formId,
        entityType: ENTITY_TYPE,
        key: formSeed.key,
        label: formSeed.label,
        description: formSeed.description ?? null,
        status: 'published',
        managePermissionsJson: '[]',
        readPermissionsJson: '[]',
        writePermissionsJson: '[]',
        createdBy: 'seed',
        publishedBy: 'seed',
        createdAt: now,
        updatedAt: now,
      },
      update: {
        label: formSeed.label,
        description: formSeed.description ?? null,
        status: 'published',
        publishedBy: 'seed',
        updatedAt: now,
      },
    });

    for (const field of formSeed.fields) {
      const fieldId = `${formId}-${field.key}`;
      await prisma.formFieldDefinition.upsert({
        where: { formId_key: { formId, key: field.key } },
        create: {
          id: fieldId,
          formId,
          key: field.key,
          label: field.label,
          fieldType: field.fieldType,
          mandatory: field.mandatory ?? false,
          fieldOptionsJson: fieldOptionsJson(field.options),
          isHidden: false,
          isEncrypted: false,
          enabled: true,
          sortOrder: field.sortOrder,
          createdBy: 'seed',
          createdAt: now,
          updatedAt: now,
        },
        update: {
          label: field.label,
          fieldType: field.fieldType,
          mandatory: field.mandatory ?? false,
          fieldOptionsJson: fieldOptionsJson(field.options),
          enabled: true,
          sortOrder: field.sortOrder,
          updatedAt: now,
        },
      });
    }
  }

  console.log(`[workflow-forms-seed] Upserted ${WORKFLOW_FORMS.length} workflow form(s).`);
}
