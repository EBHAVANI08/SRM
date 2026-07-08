/**
 * Audit chain tamper-detection test — directly mutates an entry in the DB
 * (simulating an attacker editing the audit log), then re-verifies.
 *
 * Usage: bun run scripts/tamper-audit-test.js
 */
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  // Get the 3rd audit entry (one in the middle of the chain)
  const entries = await p.safetyAuditLog.findMany({
    orderBy: { createdAt: 'asc' },
    take: 5,
  })
  console.log(`Found ${entries.length} entries`)
  if (entries.length < 3) {
    console.log('Not enough entries to test tamper detection — need at least 3')
    return
  }

  const tamperTarget = entries[2] // middle of the chain
  console.log(`\nTampering with entry ${tamperTarget.id}`)
  console.log(`  Before: action=${tamperTarget.action}, actorId=${tamperTarget.actorId}`)

  // Mutate the payload (simulating an attacker covering their tracks)
  const originalPayload = tamperTarget.payload
  const tamperedPayload = JSON.stringify({
    ...JSON.parse(originalPayload),
    tampered: true,
    sneakyEdit: 'attacker was here',
  })

  await p.safetyAuditLog.update({
    where: { id: tamperTarget.id },
    data: {
      payload: tamperedPayload,
      action: 'SNEAKY_ACTION', // attacker tries to change the action too
    },
  })
  console.log(`  After:  action=SNEAKY_ACTION, payload includes "tampered:true"`)
  console.log(`\nNow run /api/safety/audit-log/verify — it should return valid:false`)

  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
