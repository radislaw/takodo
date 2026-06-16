import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password.js'

const prisma = new PrismaClient()

async function main() {
  const email = process.env['SEED_USER_EMAIL'] ?? 'dev@takodo.local'
  const password = process.env['SEED_USER_PASSWORD'] ?? 'devpassword'
  const passwordHash = await hashPassword(password)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, emailVerified: new Date() },
    create: { email, passwordHash, emailVerified: new Date() },
  })

  console.log(`Seed user: ${user.email} (${user.id}) — login with SEED_USER_PASSWORD`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
