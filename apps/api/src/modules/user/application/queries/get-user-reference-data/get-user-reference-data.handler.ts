import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUserReferenceDataPort } from '../../ports/user-reference-data.port';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { UserRefDataResponseDto } from '../../dtos/user-response.dto';
import { GetUserReferenceDataQuery } from './get-user-reference-data.query';

@QueryHandler(GetUserReferenceDataQuery)
@Injectable()
export class GetUserReferenceDataHandler
  implements IQueryHandler<GetUserReferenceDataQuery, UserRefDataResponseDto>
{
  constructor(
    @Inject(IUserReferenceDataPort)
    private readonly refDataPort: IUserReferenceDataPort,
  ) {}

  async execute(query: GetUserReferenceDataQuery): Promise<UserRefDataResponseDto> {
    const [titles, genders, documentTypes, countries, states, districts, phoneCodes, availableRoles] =
      await Promise.all([
        this.refDataPort.getTitles(),
        this.refDataPort.getGenders(),
        this.refDataPort.getDocumentTypes(),
        this.refDataPort.getCountries(),
        this.refDataPort.getStates(query.countryCode ?? ''),
        this.refDataPort.getDistricts(query.countryCode ?? '', query.stateCode ?? ''),
        this.refDataPort.getPhoneCodes(),
        this.refDataPort.getDisplayableRoles(),
      ]);

    const dto = new UserRefDataResponseDto();
    dto.userStatuses = Object.values(UserStatus);
    dto.userTitles = titles;
    dto.userGenders = genders;
    dto.documentTypes = documentTypes;
    dto.countries = countries;
    dto.states = states;
    dto.districts = districts;
    dto.phoneCodes = phoneCodes;
    dto.availableRoles = availableRoles;
    return dto;
  }
}
