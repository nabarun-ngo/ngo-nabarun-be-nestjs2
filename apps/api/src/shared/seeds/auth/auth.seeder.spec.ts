import 'reflect-metadata';
import { seedAuth2 } from './auth.seeder';
import { Auth2SeedData } from './auth-seed.types';

function buildPrisma() {
  return {
    authPermission: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    authRole: {
      upsert: jest.fn().mockResolvedValue({}),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    authRolePermission: {
      deleteMany: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({}),
    },
    authUserRole: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({}),
    },
    authRoleGroup: {
      upsert: jest.fn().mockResolvedValue({}),
      findUniqueOrThrow: jest.fn(),
    },
    authRoleGroupRole: {
      deleteMany: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({}),
    },
    authUserRoleGroup: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

type MockPrisma = ReturnType<typeof buildPrisma>;

// ─────────────────────────────────────────────────────────────────────────────
// seedUsers — Role assignments (AuthUserRole)
// ─────────────────────────────────────────────────────────────────────────────

describe('seedAuth2 – seedUsers for roles', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = buildPrisma();
    prisma.authRole.findUniqueOrThrow.mockResolvedValue({ id: 'role-1', key: 'admin' });
  });

  function makeData(seedUsers?: string[]): Auth2SeedData {
    return {
      permissions: [],
      roles: [{ key: 'admin', permissionKeys: [], seedUsers }],
    };
  }

  it('creates user-role assignments for new seedUsers on first run', async () => {
    prisma.authUserRole.findMany.mockResolvedValue([]);

    await seedAuth2(prisma as any, makeData(['auth0|AAA', 'auth0|BBB']));

    expect(prisma.authUserRole.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { idpSub: 'auth0|AAA', roleId: 'role-1', grantedBy: '__seeder__' },
        { idpSub: 'auth0|BBB', roleId: 'role-1', grantedBy: '__seeder__' },
      ]),
    });
    expect(prisma.authUserRole.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [] } } });
  });

  it('does not duplicate existing seeder assignments on re-run with same seedUsers', async () => {
    prisma.authUserRole.findMany.mockResolvedValue([{ id: 'uur-1', idpSub: 'auth0|AAA' }]);

    await seedAuth2(prisma as any, makeData(['auth0|AAA']));

    expect(prisma.authUserRole.createMany).toHaveBeenCalledWith({ data: [] });
    expect(prisma.authUserRole.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [] } } });
  });

  it('removes old seeder assignment and adds new one when idpSub changes', async () => {
    prisma.authUserRole.findMany.mockResolvedValue([{ id: 'uur-old', idpSub: 'auth0|OLD' }]);

    await seedAuth2(prisma as any, makeData(['auth0|NEW']));

    expect(prisma.authUserRole.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['uur-old'] } },
    });
    expect(prisma.authUserRole.createMany).toHaveBeenCalledWith({
      data: [{ idpSub: 'auth0|NEW', roleId: 'role-1', grantedBy: '__seeder__' }],
    });
  });

  it('removes all seeder assignments when seedUsers becomes empty', async () => {
    prisma.authUserRole.findMany.mockResolvedValue([{ id: 'uur-1', idpSub: 'auth0|AAA' }]);

    await seedAuth2(prisma as any, makeData([]));

    expect(prisma.authUserRole.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['uur-1'] } },
    });
    expect(prisma.authUserRole.createMany).toHaveBeenCalledWith({ data: [] });
  });

  it('queries only __seeder__-stamped rows when computing the diff', async () => {
    await seedAuth2(prisma as any, makeData(['auth0|AAA']));

    expect(prisma.authUserRole.findMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1', grantedBy: '__seeder__' },
      select: { id: true, idpSub: true },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// seedUsers — Role Group assignments (AuthUserRoleGroup)
// ─────────────────────────────────────────────────────────────────────────────

describe('seedAuth2 – seedUsers for roleGroups', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = buildPrisma();
    prisma.authRoleGroup.findUniqueOrThrow.mockResolvedValue({ id: 'group-1', key: 'ops' });
  });

  function makeData(seedUsers?: string[]): Auth2SeedData {
    return {
      permissions: [],
      roles: [],
      roleGroups: [{ key: 'ops', roleKeys: [], seedUsers }],
    };
  }

  it('creates user-role-group assignments for new seedUsers on first run', async () => {
    prisma.authUserRoleGroup.findMany.mockResolvedValue([]);

    await seedAuth2(prisma as any, makeData(['auth0|AAA', 'auth0|BBB']));

    expect(prisma.authUserRoleGroup.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { idpSub: 'auth0|AAA', groupId: 'group-1', grantedBy: '__seeder__' },
        { idpSub: 'auth0|BBB', groupId: 'group-1', grantedBy: '__seeder__' },
      ]),
    });
    expect(prisma.authUserRoleGroup.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [] } } });
  });

  it('does not duplicate existing seeder assignments on re-run with same seedUsers', async () => {
    prisma.authUserRoleGroup.findMany.mockResolvedValue([{ id: 'urg-1', idpSub: 'auth0|AAA' }]);

    await seedAuth2(prisma as any, makeData(['auth0|AAA']));

    expect(prisma.authUserRoleGroup.createMany).toHaveBeenCalledWith({ data: [] });
    expect(prisma.authUserRoleGroup.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [] } } });
  });

  it('removes old seeder assignment and adds new one when idpSub changes', async () => {
    prisma.authUserRoleGroup.findMany.mockResolvedValue([{ id: 'urg-old', idpSub: 'auth0|OLD' }]);

    await seedAuth2(prisma as any, makeData(['auth0|NEW']));

    expect(prisma.authUserRoleGroup.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['urg-old'] } },
    });
    expect(prisma.authUserRoleGroup.createMany).toHaveBeenCalledWith({
      data: [{ idpSub: 'auth0|NEW', groupId: 'group-1', grantedBy: '__seeder__' }],
    });
  });

  it('removes all seeder assignments when seedUsers becomes empty', async () => {
    prisma.authUserRoleGroup.findMany.mockResolvedValue([{ id: 'urg-1', idpSub: 'auth0|AAA' }]);

    await seedAuth2(prisma as any, makeData([]));

    expect(prisma.authUserRoleGroup.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['urg-1'] } },
    });
    expect(prisma.authUserRoleGroup.createMany).toHaveBeenCalledWith({ data: [] });
  });

  it('queries only __seeder__-stamped rows when computing the diff', async () => {
    await seedAuth2(prisma as any, makeData(['auth0|AAA']));

    expect(prisma.authUserRoleGroup.findMany).toHaveBeenCalledWith({
      where: { groupId: 'group-1', grantedBy: '__seeder__' },
      select: { id: true, idpSub: true },
    });
  });
});
