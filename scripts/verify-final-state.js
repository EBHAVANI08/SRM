const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const grades = await p.grade.count()
  const sections = await p.section.count()
  const classes = await p.class.count()
  const students = await p.student.count()
  const staff = await p.staff.count()
  const teachers = await p.staff.count({ where: { designation: { in: ['Teacher', 'Senior Teacher', 'Assistant Teacher'] } } })
  const timetable = await p.timetable.count()
  const gradesList = await p.grade.findMany({ orderBy: { order: 'asc' }, select: { name: true, level: true, order: true } })

  // Sample: how many teachers teach each grade?
  const ttByGrade = await p.timetable.groupBy({
    by: ['subjectName'],
    _count: { _all: true },
    orderBy: { _count: { subjectName: 'desc' } },
    take: 10,
  })

  // How many distinct teachers are linked via timetable?
  const distinctTeachers = await p.timetable.findMany({ select: { staffId: true }, distinct: ['staffId'] })

  console.log(JSON.stringify({
    grades,
    sections,
    classes,
    students,
    staff,
    teachers,
    timetableEntries: timetable,
    distinctTeachersInTimetable: distinctTeachers.length,
    gradesList,
    topSubjects: ttByGrade,
  }, null, 2))
  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
