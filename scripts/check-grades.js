const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const grades = await p.grade.findMany({ orderBy: { order: 'asc' }, include: { sections: true } })
  for (const g of grades) {
    console.log(`${g.name} (${g.level}, order=${g.order}) → sections: ${g.sections.map(s=>s.name).join(',')}`)
  }
  console.log(`\nTotal: ${grades.length} grades`)
  await p.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
