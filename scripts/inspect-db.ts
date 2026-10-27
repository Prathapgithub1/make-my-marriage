import { prisma } from '../apps/api/src/infrastructure/database/pool';

async function main() {
  if (!prisma) {
    console.error('Prisma client could not connect. Check DATABASE_URL in .env.');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const sessions = await prisma.session.findMany({
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const resetTokens = await prisma.passwordResetToken.findMany({
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('\n================== DATABASE SNAPSHOT ==================');
  console.log(`\n--- USERS (Latest ${users.length}) ---`);
  if (users.length === 0) console.log('(No users found)');
  else console.table(users);

  console.log(`\n--- SESSIONS (Latest ${sessions.length}) ---`);
  if (sessions.length === 0) console.log('(No active/historical sessions)');
  else console.table(sessions);

  console.log(`\n--- PASSWORD RESET TOKENS (Latest ${resetTokens.length}) ---`);
  if (resetTokens.length === 0) console.log('(No reset tokens)');
  else console.table(resetTokens);
  console.log('=======================================================\n');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to query database:', err);
  process.exit(1);
});
