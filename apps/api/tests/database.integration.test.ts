import { randomUUID } from 'node:crypto';
import { prisma } from '../src/infrastructure/database/pool';

const dbDescribe = process.env.RUN_DATABASE_INTEGRATION_TESTS === '1' ? describe : describe.skip;

dbDescribe('PostgreSQL auth persistence (explicit local integration run)', () => {
  const marker = randomUUID();
  const testEmail = `auth-test-${marker}@example.invalid`;
  const rateLimitKey = `test-${marker.replaceAll('-', '')}`;
  let userId: string | undefined;

  beforeAll(async () => {
    if (!prisma) throw new Error('DATABASE_URL is not configured for the integration test.');
    const [database] = await prisma.$queryRaw<
      Array<{ name: string }>
    >`SELECT current_database() AS name`;
    if (database.name !== 'makeMyMarriage-Dev') {
      throw new Error(
        'Refusing to run database integration tests unless DATABASE_URL targets makeMyMarriage-Dev.',
      );
    }
  });

  afterAll(async () => {
    if (!prisma) return;
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.authRateLimit.deleteMany({ where: { key: rateLimitKey } });
  });

  it('persists an account and session, enforces unique email, and safely parameterizes raw values', async () => {
    if (!prisma) throw new Error('Prisma is unavailable.');
    const user = await prisma.user.create({
      data: { email: testEmail, passwordHash: 'test-hash' },
    });
    userId = user.id;
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: marker.replaceAll('-', '').padEnd(64, 'a'),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await expect(
      prisma.user.create({ data: { email: testEmail, passwordHash: 'other-test-hash' } }),
    ).rejects.toMatchObject({ code: 'P2002' });

    const maliciousLookingValue = `${rateLimitKey}'); DROP TABLE users; --`;
    const rows = await prisma.$queryRaw<
      Array<{ value: string }>
    >`SELECT ${maliciousLookingValue}::text AS value`;
    const restoredSession = await prisma.session.findUnique({ where: { id: session.id } });

    expect(rows[0]?.value).toBe(maliciousLookingValue);
    expect(restoredSession?.userId).toBe(user.id);
  });
});
