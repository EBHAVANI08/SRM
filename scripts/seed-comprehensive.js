/**
 * Comprehensive sample data seeder for LearnX ERP.
 *
 * Target counts (per user spec):
 *   - 7,000 students        (already in DB — verify)
 *   - 150 teachers          (already in DB — verify)
 *   - 36 classes            (reduce from 60 to 36 active classes — keep first 36, mark rest inactive)
 *   - 1,500 parents         (NEW — create Parent + User records for 1500 students)
 *   - 800 fee records       (NEW — Fee records with mixed PAID/PARTIAL/PENDING/OVERDUE)
 *   - 300 exam results      (NEW — ExamScore records)
 *   - 320 timetable entries (NEW — fresh, focused set for substitution detection context)
 *   - 25 non-teaching staff (NEW — admin/finance/transport/library/canteen staff)
 *   - 15 teacher leaves     (NEW — 13 with varied reasons + 2 EMERGENCY with no info)
 *   - 15 staff-attendance ABSENT records for TODAY (so substitution detection has data to work on)
 *
 * Run: bun run scripts/seed-comprehensive.js
 */
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const FIRST_NAMES_M = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Rohan', 'Karan', 'Rahul', 'Amit', 'Suresh', 'Rajesh', 'Vikram', 'Arun', 'Nikhil', 'Varun']
const FIRST_NAMES_F = ['Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Aaradhya', 'Anika', 'Navya', 'Myra', 'Sara', 'Ira', 'Riya', 'Priya', 'Pooja', 'Kavya', 'Sneha', 'Nisha', 'Divya', 'Anjali', 'Bhavya', 'Charvi']
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Kumar', 'Singh', 'Rao', 'Joshi', 'Pillai', 'Das', 'Bose', 'Khan', 'Sheikh', 'Fernandes', 'DSouza', 'Pinto']

const PARENT_OCCUPATIONS = ['Software Engineer', 'Doctor', 'Teacher', 'Business', 'Government Employee', 'Banker', 'Lawyer', 'Engineer', 'Architect', 'Pharmacist', 'Civil Servant', 'Shop Owner']
const FEE_TYPES = ['TUITION', 'TRANSPORT', 'LAB', 'LIBRARY', 'EXAM', 'SPORTS', 'UNIFORM', 'BOOKS']
const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'NETBANKING', 'CHEQUE']
const NON_TEACHING_ROLES = [
  { designation: 'Office Manager', department: 'Administration' },
  { designation: 'Accountant', department: 'Finance' },
  { designation: 'Receptionist', department: 'Front Office' },
  { designation: 'Librarian', department: 'Library' },
  { designation: 'Lab Assistant', department: 'Science Lab' },
  { designation: 'Transport In-charge', department: 'Transport' },
  { designation: 'Canteen Manager', department: 'Canteen' },
  { designation: 'Security Officer', department: 'Security' },
  { designation: 'IT Support', department: 'IT' },
  { designation: 'Nurse', department: 'Health' },
]

const LEAVE_REASONS = [
  { leaveType: 'CASUAL', reason: 'Family function out of station' },
  { leaveType: 'SICK', reason: 'Fever and cold — doctor advised rest for 2 days' },
  { leaveType: 'EARNED', reason: 'Personal work — bank + passport renewal' },
  { leaveType: 'CASUAL', reason: 'Attending cousin wedding in Delhi' },
  { leaveType: 'SICK', reason: 'Migraine — unable to take classes' },
  { leaveType: 'STUDY', reason: 'Attending B.Ed refresher workshop' },
  { leaveType: 'CASUAL', reason: 'Vehicle breakdown — cannot commute' },
  { leaveType: 'SICK', reason: 'Stomach infection — on medication' },
  { leaveType: 'EARNED', reason: 'Annual family vacation pre-planned' },
  { leaveType: 'CASUAL', reason: 'Religious ceremony at home' },
  { leaveType: 'SICK', reason: 'Back pain — physiotherapy session scheduled' },
  { leaveType: 'STUDY', reason: 'Research paper submission deadline' },
  { leaveType: 'CASUAL', reason: 'Children school admission work' },
  // 2 EMERGENCY leaves with NO information (as per user spec)
  { leaveType: 'EMERGENCY', reason: '' },
  { leaveType: 'EMERGENCY', reason: '' },
]

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pad(n, w) { return String(n).padStart(w, '0') }

async function main() {
  console.log('🌱 Starting comprehensive seed…')

  // ============ 0. Ensure school + academic year ============
  let school = await p.school.findFirst()
  if (!school) {
    school = await p.school.create({ data: { id: 'school_default', name: 'LearnX International School', address: '100 Education Road', city: 'Bengaluru', state: 'Karnataka', phone: '+91 80 1234 5678', email: 'info@learnx.edu', totalStudents: 7000, totalStaff: 175 } })
  }
  let ay = await p.academicYear.findFirst({ where: { name: '2026-27' } })
  if (!ay) {
    ay = await p.academicYear.create({ data: { name: '2026-27', startDate: new Date('2026-06-01'), endDate: new Date('2027-04-30'), isActive: true } })
  }

  // ============ 1. Classes — keep first 36 active ============
  console.log('Ensuring 36 active class records…')
  const allClasses = await p.class.findMany({ orderBy: { id: 'asc' }, include: { section: { include: { grade: true } } } })
  // Mark all but the first 36 as inactive by deleting them (only 36 should remain)
  if (allClasses.length > 36) {
    const toRemove = allClasses.slice(36)
    console.log(`  Removing ${toRemove.length} excess class records (keeping 36)`)
    // Move students from removed classes to remaining classes
    const remainingClasses = allClasses.slice(0, 36)
    for (const cls of toRemove) {
      const studentsInClass = await p.student.findMany({ where: { classId: cls.id }, select: { id: true } })
      for (let i = 0; i < studentsInClass.length; i++) {
        const targetClass = remainingClasses[i % remainingClasses.length]
        await p.student.update({ where: { id: studentsInClass[i].id }, data: { classId: targetClass.id, sectionId: targetClass.sectionId } })
      }
      // Delete timetables for the removed class
      await p.timetable.deleteMany({ where: { classId: cls.id } })
      await p.class.delete({ where: { id: cls.id } })
    }
  }
  const finalClasses = await p.class.findMany({ include: { section: { include: { grade: true } } }, take: 36 })
  console.log(`  ✓ ${finalClasses.length} active classes`)

  // ============ 2. Non-teaching staff (25 records) ============
  console.log('Creating 25 non-teaching staff…')
  const adminUserId = (await p.user.findFirst({ where: { role: 'SUPER_ADMIN' } }))?.id || null
  let nonTeachingCount = 0
  for (let i = 0; i < 25; i++) {
    const role = NON_TEACHING_ROLES[i % NON_TEACHING_ROLES.length]
    const firstName = randomItem(i % 2 === 0 ? FIRST_NAMES_M : FIRST_NAMES_F)
    const lastName = randomItem(LAST_NAMES)
    const fullName = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@learnx.edu`
    const employeeId = `EMP-N-${pad(i + 1, 4)}`
    const phone = `+91 99${randomInt(100, 999)} ${randomInt(100000, 999999)}`

    const existing = await p.staff.findUnique({ where: { employeeId } })
    if (existing) continue

    const user = await p.user.upsert({
      where: { email },
      create: { email, password: 'demo1234', name: fullName, phone, role: 'ADMIN', isActive: true, createdById: adminUserId },
      update: {},
    })

    await p.staff.create({
      data: {
        employeeId,
        firstName, lastName, fullName,
        dob: new Date(randomInt(1975, 1995), randomInt(0, 11), randomInt(1, 28)),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        phone, email,
        address: `${randomInt(1, 999)}, Bengaluru`,
        designation: role.designation,
        department: role.department,
        joiningDate: new Date(randomInt(2015, 2025), randomInt(0, 11), randomInt(1, 28)),
        userId: user.id,
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        createdById: adminUserId,
      },
    })
    nonTeachingCount++
  }
  console.log(`  ✓ Created ${nonTeachingCount} non-teaching staff (total non-teaching: ${await p.staff.count({ where: { designation: { notIn: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } } })})`)

  // ============ 3. Timetable — fresh 320 entries ============
  console.log('Creating 320 fresh timetable entries…')
  const teachers = await p.staff.findMany({ where: { designation: { in: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } }, select: { id: true, subjectSpecialization: true } })
  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  const PERIODS = [
    { period: 1, start: '08:00', end: '08:45' },
    { period: 2, start: '08:45', end: '09:30' },
    { period: 3, start: '09:45', end: '10:30' },
    { period: 4, start: '10:30', end: '11:15' },
    { period: 5, start: '11:15', end: '12:00' },
    { period: 6, start: '12:45', end: '13:30' },
    { period: 7, start: '13:30', end: '14:15' },
    { period: 8, start: '14:15', end: '15:00' },
  ]
  const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education']

  // Clear existing timetables for the 36 active classes
  const activeClassIds = finalClasses.map(c => c.id)
  await p.timetable.deleteMany({ where: { classId: { in: activeClassIds } } })
  console.log('  Cleared old timetable entries for 36 active classes')

  let ttCount = 0
  const TARGET_TT = 320
  // Distribute 320 entries across 36 classes × 5 days × 8 periods (with teachers)
  // Strategy: for each of 36 classes, create ~9 entries spread across days/periods
  let teacherIdx = 0
  for (const cls of finalClasses) {
    if (ttCount >= TARGET_TT) break
    const entriesForThisClass = Math.min(9, TARGET_TT - ttCount)
    for (let e = 0; e < entriesForThisClass; e++) {
      const teacher = teachers[teacherIdx % teachers.length]
      teacherIdx++
      const day = DAYS[e % DAYS.length]
      const period = PERIODS[e % PERIODS.length]
      const subject = (teacher.subjectSpecialization || 'General').split('|')[0] || SUBJECTS[e % SUBJECTS.length]
      try {
        await p.timetable.create({
          data: {
            classId: cls.id,
            staffId: teacher.id,
            day,
            period: period.period,
            startTime: period.start,
            endTime: period.end,
            subjectName: subject,
            room: cls.room,
            isBreak: false,
          },
        })
        ttCount++
      } catch (err) {
        // skip duplicates
      }
    }
  }
  console.log(`  ✓ Created ${ttCount} timetable entries (target: ${TARGET_TT})`)

  // ============ 4. Parents (1,500 records) ============
  console.log('Creating 1,500 parent records…')
  // Note: Parent model has @unique on both userId AND studentId (one parent per student).
  // So we generate a unique email per student using admissionNo to avoid collisions.
  const studentsForParents = await p.student.findMany({ take: 1500, orderBy: { admissionNo: 'asc' }, select: { id: true, admissionNo: true, fullName: true, lastName: true, guardianName: true, guardianPhone: true, guardianOccupation: true } })
  let parentCount = 0
  for (let i = 0; i < studentsForParents.length; i++) {
    const s = studentsForParents[i]
    // Skip if this student already has a parent record
    const existingParent = await p.parent.findUnique({ where: { studentId: s.id } })
    if (existingParent) { parentCount++; continue }
    // Generate a unique email per student using admissionNo (guaranteed unique)
    const parentEmail = `parent.${s.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@learnx.edu`
    const user = await p.user.create({
      data: {
        email: parentEmail,
        password: 'demo1234',
        name: s.guardianName || `Parent of ${s.fullName}`,
        phone: s.guardianPhone,
        role: 'PARENT',
        isActive: true,
        createdById: adminUserId,
      },
    })
    await p.parent.create({
      data: {
        userId: user.id,
        studentId: s.id,
        relation: i % 2 === 0 ? 'FATHER' : 'MOTHER',
        occupation: s.guardianOccupation || randomItem(PARENT_OCCUPATIONS),
        income: randomInt(300000, 2000000),
      },
    })
    parentCount++
    if (parentCount % 300 === 0) console.log(`  Created ${parentCount}/1500 parents`)
  }
  console.log(`  ✓ Created/linked ${parentCount} parent records (total: ${await p.parent.count()})`)

  // ============ 5. Fee records (800) ============
  console.log('Creating 800 fee records…')
  const studentsForFees = await p.student.findMany({ take: 800, orderBy: { admissionNo: 'asc' }, select: { id: true } })
  let feeCount = 0
  for (let i = 0; i < studentsForFees.length; i++) {
    const feeType = randomItem(FEE_TYPES)
    const amount = randomInt(5000, 50000)
    const status = randomItem(['PAID', 'PAID', 'PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
    const paidAmount = status === 'PAID' ? amount : status === 'PARTIAL' ? Math.round(amount * 0.5) : 0
    const balance = amount - paidAmount
    const dueDate = new Date(2026, randomInt(0, 11), randomInt(1, 28))
    const existing = await p.fee.findFirst({ where: { studentId: studentsForFees[i].id, feeType } })
    if (existing) continue
    await p.fee.create({
      data: {
        studentId: studentsForFees[i].id,
        academicYearId: ay.id,
        feeType,
        amount,
        discount: 0,
        paidAmount,
        balance,
        dueDate,
        status,
        paymentMode: status === 'PAID' || status === 'PARTIAL' ? randomItem(PAYMENT_MODES) : null,
        paidOn: status === 'PAID' || status === 'PARTIAL' ? new Date(2026, randomInt(0, 6), randomInt(1, 28)) : null,
        receiptNo: status === 'PAID' || status === 'PARTIAL' ? `RCT-${pad(i + 1, 6)}` : null,
      },
    })
    feeCount++
    if (feeCount % 200 === 0) console.log(`  Created ${feeCount}/800 fees`)
  }
  console.log(`  ✓ Created ${feeCount} fee records (total: ${await p.fee.count()})`)

  // ============ 6. Exam + ExamScore records (300) ============
  console.log('Creating 300 exam score records…')
  // Create a few exams first
  const examNames = ['Mid-Term 2026', 'Unit Test 1', 'Quarterly 2026']
  const examIds = []
  for (const name of examNames) {
    let exam = await p.exam.findFirst({ where: { name } })
    if (!exam) {
      exam = await p.exam.create({ data: { name, examType: 'UNIT_TEST', academicYearId: ay.id, startDate: new Date('2026-07-15'), endDate: new Date('2026-07-20'), status: 'COMPLETED', totalMarks: 100, passingMarks: 35 } })
    }
    examIds.push(exam.id)
  }
  const studentsForScores = await p.student.findMany({ take: 300, orderBy: { admissionNo: 'asc' }, select: { id: true } })
  let scoreCount = 0
  for (let i = 0; i < studentsForScores.length; i++) {
    const examId = examIds[i % examIds.length]
    const marks = randomInt(35, 100)
    const percentage = marks
    const grade = marks >= 90 ? 'A1' : marks >= 80 ? 'A2' : marks >= 70 ? 'B1' : marks >= 60 ? 'B2' : marks >= 50 ? 'C1' : 'C2'
    try {
      await p.examScore.create({
        data: {
          examId,
          studentId: studentsForScores[i].id,
          marksObtained: marks,
          totalMarks: 100,
          grade,
          percentage,
          rank: randomInt(1, 40),
          remark: marks >= 75 ? 'Excellent' : marks >= 50 ? 'Good' : 'Needs improvement',
        },
      })
      scoreCount++
    } catch (e) { /* skip */ }
  }
  console.log(`  ✓ Created ${scoreCount} exam score records (total: ${await p.examScore.count()})`)

  // ============ 7. Teacher leaves (15 records: 13 with reasons + 2 EMERGENCY no info) ============
  console.log('Creating 15 teacher leave requests…')
  const teacherStaff = await p.staff.findMany({ where: { designation: { in: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } }, take: 15, select: { id: true, fullName: true } })
  let leaveCount = 0
  for (let i = 0; i < teacherStaff.length && i < LEAVE_REASONS.length; i++) {
    const lr = LEAVE_REASONS[i]
    const staff = teacherStaff[i]
    // Make 5 of them APPROVED covering today (so substitution detection picks them up)
    // 5 PENDING, 3 REJECTED, 2 APPROVED-but-future
    const statuses = ['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'REJECTED', 'REJECTED', 'REJECTED', 'APPROVED', 'APPROVED']
    const status = statuses[i]
    const today = new Date()
    const startDate = status === 'APPROVED' && i < 5 ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : new Date(today.getFullYear(), today.getMonth(), today.getDate() + randomInt(1, 30))
    const endDate = new Date(startDate.getTime() + (randomInt(1, 3) * 24 * 60 * 60 * 1000))
    const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

    await p.leaveRequest.create({
      data: {
        staffId: staff.id,
        leaveType: lr.leaveType,
        startDate,
        endDate,
        reason: lr.reason,
        status,
        appliedBy: staff.id,
        approvedBy: status === 'APPROVED' ? adminUserId : null,
        approvedOn: status === 'APPROVED' ? new Date() : null,
        daysCount,
      },
    })
    leaveCount++
  }
  console.log(`  ✓ Created ${leaveCount} leave requests (13 with reasons + 2 EMERGENCY no info)`)

  // ============ 8. Staff attendance ABSENT for today (15 teachers) ============
  console.log('Creating 15 StaffAttendance ABSENT records for today (for substitution detection)…')
  const todayStr = new Date()
  todayStr.setHours(0, 0, 0, 0)
  let absentCount = 0
  for (let i = 0; i < 15 && i < teacherStaff.length; i++) {
    const staff = teacherStaff[i]
    // Skip if already has an attendance record for today
    const existing = await p.staffAttendance.findFirst({ where: { staffId: staff.id, date: todayStr } })
    if (existing) continue
    await p.staffAttendance.create({
      data: {
        staffId: staff.id,
        date: todayStr,
        status: i < 10 ? 'ABSENT' : 'ON_LEAVE',
        method: 'BIOMETRIC',
        remark: i < 10 ? 'No punch-in — marked absent' : 'On approved leave',
      },
    })
    absentCount++
  }
  console.log(`  ✓ Created ${absentCount} StaffAttendance records for today`)

  // ============ 9. Final counts ============
  console.log('\n📊 Final counts:')
  console.log(`  Students: ${await p.student.count()}`)
  console.log(`  Staff (teachers): ${await p.staff.count({ where: { designation: { in: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } } })}`)
  console.log(`  Staff (non-teaching): ${await p.staff.count({ where: { designation: { notIn: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } } })}`)
  console.log(`  Classes (active): ${await p.class.count()}`)
  console.log(`  Parents: ${await p.parent.count()}`)
  console.log(`  Fees: ${await p.fee.count()}`)
  console.log(`  Exam Scores: ${await p.examScore.count()}`)
  console.log(`  Timetable entries: ${await p.timetable.count()}`)
  console.log(`  Leave requests: ${await p.leaveRequest.count()}`)
  console.log(`  Staff attendance records: ${await p.staffAttendance.count()}`)
  console.log(`  Users: ${await p.user.count()}`)
  console.log(`  Audit logs: ${await p.auditLog.count()}`)
  console.log(`  Communication logs: ${await p.communicationLog.count()}`)

  await p.$disconnect()
  console.log('\n✅ Comprehensive seed complete')
}

main().catch(e => { console.error(e); process.exit(1) })
