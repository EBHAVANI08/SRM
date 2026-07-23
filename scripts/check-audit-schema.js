const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  try {
    const count = await p.auditLog.count()
    console.log('AuditLog count:', count)
    // Try creating a test entry
    const entry = await p.auditLog.create({
      data: {
        action: 'TEST',
        module: 'TEST',
        description: 'Test audit entry',
      }
    })
    console.log('Test entry created:', entry.id)
    const count2 = await p.auditLog.count()
    console.log('AuditLog count after insert:', count2)
    // Clean up
    await p.auditLog.delete({ where: { id: entry.id } })
  } catch (e) {
    console.error('Error:', e.message)
  }
  await p.$disconnect()
}
main()
