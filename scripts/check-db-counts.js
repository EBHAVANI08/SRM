const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const students = await p.student.count()
  const staff = await p.staff.count()
  const teachers = await p.staff.count({ where: { designation: { in: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } } })
  const teacherUsers = await p.user.count({ where: { role: 'TEACHER' } })
  console.log(JSON.stringify({ students, staff, teachers, teacherUsers }, null, 2))
  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
