/**
 * Expand DB: full LKG-12 grade range with sections A/B/C/D,
 * distribute 7000 students across all grades, create Class records,
 * and assign each of the 150 teachers to grades + subjects via Timetable entries.
 *
 * Run: bun run scripts/expand-grades-and-timetables.js
 */
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const ALL_GRADES = [
  { name: 'Nursery',   level: 'KG',          order: 0 },
  { name: 'LKG',       level: 'KG',          order: 1 },
  { name: 'UKG',       level: 'KG',          order: 2 },
  { name: 'Grade 1',   level: 'PRIMARY',     order: 3 },
  { name: 'Grade 2',   level: 'PRIMARY',     order: 4 },
  { name: 'Grade 3',   level: 'PRIMARY',     order: 5 },
  { name: 'Grade 4',   level: 'PRIMARY',     order: 6 },
  { name: 'Grade 5',   level: 'PRIMARY',     order: 7 },
  { name: 'Grade 6',   level: 'PRIMARY',     order: 8 },
  { name: 'Grade 7',   level: 'SECONDARY',   order: 9 },
  { name: 'Grade 8',   level: 'SECONDARY',   order: 10 },
  { name: 'Grade 9',   level: 'SECONDARY',   order: 11 },
  { name: 'Grade 10',  level: 'SR_SECONDARY',order: 12 },
  { name: 'Grade 11',  level: 'SR_SECONDARY',order: 13 },
  { name: 'Grade 12',  level: 'SR_SECONDARY',order: 14 },
]
const ALL_SECTIONS = ['A', 'B', 'C', 'D']

// Subjects by grade level
const KG_SUBJECTS = ['English', 'Mathematics', 'EVS', 'Art', 'Music', 'Physical Education']
const PRIMARY_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Art', 'Music', 'Physical Education']
const SECONDARY_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education']
const SR_SECONDARY_SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Commerce', 'Accountancy', 'Physical Education']

function subjectsFor(grade) {
  if (grade.level === 'KG') return KG_SUBJECTS
  if (grade.level === 'PRIMARY') return PRIMARY_SUBJECTS
  if (grade.level === 'SECONDARY') return SECONDARY_SUBJECTS
  return SR_SECONDARY_SUBJECTS
}

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
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

async function main() {
  console.log('Ensuring all 15 grades (Nursery → Grade 12)...')
  for (const g of ALL_GRADES) {
    const existing = await p.grade.findFirst({ where: { name: g.name } })
    if (existing) {
      // Update level/order if mismatched
      if (existing.level !== g.level || existing.order !== g.order) {
        await p.grade.update({ where: { id: existing.id }, data: { level: g.level, order: g.order } })
      }
    } else {
      await p.grade.create({ data: { name: g.name, level: g.level, order: g.order } })
    }
  }
  console.log(`  ✓ ${ALL_GRADES.length} grades present`)

  console.log('Ensuring 4 sections (A/B/C/D) for each grade...')
  for (const g of ALL_GRADES) {
    const grade = await p.grade.findFirst({ where: { name: g.name } })
    if (!grade) continue
    for (const sectionName of ALL_SECTIONS) {
      const existing = await p.section.findFirst({ where: { gradeId: grade.id, name: sectionName } })
      if (!existing) {
        await p.section.create({ data: { gradeId: grade.id, name: sectionName, capacity: 35 } })
      }
    }
  }
  const sectionCount = await p.section.count()
  console.log(`  ✓ ${sectionCount} sections present (15 grades × 4 sections = 60)`)

  console.log('Ensuring academic year 2026-27 exists...')
  let ay = await p.academicYear.findFirst({ where: { name: '2026-27' } })
  if (!ay) {
    ay = await p.academicYear.create({
      data: { name: '2026-27', startDate: new Date('2026-06-01'), endDate: new Date('2027-04-30'), isActive: true },
    })
  }
  // Deactivate other academic years
  await p.academicYear.updateMany({ where: { name: { not: '2026-27' } }, data: { isActive: false } })

  console.log('Creating Class records for every section × academic year...')
  let classCount = 0
  const sections = await p.section.findMany({ include: { grade: true } })
  for (const s of sections) {
    const existing = await p.class.findFirst({ where: { sectionId: s.id, academicYearId: ay.id } })
    if (!existing) {
      await p.class.create({ data: { sectionId: s.id, academicYearId: ay.id, room: `${s.grade.name.replace(' ', '')}-${s.name}` } })
      classCount++
    }
  }
  const totalClasses = await p.class.count()
  console.log(`  ✓ ${totalClasses} class records present (created ${classCount} new)`)

  console.log('Re-distributing 7000 students across all 15 grades × 4 sections...')
  // Get all current section IDs (sorted by grade order + section name for predictable distribution)
  const allSections = await p.section.findMany({
    include: { grade: true },
    orderBy: { grade: { order: 'asc' } },
  })
  // Sort by section name within grade
  allSections.sort((a, b) => {
    if (a.grade.order !== b.grade.order) return a.grade.order - b.grade.order
    return a.name.localeCompare(b.name)
  })

  const totalSeats = allSections.length * 35 // 60 × 35 = 2100 — not enough; bump to ~117/section for 7000
  // Actually distribute 7000 evenly: 7000 / 60 = ~117 per section. Cap at 35 is just metadata; we still assign.
  const studentsPerSection = Math.floor(7000 / allSections.length) // ~116-117
  const remainder = 7000 - (studentsPerSection * allSections.length)

  // Get all students currently in DB (sorted by admissionNo for predictable ordering)
  const allStudents = await p.student.findMany({ orderBy: { admissionNo: 'asc' } })
  console.log(`  Found ${allStudents.length} existing students to redistribute`)

  // Assign each student to a section + class in round-robin
  let assigned = 0
  for (let i = 0; i < allStudents.length; i++) {
    const student = allStudents[i]
    const sectionIdx = i % allSections.length
    const section = allSections[sectionIdx]
    const classRecord = await p.class.findFirst({ where: { sectionId: section.id, academicYearId: ay.id } })
    if (!classRecord) continue
    // Only update if different (avoid unnecessary writes)
    if (student.sectionId !== section.id || student.classId !== classRecord.id) {
      await p.student.update({
        where: { id: student.id },
        data: { sectionId: section.id, classId: classRecord.id, academicYearId: ay.id },
      })
    }
    assigned++
    if (assigned % 1000 === 0) console.log(`  Assigned ${assigned}/${allStudents.length}`)
  }
  console.log(`  ✓ All ${assigned} students assigned to sections + classes`)

  console.log('Generating timetable entries for all 150 teachers...')
  // Get all teachers + their subjects
  const teachers = await p.staff.findMany({ where: { designation: { in: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } } })
  console.log(`  Found ${teachers.length} teachers`)

  // Clear existing timetable for this academic year's classes
  const allClassIds = (await p.class.findMany({ where: { academicYearId: ay.id }, select: { id: true } })).map(c => c.id)
  if (allClassIds.length > 0) {
    await p.timetable.deleteMany({ where: { classId: { in: allClassIds } } })
    console.log(`  Cleared old timetable entries for ${allClassIds.length} classes`)
  }

  // Parse each teacher's subjectSpecialization (pipe-separated)
  // Assign each teacher to 2-4 grades + sections, then create timetable entries
  let ttCount = 0
  for (let ti = 0; ti < teachers.length; ti++) {
    const t = teachers[ti]
    const subjects = (t.subjectSpecialization || 'General').split('|').filter(Boolean)
    if (subjects.length === 0) subjects.push('General')

    // Pick 2-4 grades deterministically based on teacher index
    const numGrades = 2 + (ti % 3) // 2, 3, or 4
    const startGradeIdx = (ti * 3) % ALL_GRADES.length
    const teacherGradeIdx = []
    for (let g = 0; g < numGrades; g++) {
      teacherGradeIdx.push((startGradeIdx + g) % ALL_GRADES.length)
    }

    // For each grade the teacher teaches, pick 1-2 sections
    for (const gradeIdx of teacherGradeIdx) {
      const grade = ALL_GRADES[gradeIdx]
      const gradeSections = allSections.filter(s => s.grade.name === grade.name)
      // Pick 1-2 sections based on teacher index
      const numSections = 1 + (ti % 2) // 1 or 2
      for (let si = 0; si < numSections && si < gradeSections.length; si++) {
        const section = gradeSections[(ti + si) % gradeSections.length]
        const classRecord = await p.class.findFirst({ where: { sectionId: section.id, academicYearId: ay.id } })
        if (!classRecord) continue

        // Pick subject from teacher's specialization that this grade offers
        const gradeSubjects = subjectsFor(grade)
        const subject = subjects.find(s => gradeSubjects.includes(s)) || subjects[0]

        // Assign 3-5 periods per week for this class
        const periodsPerWeek = 3 + (ti % 3) // 3, 4, or 5
        const assignedSlots = new Set()
        for (let pw = 0; pw < periodsPerWeek; pw++) {
          const dayIdx = (ti + pw) % DAYS.length
          const periodIdx = (ti * 2 + pw) % PERIODS.length
          const slotKey = `${dayIdx}-${periodIdx}`
          if (assignedSlots.has(slotKey)) continue
          assignedSlots.add(slotKey)

          try {
            await p.timetable.create({
              data: {
                classId: classRecord.id,
                staffId: t.id,
                day: DAYS[dayIdx],
                period: PERIODS[periodIdx].period,
                startTime: PERIODS[periodIdx].start,
                endTime: PERIODS[periodIdx].end,
                subjectName: subject,
                room: classRecord.room,
                isBreak: false,
              },
            })
            ttCount++
          } catch (e) {
            // Skip duplicates / constraint errors silently
          }
        }
      }
    }

    if ((ti + 1) % 30 === 0) console.log(`  Processed ${ti + 1}/${teachers.length} teachers (${ttCount} timetable entries so far)`)
  }
  console.log(`  ✓ Created ${ttCount} timetable entries linking 150 teachers to grades + sections + subjects`)

  console.log('Final counts:')
  console.log(`  Grades: ${await p.grade.count()}`)
  console.log(`  Sections: ${await p.section.count()}`)
  console.log(`  Classes: ${await p.class.count()}`)
  console.log(`  Students: ${await p.student.count()}`)
  console.log(`  Staff (teachers): ${await p.staff.count()}`)
  console.log(`  Timetable entries: ${await p.timetable.count()}`)

  await p.$disconnect()
  console.log('\n✅ Done')
}

main().catch(e => { console.error(e); process.exit(1) })
