import { UserStatus } from '../../domain/enums/user-status.enum';

export interface PhoneNumberDto {
  phoneCode: string;
  phoneNumber: string;
  hidden: boolean;
  isPrimary: boolean;
}

export interface AddressDto {
  addressType: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  hometown: string;
  zipCode: string;
  state: string;
  district: string;
  country: string;
}

export interface SocialLinkDto {
  id: string;
  linkName: string;
  linkType: string;
  linkValue: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  idpSub?: string;
  firstName!: string;
  lastName!: string;
  fullName!: string;
  initials!: string;
  title?: string;
  middleName?: string;
  dateOfBirth?: Date;
  gender?: string;
  about?: string;
  picture?: string;
  status!: UserStatus;
  isProfileComplete!: boolean;
  isPublic!: boolean;
  isSameAddress?: boolean;
  primaryPhone?: PhoneNumberDto;
  secondaryPhone?: PhoneNumberDto;
  presentAddress?: AddressDto;
  permanentAddress?: AddressDto;
  socialMediaLinks!: SocialLinkDto[];
  createdAt?: Date;
  updatedAt?: Date;
  /** Missing fields returned only by GetMyProfileHandler for the complete-profile form. */
  missingFields?: string[];
}

export class UserListResponseDto {
  items!: UserResponseDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}

export class UserRefDataResponseDto {
  userStatuses!: string[];
  userTitles!: { key: string; value: string }[];
  userGenders!: { key: string; value: string }[];
  documentTypes!: { key: string; value: string }[];
  countries!: { key: string; value: string }[];
  states!: { key: string; value: string; countryCode?: string }[];
  districts!: { key: string; value: string; stateCode?: string }[];
  phoneCodes!: { key: string; value: string }[];
  availableRoles!: { key: string; value: string }[];
}
