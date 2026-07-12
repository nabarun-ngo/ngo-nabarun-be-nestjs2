import { randomUUID } from 'crypto';
import { BaseDomain } from 'nestjs-shared/core';

export interface SocialLinkProps {
  linkName: string;
  linkType: string;
  linkValue: string;
}

export class SocialLink extends BaseDomain<string> {
  #linkName: string;
  #linkType: string;
  #linkValue: string;

  private constructor(
    id: string,
    linkName: string,
    linkType: string,
    linkValue: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#linkName = linkName;
    this.#linkType = linkType;
    this.#linkValue = linkValue;
  }

  static create(linkName: string, linkType: string, linkValue: string): SocialLink {
    return new SocialLink(randomUUID(), linkName, linkType, linkValue);
  }

  static rehydrate(
    id: string,
    linkName: string,
    linkType: string,
    linkValue: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): SocialLink {
    return new SocialLink(id, linkName, linkType, linkValue, createdAt, updatedAt);
  }

  update(props: Partial<SocialLinkProps>): void {
    if (props.linkName !== undefined) this.#linkName = props.linkName;
    if (props.linkValue !== undefined) this.#linkValue = props.linkValue;
    this.touch();
  }

  get linkName(): string {
    return this.#linkName;
  }

  get linkType(): string {
    return this.#linkType;
  }

  get linkValue(): string {
    return this.#linkValue;
  }
}
