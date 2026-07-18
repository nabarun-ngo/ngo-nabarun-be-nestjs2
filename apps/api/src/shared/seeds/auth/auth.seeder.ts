import { PrismaClient } from '../../persistence/prisma/client';
import { AUTH2_SEED } from './auth-seed.data';

export async function seedAuth(prisma: PrismaClient): Promise<void> {
  try {
    console.log('[auth-seeder] Starting auth seed...');

    const data = AUTH2_SEED;

    console.log(`[auth-seeder] Upserting ${data.permissions.length} permission(s)...`);
    for (const p of data.permissions) {
      console.log(`[auth-seeder]   permission: ${p.key}`);
      await prisma.authPermission.upsert({
        where: { key: p.key },
        update: { description: p.description ?? null },
        create: { key: p.key, description: p.description ?? null },
      });
    }

    console.log(`[auth-seeder] Upserting ${data.roles.length} role(s)...`);
    for (const r of data.roles) {
      console.log(`[auth-seeder]   role: ${r.key}`);
      await prisma.authRole.upsert({
        where: { key: r.key },
        update: { description: r.description ?? null },
        create: { key: r.key, description: r.description ?? null },
      });
    }

    console.log('[auth-seeder] Syncing role permissions and seed users...');
    for (const r of data.roles) {
      const role = await prisma.authRole.findUniqueOrThrow({ where: { key: r.key } });
      const perms = await prisma.authPermission.findMany({
        where: { key: { in: r.permissionKeys } },
      });
      console.log(`[auth-seeder]   role "${r.key}": syncing ${perms.length} permission(s)`);
      await prisma.$transaction([
        prisma.authRolePermission.deleteMany({ where: { roleId: role.id } }),
        prisma.authRolePermission.createMany({
          data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        }),
      ]);

      const existingSeeded = await prisma.authUserRole.findMany({
        where: { roleId: role.id, grantedBy: '__seeder__' },
        select: { id: true, idpSub: true },
      });
      const desiredSubs = new Set(r.seedUsers ?? []);
      const toDelete = existingSeeded
        .filter((row) => !desiredSubs.has(row.idpSub))
        .map((row) => row.id);
      const existingSubs = new Set(existingSeeded.map((row) => row.idpSub));
      const toCreate = [...desiredSubs].filter((sub) => !existingSubs.has(sub));
      console.log(
        `[auth-seeder]   role "${r.key}" seed users: +${toCreate.length} added, -${toDelete.length} removed`,
      );
      await prisma.$transaction([
        prisma.authUserRole.deleteMany({ where: { id: { in: toDelete } } }),
        prisma.authUserRole.createMany({
          data: toCreate.map((idpSub) => ({ idpSub, roleId: role.id, grantedBy: '__seeder__' })),
        }),
      ]);
    }

    const roleGroups = data.roleGroups ?? [];
    console.log(`[auth-seeder] Upserting ${roleGroups.length} role group(s)...`);
    for (const g of roleGroups) {
      console.log(`[auth-seeder]   group: ${g.key}`);
      await prisma.authRoleGroup.upsert({
        where: { key: g.key },
        update: { description: g.description ?? null },
        create: { key: g.key, description: g.description ?? null },
      });
    }

    console.log('[auth-seeder] Syncing role group roles and seed users...');
    for (const g of roleGroups) {
      const group = await prisma.authRoleGroup.findUniqueOrThrow({ where: { key: g.key } });
      const roles = await prisma.authRole.findMany({ where: { key: { in: g.roleKeys } } });
      console.log(`[auth-seeder]   group "${g.key}": syncing ${roles.length} role(s)`);
      await prisma.$transaction([
        prisma.authRoleGroupRole.deleteMany({ where: { groupId: group.id } }),
        prisma.authRoleGroupRole.createMany({
          data: roles.map((r) => ({ groupId: group.id, roleId: r.id })),
        }),
      ]);

      const existingSeeded = await prisma.authUserRoleGroup.findMany({
        where: { groupId: group.id, grantedBy: '__seeder__' },
        select: { id: true, idpSub: true },
      });
      const desiredSubs = new Set(g.seedUsers ?? []);
      const toDelete = existingSeeded
        .filter((row) => !desiredSubs.has(row.idpSub))
        .map((row) => row.id);
      const existingSubs = new Set(existingSeeded.map((row) => row.idpSub));
      const toCreate = [...desiredSubs].filter((sub) => !existingSubs.has(sub));
      console.log(
        `[auth-seeder]   group "${g.key}" seed users: +${toCreate.length} added, -${toDelete.length} removed`,
      );
      await prisma.$transaction([
        prisma.authUserRoleGroup.deleteMany({ where: { id: { in: toDelete } } }),
        prisma.authUserRoleGroup.createMany({
          data: toCreate.map((idpSub) => ({
            idpSub,
            groupId: group.id,
            grantedBy: '__seeder__',
          })),
        }),
      ]);
    }

    console.log('[auth-seeder] Done.');
  } catch (error) {
    console.log('[auth-seeder] Failed.');
    console.error(error);
  }
}
