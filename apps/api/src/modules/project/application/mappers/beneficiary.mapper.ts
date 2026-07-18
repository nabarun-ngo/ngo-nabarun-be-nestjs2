import { Beneficiary } from '../../domain/aggregates/beneficiary/beneficiary.aggregate';
import { BeneficiaryDetailDto } from '../dtos/beneficiary.dto';
export class BeneficiaryMapper {
  static toDto(b: Beneficiary): BeneficiaryDetailDto {
    return {
      id: b.id, projectId: b.projectId, name: b.name, type: b.type, gender: b.gender, age: b.age,
      dateOfBirth: b.dateOfBirth, contactNumber: b.contactNumber, email: b.email, address: b.address,
      location: b.location, category: b.category, enrollmentDate: b.enrollmentDate, exitDate: b.exitDate,
      status: b.status, benefitsReceived: b.benefitsReceived, notes: b.notes, metadata: b.metadata,
      createdAt: b.createdAt!, updatedAt: b.updatedAt!,
    };
  }
}
