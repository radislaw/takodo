import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env['SEED_USER_EMAIL'] ?? 'dev@tootoo.local'

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  })

  console.log(`Seed user: ${user.email} (${user.id})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
