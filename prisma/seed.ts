/**
 * Database Seeder — Populates DB from school-data.ts
 * Run: bun run db:seed
 *
 * Seeds: School, AcademicYear, Grade, Section, Students, Staff, and all linked records
 */

import { db } from '../src/lib/db'
import { STUDENTS, TEACHERS } from '../src/lib/school-data'

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create School
  const school = await db.school.upsert({
    where: { id: 'school_default' },
    update: {},
    create: {
      id: 'school_default',
      name: 'LearnX International School',
      address: '100 Education Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      phone: '+91 80 1234 5678',
      email: 'info@learnx.edu',
      totalStudents: 2847,
      totalStaff: 186,
    },
  })
  console.log(`  ✓ School: ${school.name}`)

  // 2. Create Academic Year
  let ay = await db.academicYear.findFirst({ where: { name: '2025-2026' } })
  if (!ay) {
    ay = await db.academicYear.create({
      data: {
        name: '2025-2026',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        isActive: true,
      },
    })
  }
  console.log(`  ✓ Academic Year: ${ay.name}`)

  // 3. Create Grades & Sections
  const grades = ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  for (let i = 0; i < grades.length; i++) {
    let grade = await db.grade.findFirst({ where: { name: grades[i] } })
    if (!grade) {
      grade = await db.grade.create({
        data: {
          name: grades[i],
          level: i < 3 ? 'KG' : i < 8 ? 'PRIMARY' : 'SECONDARY',
          order: i,
        },
      })
    }

    // Create sections A, B for each grade
    for (const sectionName of ['A', 'B']) {
      let section = await db.section.findFirst({ where: { gradeId: grade.id, name: sectionName } })
      if (!section) {
        await db.section.create({
          data: {
            name: sectionName,
            gradeId: grade.id,
            capacity: 40,
          },
        })
      }
    }
  }
  console.log(`  ✓ ${grades.length} Grades with sections created`)

  // 4. Seed Students
  for (const s of STUDENTS) {
    const student = await db.student.upsert({
      where: { admissionNo: s.admissionNo },
      update: {},
      create: {
        admissionNo: s.admissionNo,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: s.fullName,
        dob: new Date(s.dob),
        gender: s.gender.toUpperCase(),
        bloodGroup: s.bloodGroup,
        nationality: s.nationality,
        religion: s.religion,
        category: s.category,
        address: s.address,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        fatherName: s.fatherName,
        motherName: s.motherName,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        guardianEmail: s.guardianEmail,
        guardianOccupation: s.guardianOccupation,
        annualIncome: s.annualIncome,
        photo: s.photo,
        previousSchool: s.previousSchool,
        status: 'ACTIVE',
        sectionId: null, // Don't link to Section FK — section is stored as text in school-data.ts
        academicYearId: ay.id,
        medicalConditions: s.healthRecords[0]?.chronicConditions || null,
        allergies: s.healthRecords[0]?.allergies || null,
      },
    })

    // Seed attendance (delete existing first to avoid duplicates)
    await db.attendance.deleteMany({ where: { studentId: student.id } })
    for (const a of s.attendance) {
      await db.attendance.create({
        data: {
          studentId: student.id,
          date: new Date(a.date),
          status: a.status,
          checkIn: a.checkIn !== '-' ? new Date(`2026-07-01T${a.checkIn}:00`) : null,
          method: a.method,
        },
      })
    }

    // Seed fees
    await db.fee.deleteMany({ where: { studentId: student.id } })
    for (const f of s.fees) {
      await db.fee.create({
        data: {
          studentId: student.id,
          academicYearId: ay.id,
          feeType: f.feeType,
          amount: f.amount,
          discount: 0,
          paidAmount: f.paid,
          balance: f.balance,
          dueDate: new Date(f.dueDate),
          status: f.status,
          paymentMode: f.paymentMethod || null,
          paidOn: f.paidOn ? new Date(f.paidOn) : null,
          receiptNo: f.receiptNo || null,
        },
      })
    }

    // Seed exam scores
    for (const e of s.examScores) {
      let exam = await db.exam.findFirst({ where: { name: e.exam } })
      if (!exam) {
        exam = await db.exam.create({
          data: {
            name: e.exam,
            examType: 'UNIT_TEST',
            academicYearId: ay.id,
            startDate: new Date('2026-06-15'),
            endDate: new Date('2026-06-20'),
            status: 'COMPLETED',
            totalMarks: e.totalMarks,
            passingMarks: 35,
          },
        })
      }
      await db.examScore.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          marksObtained: e.marksObtained,
          totalMarks: e.totalMarks,
          grade: e.grade,
          percentage: e.percentage,
          rank: e.rank,
          remark: e.remark,
        },
      })
    }

    console.log(`  ✓ Student: ${s.fullName} (${s.admissionNo})`)
  }

  // 5. Seed Staff/Teachers
  for (const t of TEACHERS) {
    const staff = await db.staff.upsert({
      where: { employeeId: t.employeeId },
      update: {},
      create: {
        employeeId: t.employeeId,
        firstName: t.firstName,
        lastName: t.lastName,
        fullName: t.fullName,
        dob: new Date(t.dob),
        gender: t.gender.toUpperCase(),
        bloodGroup: t.bloodGroup,
        qualification: t.qualification,
        experience: t.experience,
        designation: t.designation,
        department: t.department,
        subjectSpecialization: t.subjectSpecialization,
        joiningDate: new Date(t.joiningDate),
        phone: t.phone,
        email: t.email,
        address: t.address,
        aadhaarNo: t.aadhaarNo,
        panNo: t.panNo,
        bankAccountNo: t.bankAccountNo,
        bankIfsc: t.bankIfsc,
        bankName: t.bankName,
        photo: t.photo,
        status: 'ACTIVE',
        employmentType: t.employmentType,
      },
    })

    // Seed salary — use actual staff.id from DB
    await db.salaryRecord.deleteMany({ where: { staffId: staff.id } })
    for (const s of t.salaryRecords) {
      await db.salaryRecord.create({
        data: {
          staffId: staff.id,
          month: s.month,
          basicSalary: s.basicSalary,
          hra: 0, da: 0, conveyance: 0, specialAllowance: 0,
          grossSalary: s.grossSalary,
          pfDeduction: s.pfDeduction,
          taxDeduction: s.taxDeduction,
          otherDeduction: 0,
          netSalary: s.netSalary,
          status: s.status,
          paidOn: s.paidOn ? new Date(s.paidOn) : null,
        },
      })
    }

    console.log(`  ✓ Staff: ${t.fullName} (${t.employeeId})`)
  }

  // 6. Create default feature flags
  const flags = ['ai_extraction', 'simulation_mode', 'auto_payroll', 'auto_substitution', 'rag_index']
  for (const flag of flags) {
    await db.featureFlag.upsert({
      where: { schoolId_flagKey: { schoolId: 'school_default', flagKey: flag } },
      update: {},
      create: {
        schoolId: 'school_default',
        flagKey: flag,
        enabled: true,
      },
    })
  }
  console.log(`  ✓ ${flags.length} Feature Flags created`)

  // 7. Create default policies
  await db.policy.create({
    data: {
      schoolId: 'school_default',
      name: 'grading_bands',
      category: 'ACADEMIC',
      version: 1,
      data: JSON.stringify({
        A_plus: { min: 90, max: 100 },
        A: { min: 80, max: 89 },
        B_plus: { min: 70, max: 79 },
        B: { min: 60, max: 69 },
        C: { min: 50, max: 59 },
        D: { min: 35, max: 49 },
        F: { min: 0, max: 34 },
      }),
    },
  })

  await db.policy.create({
    data: {
      schoolId: 'school_default',
      name: 'fine_rules',
      category: 'FINANCIAL',
      version: 1,
      data: JSON.stringify({
        lateFeePerDay: 10,
        maxLateFee: 500,
        siblingDiscountPct: 10,
        reAdmissionFee: 1000,
      }),
    },
  })
  console.log(`  ✓ Default policies created`)

  console.log('\n✅ Seeding complete!')
  console.log(`   Students: ${await db.student.count()}`)
  console.log(`   Staff: ${await db.staff.count()}`)
  console.log(`   Attendance: ${await db.attendance.count()}`)
  console.log(`   Fees: ${await db.fee.count()}`)
  console.log(`   Exam Scores: ${await db.examScore.count()}`)
  console.log(`   Feature Flags: ${await db.featureFlag.count()}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
