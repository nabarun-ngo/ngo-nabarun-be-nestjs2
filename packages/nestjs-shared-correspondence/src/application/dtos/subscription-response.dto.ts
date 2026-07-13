import { SubscriberType } from '../../domain/enums/subscriber-type.enum';
import { SubscribedVia } from '../../domain/enums/subscribed-via.enum';
import { ChannelType } from '../../domain/enums/channel-type.enum';
import { EmailRole } from '../../domain/enums/email-role.enum';

export class SubscriptionChannelDto {
  id: string;
  channel: ChannelType;
  enabled: boolean;
  emailRole?: EmailRole;
}

export class SubscriptionResponseDto {
  id: string;
  subscriberType: SubscriberType;
  userId?: string;
  userEmail?: string;
  userName?: string;
  roleName?: string;
  resourceType: string;
  resourceId?: string;
  subscribedVia: SubscribedVia;
  isActive: boolean;
  channels: SubscriptionChannelDto[];
  createdAt: Date;
  updatedAt: Date;
}
