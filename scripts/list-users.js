const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const users = await p.user.findMany({
    select: { email: true, role: true, name: true },
    take: 15,
  })
  console.log(JSON.stringify(users, null, 2))
  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
