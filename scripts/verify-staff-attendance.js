const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  // 1. Count all staff attendance records
  const totalCount = await p.staffAttendance.count()
  console.log(`\n=== Total StaffAttendance records: ${totalCount} ===\n`)

  // 2. Count records for TODAY (the ones substitution detect needs)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const todayCount = await p.staffAttendance.count({
    where: { date: { gte: today, lt: tomorrow } }
  })
  console.log(`=== StaffAttendance records for TODAY (${today.toDateString()}): ${todayCount} ===\n`)

  // 3. Breakdown by status for today
  const absentToday = await p.staffAttendance.count({ where: { date: { gte: today, lt: tomorrow }, status: 'ABSENT' } })
  const onLeaveToday = await p.staffAttendance.count({ where: { date: { gte: today, lt: tomorrow }, status: 'ON_LEAVE' } })
  const presentToday = await p.staffAttendance.count({ where: { date: { gte: today, lt: tomorrow }, status: 'PRESENT' } })
  const lateToday = await p.staffAttendance.count({ where: { date: { gte: today, lt: tomorrow }, status: 'LATE' } })
  console.log(`  ABSENT today: ${absentToday}`)
  console.log(`  ON_LEAVE today: ${onLeaveToday}`)
  console.log(`  PRESENT today: ${presentToday}`)
  console.log(`  LATE today: ${lateToday}`)

  // 4. List the actual absent/on-leave records with staff names
  const absentRecords = await p.staffAttendance.findMany({
    where: { date: { gte: today, lt: tomorrow }, status: { in: ['ABSENT', 'ON_LEAVE'] } },
    include: { staff: { select: { fullName: true, department: true, subjectSpecialization: true, designation: true } } },
    take: 20,
  })
  console.log(`\n=== Absent/On-Leave teachers today (first 20) ===`)
  for (const r of absentRecords) {
    console.log(`  [${r.status}] ${r.staff.fullName} — ${r.staff.department} / ${r.staff.subjectSpecialization || 'N/A'} (${r.staff.designation})`)
    console.log(`       remark: ${r.remark || 'N/A'}`)
  }

  // 5. Verify these absent teachers have timetable entries for today's day-of-week
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  console.log(`\n=== Today is ${dayName} — checking timetable coverage for absent teachers ===`)
  let withTimetable = 0
  let withoutTimetable = 0
  for (const r of absentRecords) {
    const ttCount = await p.timetable.count({
      where: { staffId: r.staffId, day: dayName, isBreak: false }
    })
    if (ttCount > 0) {
      withTimetable++
      console.log(`  ✓ ${r.staff.fullName}: ${ttCount} periods on ${dayName}`)
    } else {
      withoutTimetable++
      console.log(`  ✗ ${r.staff.fullName}: no timetable for ${dayName}`)
    }
  }
  console.log(`\n  Absent teachers WITH timetable today: ${withTimetable}`)
  console.log(`  Absent teachers WITHOUT timetable today: ${withoutTimetable}`)

  // 6. Cross-check LeaveRequest (approved, covering today)
  const approvedLeavesToday = await p.leaveRequest.count({
    where: { status: 'APPROVED', staffId: { not: null }, startDate: { lte: today }, endDate: { gte: today } }
  })
  console.log(`\n=== APPROVED LeaveRequests covering today: ${approvedLeavesToday} ===`)

  // 7. Sample 3 leave requests to verify the EMERGENCY ones exist
  const allLeaves = await p.leaveRequest.findMany({ take: 15, include: { staff: { select: { fullName: true } } } })
  console.log(`\n=== Sample leave requests (verifying EMERGENCY ones) ===`)
  for (const l of allLeaves.slice(0, 5)) {
    console.log(`  [${l.leaveType}] ${l.staff?.fullName || 'N/A'} — status: ${l.status} — reason: "${l.reason || '(empty — emergency)'}"`)
  }
  const emergencyLeaves = allLeaves.filter(l => l.leaveType === 'EMERGENCY')
  console.log(`\n  EMERGENCY leaves found: ${emergencyLeaves.length}`)
  for (const l of emergencyLeaves) {
    console.log(`    - ${l.staff?.fullName}: reason="${l.reason}" (empty means no info as per spec)`)
  }

  await p.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
