import { SetMetadata } from '@nestjs/common';
import { REQUIRE_PERMISSIONS_KEY, REQUIRE_ALL_PERMISSIONS_KEY } from '../../application/constants/permission-keys.constants';

export { REQUIRE_PERMISSIONS_KEY, REQUIRE_ALL_PERMISSIONS_KEY };

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);

export const RequireAllPermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, permissions);
