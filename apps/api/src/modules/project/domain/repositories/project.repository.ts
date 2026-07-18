import { BaseFilter, IRepository } from '@nabarun-ngo/nestjs-shared-core';
import { Project, ProjectFilter } from '../aggregates/project/project.aggregate';

export const IProjectRepository = Symbol('IProjectRepository');

export interface IProjectRepository extends IRepository<Project, string, ProjectFilter> {
  findByCode(code: string): Promise<Project | null>;
}
