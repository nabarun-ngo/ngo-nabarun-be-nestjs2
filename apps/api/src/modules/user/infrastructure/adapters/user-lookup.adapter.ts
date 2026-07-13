import { Inject, Injectable } from '@nestjs/common';
import { IUserLookupPort, UserInfo } from '@ce/nestjs-shared-core';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/aggregates/user/user.aggregate';

@Injectable()
export class UserLookupAdapter implements IUserLookupPort {
  constructor(
    @Inject(IUserRepository) private readonly repo: IUserRepository,
  ) {}

  async findById(id: string): Promise<UserInfo | null> {
    const user = await this.repo.findById(id);
    return user ? this.toUserInfo(user) : null;
  }

  async findByIds(ids: string[]): Promise<UserInfo[]> {
    const users = await this.repo.findByIds(ids);
    return users.map((u) => this.toUserInfo(u));
  }

  async findByIdPSub(idpSub: string): Promise<UserInfo | null> {
    const user = await this.repo.findByIdPSub(idpSub);
    return user ? this.toUserInfo(user, idpSub) : null;
  }

  async findByIdPSubs(idpSubs: string[]): Promise<UserInfo[]> {
    const users = await this.repo.findByIdPSubs(idpSubs);
    return users.map((u) => this.toUserInfo(u, u.idpSub));
  }

  private toUserInfo(user: User, idpSub?: string): UserInfo {
    return {
      id: user.id,
      ...(idpSub !== undefined ? { idpSub } : {}),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      attributes: new Map([
        ['profile_complete', user.isProfileComplete],
      ]),
    };
  }
}
