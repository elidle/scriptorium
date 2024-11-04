const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/auth');

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin'},
    update: {},
    create: {
      firstname: 'Admin',
      lastname: 'Admin',
      username: 'admin',
      password: await hashPassword('admin'),
      email: 'admin@gmail.com',
    },
  })

  console.log({ admin })
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