const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const auditCount = await p.auditLog.count()
  const commCount = await p.communicationLog.count()
  const recentAudits = await p.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { action: true, module: true, description: true, createdAt: true } })
  const recentComms = await p.communicationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { channel: true, subject: true, status: true, recipientContact: true, createdAt: true } })
  console.log(JSON.stringify({ auditCount, commCount, recentAudits, recentComms }, null, 2))
  await p.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
