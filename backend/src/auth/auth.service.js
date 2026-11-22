import { prisma } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { DEMO_ADMIN, DEMO_LECTURER, DEMO_STUDENT } from '../seed/demo-accounts.js';

// The only user fields the API returns
const userFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  title: true,
  role: true,
};

export async function listMockUsers() {
  const users = await prisma.user.findMany({
    select: userFields,
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
  });

  // The three demo accounts in a fixed order: student, lecturer, admin (only those that exist)
  const featured = [];
  for (const demoAccount of [DEMO_STUDENT, DEMO_LECTURER, DEMO_ADMIN]) {
    const user = users.find((candidate) => candidate.id === demoAccount.id);
    if (user) {
      featured.push(user);
    }
  }

  return { featured, users };
}

export async function loginWithMockUser(userId) {
  const user = await getUserById(userId);
  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
  }
  return user;
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: userFields,
  });
}
