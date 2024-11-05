import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  await hashPassword("test");
  console.log("Creating admin");
  const admin = await prisma.user.upsert({
    where: { username: 'danidani'},
    update: {},
    create: {
      firstname: 'dani',
      lastname: 'mardani',
      username: 'danidani',
      hashedPassword: await hashPassword('admin'),
      email: 'admin@gmail.com',
      role: "admin",
      phoneNumber: '+1234567890',
    },
  })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })