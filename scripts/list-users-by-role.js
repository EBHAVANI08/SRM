const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Group by role
  const byRole = await p.user.groupBy({
    by: ['role'],
    _count: { _all: true },
  })
  console.log('Users by role:', JSON.stringify(byRole, null, 2))
  
  // Find non-teacher users
  const admins = await p.user.findMany({
    where: { role: { not: 'TEACHER' } },
    select: { email: true, role: true, name: true, password: true },
  })
  console.log('Non-teacher users:', JSON.stringify(admins, null, 2))
  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
