import { Form } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/aggregates/form/form.aggregate';
import { FormFieldDefinition } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/entities/form-field-definition/form-field-definition.entity';
import { CustomFieldType } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/enums/custom-field-type.enum';
import { FormStatus } from '@nabarun-ngo/nestjs-shared-custom-forms/domain/enums/form-status.enum';
import { GetFormDefinitionHandler } from './get-form-definition.handler';
import { GetFormDefinitionQuery } from './get-form-definition.query';
import { PublicFormValidatorService } from '../../services/public-form-validator.service';

describe('GetFormDefinitionHandler', () => {
  it('returns public form id and maps field types for workflow aliases', async () => {
    const field = new FormFieldDefinition(
      'field-email',
      'form-1',
      'email',
      'Email',
      CustomFieldType.Email,
      true,
      [],
      false,
      false,
      true,
      0,
      null,
      null,
    );
    const form = new Form(
      'form-1',
      'workflow',
      'CONTACT_REQUEST:request',
      'Contact',
      'Contact form',
      FormStatus.Published,
      [],
      [],
      [],
      [field],
    );

    const validator = {
      loadPublishedForm: jest.fn().mockResolvedValue(form),
    } as unknown as PublicFormValidatorService;

    const handler = new GetFormDefinitionHandler(validator);
    const result = await handler.execute(new GetFormDefinitionQuery('contact'));

    expect(validator.loadPublishedForm).toHaveBeenCalledWith('contact');
    expect(result.id).toBe('contact');
    expect(result.key).toBe('contact');
    expect(result.fields[0]?.fieldType).toBe('EMAIL');
  });
});
