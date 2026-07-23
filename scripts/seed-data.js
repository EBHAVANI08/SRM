/**
 * Seed 7000 students + 150 teachers into the database
 * Run: bun run scripts/seed-data.js
 */

const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const FIRST_NAMES_M = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Rohan', 'Karan', 'Rahul', 'Amit', 'Suresh', 'Rajesh', 'Vikram', 'Arun', 'Nikhil', 'Varun', 'Kabir', 'Dev', 'Rishi', 'Yash', 'Dhruv', 'Aryan', 'Siddharth', 'Manav', 'Akash', 'Pranav', 'Harsh', 'Gaurav', 'Naveen', 'Pavan', 'Ravi', 'Kiran', 'Ashwin', 'Sanjay', 'Vinay', 'Pradeep']
const FIRST_NAMES_F = ['Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Aaradhya', 'Anika', 'Navya', 'Myra', 'Sara', 'Ira', 'Riya', 'Priya', 'Pooja', 'Kavya', 'Sneha', 'Nisha', 'Divya', 'Anjali', 'Bhavya', 'Charvi', 'Disha', 'Esha', 'Falguni', 'Gauri', 'Ishita', 'Jhanvi', 'Kiara', 'Lavanya', 'Mansi', 'Nidhi', 'Ojaswi', 'Prisha', 'Riya', 'Shreya', 'Tanvi', 'Uma', 'Vanya', 'Yamini', 'Zara', 'Aisha']
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Kumar', 'Singh', 'Rao', 'Joshi', 'Pillai', 'Das', 'Bose', 'Khan', 'Sheikh', 'Fernandes', 'DSouza', 'Pinto', 'Shetty', 'Gowda', 'Chowdhury', 'Banerjee', 'Mukherjee', 'Sengupta', 'Bhatt', 'Trivedi', 'Saxena', 'Malhotra', 'Kapoor', 'Chopra', 'Mehta', 'Shah', 'Desai', 'Kulkarni', 'Deshmukh', 'More', 'Jadhav']

const TEACHER_FIRST_NAMES = ['Anita', 'Rajesh', 'Meena', 'Vikram', 'Deepa', 'Arun', 'Kavita', 'Sunil', 'Suresh', 'Priya', 'Ramesh', 'Sunita', 'Mahesh', 'Lakshmi', 'Ganesh', 'Padma', 'Venkat', 'Saritha', 'Mohan', 'Geetha', 'Rakesh', 'Jyothi', 'Naresh', 'Swaroop', 'Anjali', 'Praveen', 'Nirmala', 'Dinesh', 'Vimala', 'Sridhar', 'Uma', 'Bharath', 'Chitra', 'Eshwar', 'Falguni', 'Giri', 'Hema', 'Indira', 'Jagdish', 'Kalyani', 'Lokesh', 'Madhuri', 'Nagaraj', 'Omana', 'Pankaj', 'Radhika', 'Sampath', 'Tara', 'Uday', 'Vani', 'Wakil', 'Xavier', 'Yogesh', 'Zubeida', 'Ashok', 'Bhavani', 'Chandrashekhar', 'Damini', 'Eknath', 'Farida', 'Gangadhar', 'Hemant', 'Indu', 'Jayanthi', 'Krishnamurthy', 'Lalita', 'Mallikarjun', 'Nalini', 'Omkar', 'Pushpa', 'Raghavendra', 'Sarojini', 'Tulasi', 'Umesh', 'Vasanthi', 'Waman', 'Yellappa', 'Ambika', 'Balaji', 'Chamundeshwari', 'Dattatreya', 'Ela', 'Faizal', 'Gaurangi', 'Hariprasad', 'Iqbal', 'Jitendra', 'Kalpana', 'Lokanatha', 'Malathi', 'Narasimha', 'Oormila', 'Pratap', 'Rukmini', 'Shashikala', 'Thipperudrappa', 'Upendra', 'Vandana', 'Waheeda', 'Yashoda', 'Achutha', 'Bhaskar', 'Chennabasava', 'Devaraj', 'Ekta', 'Fairoze', 'Girija', 'Honnegowda', 'Illamma', 'Jagadish', 'Kempaiah', 'Lalithamma', 'Muralidhar', 'Nagamma', 'Obalesh', 'Parvathamma', 'Ranganath', 'Shanthamma', 'Thimmappa', 'Uppinaboina', 'Veerabhadrappa', 'Yallappa', 'Akshatha', 'Bharathi', 'Chaitra', 'Deeksha', 'Eshwari', 'Fatima', 'Girish', 'Hanumantha', 'Jayamma', 'Kiran', 'Leela', 'Manjunatha', 'Ningappa', 'Padma', 'Rajanna', 'Shivalingappa', 'Tukaram', 'Venkatesh', 'Yallappa']

const DEPARTMENTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Kannada', 'Computer Science', 'Physical Education', 'Art', 'Music', 'Commerce', 'Biology', 'Chemistry', 'Physics', 'Economics']
const SUBJECTS_BY_DEPT = {
  'Mathematics': ['Mathematics'],
  'Science': ['Science', 'General Science'],
  'English': ['English', 'Literature'],
  'Social Studies': ['Social Studies', 'History', 'Geography', 'Civics'],
  'Hindi': ['Hindi'],
  'Kannada': ['Kannada'],
  'Computer Science': ['Computer Science', 'IT'],
  'Physical Education': ['Physical Education', 'Sports'],
  'Art': ['Art', 'Drawing'],
  'Music': ['Music', 'Vocal'],
  'Commerce': ['Commerce', 'Accountancy', 'Business Studies'],
  'Biology': ['Biology', 'Botany', 'Zoology'],
  'Chemistry': ['Chemistry'],
  'Physics': ['Physics'],
  'Economics': ['Economics', 'Statistics'],
}
const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const SECTIONS = ['A', 'B', 'C', 'D']
const GRADES_BY_TEACHER = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const AVATAR_COLORS = ['#1E3A8A', '#F59E0B', '#22C55E', '#E11D48', '#0D9488', '#7C3AED', '#F97316', '#6366F1', '#0EA5E9', '#EC4899']

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

async function main() {
  console.log('Seeding 150 teachers...')
  
  // Create grades if they don't exist
  for (let i = 0; i < GRADES.length; i++) {
    const gradeName = GRADES[i]
    const existing = await p.grade.findFirst({ where: { name: gradeName } })
    if (!existing) {
      await p.grade.create({
        data: { name: gradeName, level: i < 2 ? 'PRIMARY' : i < 4 ? 'SECONDARY' : 'SR_SECONDARY', order: i + 6 },
      })
    }
  }

  // Create sections for each grade
  for (const gradeName of GRADES) {
    const grade = await p.grade.findFirst({ where: { name: gradeName } })
    if (!grade) continue
    for (const sectionName of SECTIONS) {
      const existingSection = await p.section.findFirst({ where: { gradeId: grade.id, name: sectionName } })
      if (!existingSection) {
        await p.section.create({
          data: { gradeId: grade.id, name: sectionName, capacity: 40 },
        })
      }
    }
  }

  // Create academic year
  let ay = await p.academicYear.findFirst({ where: { name: '2026-27' } })
  if (!ay) {
    ay = await p.academicYear.create({
      data: { name: '2026-27', startDate: new Date('2026-06-01'), endDate: new Date('2027-04-30') },
    })
  }

  // Create 150 teachers
  for (let i = 0; i < 150; i++) {
    const firstName = randomItem(TEACHER_FIRST_NAMES)
    const lastName = randomItem(LAST_NAMES)
    const fullName = `${firstName} ${lastName}`
    const department = randomItem(DEPARTMENTS)
    const subjects = SUBJECTS_BY_DEPT[department] || [department]
    const teacherGrades = GRADES_BY_TEACHER.filter(() => Math.random() > 0.6).slice(0, randomInt(2, 4))
    if (teacherGrades.length === 0) teacherGrades.push(randomItem(GRADES))

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@learnx.edu`
    const employeeId = `EMP-T-${String(i + 1).padStart(4, '0')}`
    const phone = `+91 99${String(randomInt(100, 999))} ${String(randomInt(100000, 999999))}`

    // Create user first
    const user = await p.user.upsert({
      where: { email },
      create: {
        email,
        password: 'demo1234',
        name: fullName,
        phone,
        role: 'TEACHER',
        isActive: true,
      },
      update: {},
    })

    // Create staff
    await p.staff.upsert({
      where: { employeeId },
      create: {
        employeeId,
        firstName,
        lastName,
        fullName,
        dob: new Date(randomInt(1975, 1995), randomInt(0, 11), randomInt(1, 28)),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        phone,
        email,
        address: `${randomInt(1, 999)}, ${randomItem(['MG Road', 'Brigade Road', 'Indiranagar', 'Jayanagar', 'Koramangala'])}, Bengaluru`,
        designation: i < 15 ? 'Senior Teacher' : i < 50 ? 'Teacher' : 'Assistant Teacher',
        department,
        subjectSpecialization: subjects.join('|'),
        joiningDate: new Date(randomInt(2015, 2025), randomInt(0, 11), randomInt(1, 28)),
        userId: user.id,
        aadhaarNo: `XXXX-XXXX-${String(randomInt(1000, 9999))}`,
        panNo: `ABCDE${String(randomInt(1000, 9999))}F`,
        bloodGroup: randomItem(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
        status: 'ACTIVE',
      },
      update: {},
    })

    if ((i + 1) % 30 === 0) console.log(`  Created ${i + 1}/150 teachers`)
  }

  console.log('Seeding 7000 students...')
  
  let studentCount = 0
  const allSections = await p.section.findMany({ include: { grade: true } })
  
  // Distribute 7000 students across grades and sections
  for (const section of allSections) {
    const studentsInThisSection = Math.floor(7000 / allSections.length)
    
    for (let i = 0; i < studentsInThisSection; i++) {
      const isMale = Math.random() > 0.48
      const firstName = isMale ? randomItem(FIRST_NAMES_M) : randomItem(FIRST_NAMES_F)
      const lastName = randomItem(LAST_NAMES)
      const fullName = `${firstName} ${lastName}`
      const admissionNo = `ADM2026-${String(studentCount + 1).padStart(4, '0')}`
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentCount}@learnx.edu`
      const phone = `+91 98${String(randomInt(100, 999))} ${String(randomInt(100000, 999999))}`

      const guardianName = `${randomItem(['Suresh', 'Rajesh', 'Mahesh', 'Ganesh', 'Ramesh', 'Naresh', 'Dinesh', 'Suresh', 'Vikram', 'Prakash'])} ${lastName}`
      const feeStatus = randomItem(['PAID', 'PAID', 'PAID', 'PARTIAL', 'PENDING'])
      const attendanceStatus = randomItem(['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE'])
      const avatarColor = randomItem(AVATAR_COLORS)

      // Create student
      await p.student.create({
        data: {
          admissionNo,
          firstName,
          lastName,
          fullName,
          dob: new Date(randomInt(2010, 2018), randomInt(0, 11), randomInt(1, 28)),
          gender: isMale ? 'Male' : 'Female',
          bloodGroup: randomItem(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
          nationality: 'Indian',
          religion: randomItem(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain']),
          category: randomItem(['General', 'OBC', 'SC', 'ST']),
          aadhaarNo: `XXXX-XXXX-${String(randomInt(1000, 9999))}`,
          address: `${randomInt(1, 999)}, ${randomItem(['MG Road', 'Brigade Road', 'Indiranagar', 'Jayanagar', 'Koramangala', 'HSR Layout', 'BTM Layout'])}, Bengaluru`,
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: `5600${randomInt(10, 99)}`,
          fatherName: `${randomItem(['Suresh', 'Rajesh', 'Mahesh', 'Ganesh', 'Ramesh'])} ${lastName}`,
          motherName: `${randomItem(['Sunita', 'Lakshmi', 'Padma', 'Geetha', 'Jyothi'])} ${lastName}`,
          guardianName,
          guardianPhone: phone,
          guardianEmail: `${guardianName.toLowerCase().replace(' ', '.')}@email.com`,
          guardianOccupation: randomItem(['Software Engineer', 'Doctor', 'Teacher', 'Business', 'Government Employee', 'Banker', 'Lawyer', 'Engineer']),
          annualIncome: randomInt(300000, 2000000),
          photo: isMale ? '👨‍🎓' : '👩‍🎓',
          admissionDate: new Date(randomInt(2022, 2026), randomInt(0, 11), randomInt(1, 28)),
          previousSchool: randomItem(['Delhi Public School', 'Kendriya Vidyalaya', 'St. Joseph\'s', 'Bishop Cotton', 'National Public School', '—']),
          status: attendanceStatus,
          sectionId: section.id,
          academicYearId: ay.id,
        },
      })

      studentCount++
      if (studentCount % 500 === 0) console.log(`  Created ${studentCount}/7000 students`)
    }
  }

  console.log(`\n✅ Seeded ${studentCount} students + 150 teachers`)
  console.log('Database is now ready with realistic data.')
  
  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
