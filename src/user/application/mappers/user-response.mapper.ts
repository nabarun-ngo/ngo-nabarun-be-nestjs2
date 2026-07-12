import { User } from '../../domain/aggregates/user/user.aggregate';
import {
  AddressDto,
  PhoneNumberDto,
  SocialLinkDto,
  UserResponseDto,
} from '../dtos/user-response.dto';

export class UserResponseMapper {
  static toDto(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.idpSub = user.idpSub;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.fullName = user.fullName;
    dto.initials = user.initials;
    dto.title = user.title;
    dto.middleName = user.middleName;
    dto.dateOfBirth = user.dateOfBirth;
    dto.gender = user.gender;
    dto.about = user.about;
    dto.picture = user.picture;
    dto.status = user.status;
    dto.isProfileComplete = user.isProfileComplete;
    dto.isPublic = user.isPublic;
    dto.isSameAddress = user.isSameAddress;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    if (user.primaryPhone) {
      const p = user.primaryPhone;
      dto.primaryPhone = {
        phoneCode: p.phoneCode,
        phoneNumber: p.phoneNumber,
        hidden: p.hidden,
        isPrimary: true,
      } satisfies PhoneNumberDto;
    }
    if (user.secondaryPhone) {
      const p = user.secondaryPhone;
      dto.secondaryPhone = {
        phoneCode: p.phoneCode,
        phoneNumber: p.phoneNumber,
        hidden: p.hidden,
        isPrimary: false,
      } satisfies PhoneNumberDto;
    }
    if (user.presentAddress) {
      const a = user.presentAddress;
      dto.presentAddress = {
        addressType: 'PRESENT',
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2,
        addressLine3: a.addressLine3,
        hometown: a.hometown,
        zipCode: a.zipCode,
        state: a.state,
        district: a.district,
        country: a.country,
      } satisfies AddressDto;
    }
    if (user.permanentAddress) {
      const a = user.permanentAddress;
      dto.permanentAddress = {
        addressType: 'PERMANENT',
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2,
        addressLine3: a.addressLine3,
        hometown: a.hometown,
        zipCode: a.zipCode,
        state: a.state,
        district: a.district,
        country: a.country,
      } satisfies AddressDto;
    }
    dto.socialMediaLinks = user.socialMediaLinks.map(
      (l): SocialLinkDto => ({
        id: l.id,
        linkName: l.linkName,
        linkType: l.linkType,
        linkValue: l.linkValue,
      }),
    );
    return dto;
  }
}
