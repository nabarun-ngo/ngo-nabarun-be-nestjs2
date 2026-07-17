import type { PrismaClient } from '../../generated/prisma/client';

const ENTITY_TYPE = 'public_site';

type FieldSeed = {
  key: string;
  label: string;
  fieldType: string;
  mandatory?: boolean;
  sortOrder: number;
};

const PUBLIC_SITE_FORMS: Array<{
  key: string;
  label: string;
  description?: string;
  fields: FieldSeed[];
}> = [
  {
    key: 'drawing-competition-registration',
    label: 'Drawing Competition Registration',
    description: 'Register for the drawing competition',
    fields: [
      { key: 'participantName', label: 'Participant Name', fieldType: 'text', mandatory: true, sortOrder: 0 },
      { key: 'ageGroup', label: 'Age Group', fieldType: 'select', mandatory: true, sortOrder: 1 },
      { key: 'schoolName', label: 'School Name', fieldType: 'text', mandatory: true, sortOrder: 2 },
      { key: 'parentEmail', label: 'Parent Email', fieldType: 'email', mandatory: true, sortOrder: 3 },
      { key: 'parentPhone', label: 'Parent Phone', fieldType: 'phone', mandatory: true, sortOrder: 4 },
    ],
  },
];

function fieldOptionsJson(options: string[]): string {
  return JSON.stringify(
    options.map((value, index) => ({ key: value, label: value, sortOrder: index })),
  );
}

const AGE_GROUP_OPTIONS = ['6-8', '9-11', '12-14'];

export async function seedPublicSiteForms(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  for (const formSeed of PUBLIC_SITE_FORMS) {
    const formId = `ps-form-${formSeed.key.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;

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
      const optionsJson =
        field.key === 'ageGroup' ? fieldOptionsJson(AGE_GROUP_OPTIONS) : null;

      await prisma.formFieldDefinition.upsert({
        where: { formId_key: { formId, key: field.key } },
        create: {
          id: fieldId,
          formId,
          key: field.key,
          label: field.label,
          fieldType: field.fieldType,
          mandatory: field.mandatory ?? false,
          fieldOptionsJson: optionsJson,
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
          fieldOptionsJson: optionsJson,
          enabled: true,
          sortOrder: field.sortOrder,
          updatedAt: now,
        },
      });
    }
  }

  console.log(`[public-site-forms-seed] Upserted ${PUBLIC_SITE_FORMS.length} public_site form(s).`);
}
