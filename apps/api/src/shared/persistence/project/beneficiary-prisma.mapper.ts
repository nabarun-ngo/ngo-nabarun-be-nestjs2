import { Prisma } from '../prisma/client';
import { Beneficiary } from '../../../internal/project/domain/aggregates/beneficiary/beneficiary.aggregate';
import { BeneficiaryGender, BeneficiaryStatus, BeneficiaryType } from '../../../internal/project/domain/enums/beneficiary.enum';
import { MapperUtils } from '../finance/mapper-utils';

export class BeneficiaryPrismaMapper {
  static toDomain(p: Prisma.BeneficiaryGetPayload<object> | null): Beneficiary | null {
    if (!p) return null;
    return Beneficiary.rehydrate(p.id, {
      projectId: p.projectId, name: p.name, type: p.type as BeneficiaryType,
      gender: MapperUtils.nullToUndefined(p.gender) as BeneficiaryGender | undefined,
      age: MapperUtils.nullToUndefined(p.age), dateOfBirth: MapperUtils.nullToUndefined(p.dateOfBirth),
      contactNumber: MapperUtils.nullToUndefined(p.contactNumber), email: MapperUtils.nullToUndefined(p.email),
      address: MapperUtils.nullToUndefined(p.address), location: MapperUtils.nullToUndefined(p.location),
      category: MapperUtils.nullToUndefined(p.category), enrollmentDate: p.enrollmentDate,
      exitDate: MapperUtils.nullToUndefined(p.exitDate), status: p.status as BeneficiaryStatus,
      benefitsReceived: p.benefitsReceived, notes: MapperUtils.nullToUndefined(p.notes),
      metadata: p.metadata as Record<string, unknown> | undefined, createdAt: p.createdAt, updatedAt: p.updatedAt,
    });
  }
  static toCreate(d: Beneficiary): Prisma.BeneficiaryUncheckedCreateInput {
    return {
      id: d.id, projectId: d.projectId, name: d.name, type: d.type,
      gender: MapperUtils.undefinedToNull(d.gender), age: MapperUtils.undefinedToNull(d.age),
      dateOfBirth: MapperUtils.undefinedToNull(d.dateOfBirth), contactNumber: MapperUtils.undefinedToNull(d.contactNumber),
      email: MapperUtils.undefinedToNull(d.email), address: MapperUtils.undefinedToNull(d.address),
      location: MapperUtils.undefinedToNull(d.location), category: MapperUtils.undefinedToNull(d.category),
      enrollmentDate: d.enrollmentDate, exitDate: MapperUtils.undefinedToNull(d.exitDate), status: d.status,
      benefitsReceived: d.benefitsReceived, notes: MapperUtils.undefinedToNull(d.notes),
      metadata: d.metadata as Prisma.InputJsonValue,
    };
  }
  static toUpdate(d: Beneficiary): Prisma.BeneficiaryUncheckedUpdateInput {
    return {
      name: d.name, type: d.type, gender: MapperUtils.undefinedToNull(d.gender), age: MapperUtils.undefinedToNull(d.age),
      dateOfBirth: MapperUtils.undefinedToNull(d.dateOfBirth), contactNumber: MapperUtils.undefinedToNull(d.contactNumber),
      email: MapperUtils.undefinedToNull(d.email), address: MapperUtils.undefinedToNull(d.address),
      location: MapperUtils.undefinedToNull(d.location), category: MapperUtils.undefinedToNull(d.category),
      exitDate: MapperUtils.undefinedToNull(d.exitDate), status: d.status, benefitsReceived: d.benefitsReceived,
      notes: MapperUtils.undefinedToNull(d.notes), metadata: d.metadata as Prisma.InputJsonValue, updatedAt: new Date(),
    };
  }
}
