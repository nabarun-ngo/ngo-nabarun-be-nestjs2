import { BadRequestException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Form } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/aggregates/form/form.aggregate';
import { FormFieldDefinition } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/entities/form-field-definition/form-field-definition.entity';
import { CustomFieldType } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/enums/custom-field-type.enum';
import { FormStatus } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/enums/form-status.enum';
import { IFormRepository } from '@nabarun-ngo/nestjs-shared-custom-forms';
import { PublicFormValidatorService } from './public-form-validator.service';

function makeForm(fields: FormFieldDefinition[]): Form {
  return new Form(
    'form-1',
    'public_site',
    'drawing-competition-registration',
    'Drawing Competition',
    null,
    FormStatus.Published,
    [],
    [],
    [],
    fields,
  );
}

function makeField(key: string, fieldType: CustomFieldType, mandatory = false): FormFieldDefinition {
  return new FormFieldDefinition(
    `field-${key}`,
    'form-1',
    key,
    key,
    fieldType,
    mandatory,
    [],
    false,
    false,
    true,
    0,
    null,
    null,
  );
}

describe('PublicFormValidatorService', () => {
  let repo: jest.Mocked<Pick<IFormRepository, 'findByKey'>>;
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let service: PublicFormValidatorService;

  beforeEach(() => {
    repo = { findByKey: jest.fn() };
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    queryBus = {
      execute: jest.fn().mockResolvedValue({
        valid: true,
        missingMandatory: [],
        validationViolations: [],
        conditionViolations: [],
      }),
    };
    service = new PublicFormValidatorService(
      repo as unknown as IFormRepository,
      commandBus as unknown as CommandBus,
      queryBus as unknown as QueryBus,
    );
  });

  it('rejects unknown submitted fields', () => {
    const form = makeForm([makeField('name', CustomFieldType.Text, true)]);
    expect(() => service.sanitizeAndCoerce(form, { name: 'Ada', extra: 'x' })).toThrow(
      BadRequestException,
    );
  });

  it('coerces numeric strings for NUMBER fields', () => {
    const form = makeForm([makeField('age', CustomFieldType.Number)]);
    const values = service.sanitizeAndCoerce(form, { age: '12' });
    expect(values.age).toBe(12);
  });

  it('rejects non-numeric strings for NUMBER fields', () => {
    const form = makeForm([makeField('age', CustomFieldType.Number)]);
    expect(() => service.sanitizeAndCoerce(form, { age: 'twelve' })).toThrow(BadRequestException);
  });

  it('loads published workflow forms via alias lookup key', async () => {
    const form = makeForm([makeField('email', CustomFieldType.Email, true)]);
    repo.findByKey.mockResolvedValue(form);

    const loaded = await service.loadPublishedForm('contact');

    expect(repo.findByKey).toHaveBeenCalledWith('workflow', 'CONTACT_REQUEST:request');
    expect(loaded).toBe(form);
  });
});
