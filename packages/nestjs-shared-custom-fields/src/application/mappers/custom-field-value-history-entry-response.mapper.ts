import { CustomFieldValueHistoryEntry } from '../../domain/entities/custom-field-value-history-entry/custom-field-value-history-entry.entity';
import { CustomFieldValueHistoryEntryResponseDto } from '../dtos/response/custom-field-response.dtos';

export class CustomFieldValueHistoryEntryResponseMapper {
  static toDto(
    entry: CustomFieldValueHistoryEntry,
    fieldKey: string,
  ): CustomFieldValueHistoryEntryResponseDto {
    const dto = new CustomFieldValueHistoryEntryResponseDto();
    dto.id         = entry.id;
    dto.fieldDefId = entry.fieldDefId;
    dto.fieldKey   = fieldKey;
    dto.entityType = entry.entityType;
    dto.entityId   = entry.entityId;
    dto.oldValue   = entry.oldValue;
    dto.newValue   = entry.newValue;
    dto.changedBy  = entry.changedBy;
    dto.changedAt  = entry.createdAt;
    return dto;
  }
}
