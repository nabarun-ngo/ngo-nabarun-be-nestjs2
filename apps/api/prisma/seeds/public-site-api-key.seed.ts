import { ApiKey } from '@ce/nestjs-shared-auth/domain/aggregates/api-key/api-key.aggregate';
import { hashText } from '@ce/nestjs-shared-core';
import { randomUUID } from 'crypto';
import type { PrismaClient } from '../../generated/prisma/client';

const PUBLIC_SITE_API_KEY_NAME = 'public-site-build';

export async function seedPublicSiteApiKey(prisma: PrismaClient): Promise<void> {
  const rawKey = process.env.PUBLIC_SITE_BUILD_API_KEY?.trim();
  if (!rawKey) {
    console.log(
      '[public-site-api-key-seed] Skipped — set PUBLIC_SITE_BUILD_API_KEY to seed a build-time API key.',
    );
    return;
  }

  const keyId = ApiKey.fetchKeyId(rawKey);
  if (!keyId) {
    throw new Error(
      '[public-site-api-key-seed] PUBLIC_SITE_BUILD_API_KEY must use the sk_<keyId>_... format.',
    );
  }

  const hashed = await hashText(rawKey);
  const existing = await prisma.authApiKey.findFirst({
    where: { name: PUBLIC_SITE_API_KEY_NAME },
    select: { id: true },
  });

  if (existing) {
    await prisma.authApiKey.update({
      where: { id: existing.id },
      data: {
        apiKey: hashed,
        apiKeyId: keyId,
        permissions: [],
        expiresAt: null,
      },
    });
    console.log('[public-site-api-key-seed] Updated existing public-site build API key.');
    return;
  }

  await prisma.authApiKey.create({
    data: {
      id: randomUUID(),
      name: PUBLIC_SITE_API_KEY_NAME,
      apiKey: hashed,
      apiKeyId: keyId,
      permissions: [],
      createdBy: '__seeder__',
    },
  });
  console.log('[public-site-api-key-seed] Created public-site build API key.');
}
