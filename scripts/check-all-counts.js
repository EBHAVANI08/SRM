const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const models = ['student','staff','parent','fee','feeInstallment','examScore','timetable','class','leaveRequest','staffAttendance','user','eventLog','communicationLog','reportCard','substitution']
  for (const m of models) {
    try {
      const count = await p[m].count()
      console.log(`  ${m}: ${count}`)
    } catch (e) {
      console.log(`  ${m}: (model not found)`)
    }
  }
  await p.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
