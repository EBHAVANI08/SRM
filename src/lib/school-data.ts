// ============ Interlinked School Database ============
// This is a comprehensive in-memory database that links students, teachers, staff
// with all their related records: attendance, fees, exams, health, transport, etc.

export interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  fullName: string
  dob: string
  gender: 'Male' | 'Female'
  bloodGroup: string
  nationality: string
  religion: string
  category: string
  aadhaarNo: string
  address: string
  city: string
  state: string
  pincode: string
  fatherName: string
  motherName: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  guardianOccupation: string
  annualIncome: number
  photo: string
  admissionDate: string
  previousSchool: string
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED'
  sectionId: string
  classId: string
  // Linked records
  attendance: AttendanceRecord[]
  examScores: ExamScoreRecord[]
  fees: FeeRecord[]
  leaveRequests: LeaveRecord[]
  healthRecords: HealthRecord[]
  behaviorRecords: BehaviorRecord[]
  transportAssignment?: TransportRecord
  hostelAllocation?: HostelRecord
  activities: ActivityRecord[]
  documents: DocumentRecord[]
  reportCards: ReportCardRecord[]
  ptmMeetings: PTMRecord[]
}

export interface Teacher {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  fullName: string
  dob: string
  gender: 'Male' | 'Female'
  bloodGroup: string
  qualification: string
  experience: number
  designation: string
  department: string
  subjectSpecialization: string
  joiningDate: string
  phone: string
  email: string
  address: string
  aadhaarNo: string
  panNo: string
  bankAccountNo: string
  bankIfsc: string
  bankName: string
  photo: string
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED'
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
  // Linked records
  attendance: StaffAttendanceRecord[]
  salaryRecords: SalaryRecord[]
  leaveRequests: LeaveRecord[]
  classesTaught: string[]
  subjectsTaught: string[]
  documents: DocumentRecord[]
}

export interface Staff {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  fullName: string
  dob: string
  gender: 'Male' | 'Female'
  qualification: string
  designation: string
  department: string
  joiningDate: string
  phone: string
  email: string
  address: string
  photo: string
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED'
  // Linked records
  attendance: StaffAttendanceRecord[]
  salaryRecords: SalaryRecord[]
  leaveRequests: LeaveRecord[]
  documents: DocumentRecord[]
}

interface AttendanceRecord {
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'
  checkIn: string
  checkOut: string
  method: 'BIOMETRIC' | 'RFID' | 'FACE' | 'MANUAL'
}

interface ExamScoreRecord {
  exam: string
  subject: string
  marksObtained: number
  totalMarks: number
  grade: string
  percentage: number
  rank: number
  remark: string
}

interface FeeRecord {
  feeType: string
  amount: number
  paid: number
  balance: number
  dueDate: string
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE'
  paymentMethod?: string
  paidOn?: string
  receiptNo?: string
}

interface LeaveRecord {
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  daysCount: number
  appliedOn: string
}

interface HealthRecord {
  date: string
  height: number
  weight: number
  bmi: number
  bloodPressure: string
  vision: string
  hearing: string
  allergies: string
  chronicConditions: string
  medications: string
  doctorName: string
  notes: string
}

interface BehaviorRecord {
  date: string
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  category: string
  description: string
  points: number
  recordedBy: string
  actionTaken: string
}

interface TransportRecord {
  vehicleNo: string
  routeName: string
  pickupPoint: string
  dropPoint: string
  driverName: string
  driverPhone: string
  fee: number
}

interface HostelRecord {
  hostelName: string
  roomNo: string
  floor: number
  type: string
  allocationDate: string
  wardenName: string
  wardenPhone: string
}

interface ActivityRecord {
  name: string
  category: string
  performance: string
  rating: number
  date: string
}

interface DocumentRecord {
  title: string
  type: string
  uploadedOn: string
  verified: boolean
}

interface ReportCardRecord {
  term: string
  overallPercentage: number
  overallGrade: string
  overallRank: number
  attendancePercentage: number
  conduct: string
  teacherRemark: string
  principalRemark: string
  generatedAt: string
  status: string
}

interface PTMRecord {
  date: string
  staffName: string
  mode: string
  status: string
  agenda: string
  feedback: string
  parentRating: number
}

interface StaffAttendanceRecord {
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE'
  checkIn: string
  checkOut: string
  workHours: number
}

interface SalaryRecord {
  month: string
  basicSalary: number
  grossSalary: number
  netSalary: number
  pfDeduction: number
  taxDeduction: number
  status: 'PAID' | 'PENDING' | 'PROCESSING'
  paidOn: string
}

// ============ STUDENTS DATA ============
export const STUDENTS: Student[] = [
  {
    id: 'STU-2026-0142',
    admissionNo: 'ADM2026-0142',
    firstName: 'Aarav',
    lastName: 'Singh',
    fullName: 'Aarav Singh',
    dob: '2013-05-14',
    gender: 'Male',
    bloodGroup: 'B+',
    nationality: 'Indian',
    religion: 'Hindu',
    category: 'General',
    aadhaarNo: 'XXXX-XXXX-4521',
    address: '42, MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    fatherName: 'Suresh Singh',
    motherName: 'Sunita Singh',
    guardianName: 'Suresh Singh',
    guardianPhone: '+91 98765 43210',
    guardianEmail: 'suresh.singh@email.com',
    guardianOccupation: 'Software Engineer',
    annualIncome: 1800000,
    photo: '👨‍🎓',
    admissionDate: '2024-06-15',
    previousSchool: 'Delhi Public School',
    status: 'ACTIVE',
    sectionId: '7-A',
    classId: '7-A',
    attendance: [
      { date: '2026-07-01', status: 'PRESENT', checkIn: '08:12', checkOut: '15:30', method: 'FACE' },
      { date: '2026-06-30', status: 'PRESENT', checkIn: '08:08', checkOut: '15:30', method: 'FACE' },
      { date: '2026-06-29', status: 'ABSENT', checkIn: '-', checkOut: '-', method: '-' },
      { date: '2026-06-28', status: 'PRESENT', checkIn: '08:15', checkOut: '15:30', method: 'RFID' },
      { date: '2026-06-27', status: 'LATE', checkIn: '08:35', checkOut: '15:30', method: 'BIOMETRIC' },
    ],
    examScores: [
      { exam: 'Unit Test 1', subject: 'Mathematics', marksObtained: 84, totalMarks: 100, grade: 'A', percentage: 84, rank: 3, remark: 'Excellent' },
      { exam: 'Unit Test 1', subject: 'Science', marksObtained: 92, totalMarks: 100, grade: 'A+', percentage: 92, rank: 1, remark: 'Outstanding' },
      { exam: 'Unit Test 1', subject: 'English', marksObtained: 78, totalMarks: 100, grade: 'B+', percentage: 78, rank: 5, remark: 'Good' },
      { exam: 'Unit Test 1', subject: 'Social Studies', marksObtained: 85, totalMarks: 100, grade: 'A', percentage: 85, rank: 2, remark: 'Very Good' },
      { exam: 'Unit Test 1', subject: 'Hindi', marksObtained: 80, totalMarks: 100, grade: 'A', percentage: 80, rank: 4, remark: 'Good' },
    ],
    fees: [
      { feeType: 'Tuition Q1', amount: 12500, paid: 12500, balance: 0, dueDate: '15 Apr 2026', status: 'PAID', paymentMethod: 'UPI', paidOn: '10 Apr 2026', receiptNo: 'RCP-001' },
      { feeType: 'Tuition Q2', amount: 12500, paid: 12500, balance: 0, dueDate: '15 Jul 2026', status: 'PAID', paymentMethod: 'UPI', paidOn: '10 Jul 2026', receiptNo: 'RCP-002' },
      { feeType: 'Transport', amount: 3000, paid: 3000, balance: 0, dueDate: '15 Jul 2026', status: 'PAID', paymentMethod: 'Card', paidOn: '12 Jul 2026', receiptNo: 'RCP-003' },
      { feeType: 'Tuition Q3', amount: 12500, paid: 0, balance: 12500, dueDate: '15 Oct 2026', status: 'PENDING' },
    ],
    leaveRequests: [
      { leaveType: 'Sick Leave', startDate: '2026-06-29', endDate: '2026-06-29', reason: 'Fever and cold', status: 'APPROVED', daysCount: 1, appliedOn: '2026-06-28' },
      { leaveType: 'Casual Leave', startDate: '2026-05-10', endDate: '2026-05-12', reason: 'Family function', status: 'APPROVED', daysCount: 3, appliedOn: '2026-05-08' },
    ],
    healthRecords: [
      { date: '2026-06-01', height: 152, weight: 42, bmi: 18.2, bloodPressure: '110/70', vision: '20/20', hearing: 'Normal', allergies: 'None', chronicConditions: 'None', medications: 'None', doctorName: 'Dr. Mehta', notes: 'Healthy child, normal development' },
    ],
    behaviorRecords: [
      { date: '2026-06-15', type: 'POSITIVE', category: 'ACADEMIC', description: 'Topper in Science Unit Test', points: 10, recordedBy: 'Mrs. Verma', actionTaken: 'Certificate awarded' },
      { date: '2026-05-20', type: 'POSITIVE', category: 'SOCIAL', description: 'Helped organize charity drive', points: 5, recordedBy: 'Mr. Kumar', actionTaken: 'Appreciation note' },
      { date: '2026-04-10', type: 'NEGATIVE', category: 'DISCIPLINE', description: 'Talking during exam', points: -3, recordedBy: 'Mrs. Iyer', actionTaken: 'Counselling done' },
    ],
    transportAssignment: {
      vehicleNo: 'KA01 AB 1234',
      routeName: 'Route 7 - Indiranagar',
      pickupPoint: 'MG Road Signal',
      dropPoint: 'MG Road Signal',
      driverName: 'Ramesh',
      driverPhone: '+91 99000 11111',
      fee: 3000,
    },
    activities: [
      { name: 'Robotics Club', category: 'TECHNOLOGY', performance: 'Best Robot Award', rating: 5, date: '2026-06-20' },
      { name: 'Cricket', category: 'SPORTS', performance: 'Team Captain', rating: 4, date: '2026-06-15' },
      { name: 'Debate Society', category: 'ACADEMIC', performance: '1st Place Inter-School', rating: 5, date: '2026-05-30' },
    ],
    documents: [
      { title: 'Birth Certificate', type: 'BIRTH_CERT', uploadedOn: '2024-06-15', verified: true },
      { title: 'Aadhaar Card', type: 'AADHAAR', uploadedOn: '2024-06-15', verified: true },
      { title: 'Transfer Certificate', type: 'TC', uploadedOn: '2024-06-15', verified: true },
      { title: 'Previous Report Card', type: 'REPORT', uploadedOn: '2024-06-15', verified: true },
      { title: 'Medical Certificate', type: 'MEDICAL', uploadedOn: '2024-06-15', verified: true },
    ],
    reportCards: [
      { term: 'TERM 1', overallPercentage: 83.8, overallGrade: 'A', overallRank: 3, attendancePercentage: 94.2, conduct: 'Excellent', teacherRemark: 'Aarav is a bright student with excellent analytical skills.', principalRemark: 'Keep up the good work!', generatedAt: '2025-10-15', status: 'PUBLISHED' },
    ],
    ptmMeetings: [
      { date: '2026-06-15', staffName: 'Mrs. Anita Verma', mode: 'OFFLINE', status: 'COMPLETED', agenda: 'Term 1 Performance Review', feedback: 'Parents satisfied with progress. Discussed improving English scores.', parentRating: 5 },
    ],
  },
  {
    id: 'STU-2026-0089',
    admissionNo: 'ADM2026-0089',
    firstName: 'Diya',
    lastName: 'Patel',
    fullName: 'Diya Patel',
    dob: '2015-08-22',
    gender: 'Female',
    bloodGroup: 'O+',
    nationality: 'Indian',
    religion: 'Hindu',
    category: 'General',
    aadhaarNo: 'XXXX-XXXX-7823',
    address: '15, Brigade Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    fatherName: 'Nilesh Patel',
    motherName: 'Priti Patel',
    guardianName: 'Nilesh Patel',
    guardianPhone: '+91 98200 12345',
    guardianEmail: 'nilesh.patel@email.com',
    guardianOccupation: 'Doctor',
    annualIncome: 2200000,
    photo: '👩‍🎓',
    admissionDate: '2023-06-12',
    previousSchool: 'Kendriya Vidyalaya',
    status: 'ACTIVE',
    sectionId: '5-B',
    classId: '5-B',
    attendance: [
      { date: '2026-07-01', status: 'LATE', checkIn: '08:34', checkOut: '15:30', method: 'BIOMETRIC' },
      { date: '2026-06-30', status: 'PRESENT', checkIn: '08:10', checkOut: '15:30', method: 'RFID' },
      { date: '2026-06-29', status: 'PRESENT', checkIn: '08:05', checkOut: '15:30', method: 'FACE' },
    ],
    examScores: [
      { exam: 'Unit Test 1', subject: 'Mathematics', marksObtained: 88, totalMarks: 100, grade: 'A+', percentage: 88, rank: 2, remark: 'Excellent' },
      { exam: 'Unit Test 1', subject: 'Science', marksObtained: 85, totalMarks: 100, grade: 'A', percentage: 85, rank: 3, remark: 'Very Good' },
      { exam: 'Unit Test 1', subject: 'English', marksObtained: 92, totalMarks: 100, grade: 'A+', percentage: 92, rank: 1, remark: 'Outstanding' },
    ],
    fees: [
      { feeType: 'Tuition Q1', amount: 11800, paid: 11800, balance: 0, dueDate: '15 Apr 2026', status: 'PAID', paymentMethod: 'UPI', paidOn: '14 Apr 2026', receiptNo: 'RCP-101' },
      { feeType: 'Tuition Q2', amount: 11800, paid: 5900, balance: 5900, dueDate: '15 Jul 2026', status: 'PARTIAL', paymentMethod: 'Card', paidOn: '10 Jul 2026', receiptNo: 'RCP-102' },
    ],
    leaveRequests: [
      { leaveType: 'Casual Leave', startDate: '2026-06-14', endDate: '2026-06-14', reason: 'Family outing', status: 'APPROVED', daysCount: 1, appliedOn: '2026-06-12' },
    ],
    healthRecords: [
      { date: '2026-06-01', height: 138, weight: 32, bmi: 16.8, bloodPressure: '100/65', vision: '20/20', hearing: 'Normal', allergies: 'Peanuts', chronicConditions: 'None', medications: 'None', doctorName: 'Dr. Reddy', notes: 'Mild peanut allergy - avoid in canteen' },
    ],
    behaviorRecords: [
      { date: '2026-06-20', type: 'POSITIVE', category: 'ACADEMIC', description: 'Best English essay', points: 10, recordedBy: 'Mrs. Iyer', actionTaken: 'Published in school magazine' },
    ],
    activities: [
      { name: 'Classical Dance', category: 'ARTS', performance: '1st Place Cultural Fest', rating: 5, date: '2026-06-10' },
      { name: 'Art Club', category: 'ARTS', performance: 'Best Painting Award', rating: 4, date: '2026-05-25' },
    ],
    documents: [
      { title: 'Birth Certificate', type: 'BIRTH_CERT', uploadedOn: '2023-06-12', verified: true },
      { title: 'Aadhaar Card', type: 'AADHAAR', uploadedOn: '2023-06-12', verified: true },
    ],
    reportCards: [
      { term: 'TERM 1', overallPercentage: 88.3, overallGrade: 'A+', overallRank: 2, attendancePercentage: 92.5, conduct: 'Excellent', teacherRemark: 'Diya excels in languages and arts.', principalRemark: 'Outstanding performance!', generatedAt: '2025-10-15', status: 'PUBLISHED' },
    ],
    ptmMeetings: [
      { date: '2026-06-15', staffName: 'Mrs. Meena Iyer', mode: 'OFFLINE', status: 'COMPLETED', agenda: 'Term 1 Review', feedback: 'Discussed balance between academics and arts.', parentRating: 5 },
    ],
  },
  {
    id: 'STU-2026-0210',
    admissionNo: 'ADM2026-0210',
    firstName: 'Vivaan',
    lastName: 'Gupta',
    fullName: 'Vivaan Gupta',
    dob: '2012-11-03',
    gender: 'Male',
    bloodGroup: 'A+',
    nationality: 'Indian',
    religion: 'Hindu',
    category: 'OBC',
    aadhaarNo: 'XXXX-XXXX-3492',
    address: '78, Jayanagar 4th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560011',
    fatherName: 'Rajesh Gupta',
    motherName: 'Anita Gupta',
    guardianName: 'Rajesh Gupta',
    guardianPhone: '+91 99876 54321',
    guardianEmail: 'rajesh.gupta@email.com',
    guardianOccupation: 'Business Owner',
    annualIncome: 3500000,
    photo: '👨‍🎓',
    admissionDate: '2022-06-10',
    previousSchool: 'Ryan International',
    status: 'ACTIVE',
    sectionId: '8-A',
    classId: '8-A',
    attendance: [
      { date: '2026-07-01', status: 'ABSENT', checkIn: '-', checkOut: '-', method: '-' },
      { date: '2026-06-30', status: 'PRESENT', checkIn: '08:05', checkOut: '15:30', method: 'FACE' },
    ],
    examScores: [
      { exam: 'Unit Test 1', subject: 'Mathematics', marksObtained: 95, totalMarks: 100, grade: 'A+', percentage: 95, rank: 1, remark: 'Outstanding' },
      { exam: 'Unit Test 1', subject: 'Science', marksObtained: 90, totalMarks: 100, grade: 'A+', percentage: 90, rank: 2, remark: 'Excellent' },
    ],
    fees: [
      { feeType: 'Tuition Q1', amount: 14200, paid: 14200, balance: 0, dueDate: '15 Apr 2026', status: 'PAID', paymentMethod: 'Net Banking', paidOn: '12 Apr 2026', receiptNo: 'RCP-201' },
      { feeType: 'Tuition Q2', amount: 14200, paid: 0, balance: 14200, dueDate: '15 Jul 2026', status: 'OVERDUE' },
    ],
    leaveRequests: [
      { leaveType: 'Sick Leave', startDate: '2026-07-01', endDate: '2026-07-01', reason: 'Stomach infection', status: 'PENDING', daysCount: 1, appliedOn: '2026-06-30' },
    ],
    healthRecords: [
      { date: '2026-06-01', height: 165, weight: 52, bmi: 19.1, bloodPressure: '115/75', vision: '20/20', hearing: 'Normal', allergies: 'None', chronicConditions: 'Mild asthma', medications: 'Inhaler as needed', doctorName: 'Dr. Nair', notes: 'Asthma well-controlled. Keep inhaler accessible.' },
    ],
    behaviorRecords: [
      { date: '2026-06-25', type: 'POSITIVE', category: 'ACADEMIC', description: 'Math olympiad state rank 5', points: 15, recordedBy: 'Mr. Sharma', actionTaken: 'Cash prize awarded' },
      { date: '2026-05-15', type: 'POSITIVE', category: 'SOCIAL', description: 'Led team to science fair victory', points: 10, recordedBy: 'Mrs. Verma', actionTaken: 'Featured in newsletter' },
    ],
    transportAssignment: {
      vehicleNo: 'KA01 CD 5678',
      routeName: 'Route 12 - Jayanagar',
      pickupPoint: 'Jayanagar 4th Block',
      dropPoint: 'Jayanagar 4th Block',
      driverName: 'Suresh',
      driverPhone: '+91 98400 56789',
      fee: 3500,
    },
    activities: [
      { name: 'Math Olympiad', category: 'ACADEMIC', performance: 'State Rank 5', rating: 5, date: '2026-06-25' },
      { name: 'Basketball', category: 'SPORTS', performance: 'School Team Vice Captain', rating: 4, date: '2026-06-10' },
      { name: 'Science Club', category: 'ACADEMIC', performance: 'Best Project Award', rating: 5, date: '2026-05-15' },
    ],
    documents: [
      { title: 'Birth Certificate', type: 'BIRTH_CERT', uploadedOn: '2022-06-10', verified: true },
      { title: 'Aadhaar Card', type: 'AADHAAR', uploadedOn: '2022-06-10', verified: true },
      { title: 'Transfer Certificate', type: 'TC', uploadedOn: '2022-06-10', verified: true },
    ],
    reportCards: [
      { term: 'TERM 1', overallPercentage: 92.5, overallGrade: 'A+', overallRank: 1, attendancePercentage: 96.8, conduct: 'Excellent', teacherRemark: 'Vivaan is a gifted student with exceptional mathematical ability.', principalRemark: 'Proud of your achievements!', generatedAt: '2025-10-15', status: 'PUBLISHED' },
    ],
    ptmMeetings: [
      { date: '2026-06-15', staffName: 'Mr. Rajesh Kumar', mode: 'OFFLINE', status: 'COMPLETED', agenda: 'Term 1 Review & Future Planning', feedback: 'Discussed advanced math track. Parents very supportive.', parentRating: 5 },
    ],
  },
  {
    // Sibling of Aarav Singh (STU-2026-0142) — same guardianPhone +91 98765 43210, same address
    id: 'STU-2026-0188',
    admissionNo: 'ADM2026-0188',
    firstName: 'Anaya',
    lastName: 'Singh',
    fullName: 'Anaya Singh',
    dob: '2015-09-22',
    gender: 'Female',
    bloodGroup: 'B+',
    nationality: 'Indian',
    religion: 'Hindu',
    category: 'General',
    aadhaarNo: 'XXXX-XXXX-7820',
    address: '42, MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    fatherName: 'Suresh Singh',
    motherName: 'Sunita Singh',
    guardianName: 'Suresh Singh',
    guardianPhone: '+91 98765 43210',
    guardianEmail: 'suresh.singh@email.com',
    guardianOccupation: 'Software Engineer',
    annualIncome: 1800000,
    photo: '👧',
    admissionDate: '2025-06-12',
    previousSchool: 'Delhi Public School',
    status: 'ACTIVE',
    sectionId: '5-B',
    classId: '5-B',
    attendance: [
      { date: '2026-07-01', status: 'PRESENT', checkIn: '08:15', checkOut: '15:30', method: 'FACE' },
      { date: '2026-06-30', status: 'PRESENT', checkIn: '08:10', checkOut: '15:30', method: 'FACE' },
      { date: '2026-06-29', status: 'PRESENT', checkIn: '08:18', checkOut: '15:30', method: 'FACE' },
    ],
    examScores: [
      { exam: 'Unit Test 1', subject: 'English', maxMarks: 50, scored: 44, grade: 'A', date: '2026-06-20' },
      { exam: 'Unit Test 1', subject: 'Maths', maxMarks: 50, scored: 47, grade: 'A+', date: '2026-06-22' },
      { exam: 'Unit Test 1', subject: 'Science', maxMarks: 50, scored: 42, grade: 'A', date: '2026-06-24' },
    ],
    fees: [
      { feeType: 'Tuition Q1', amount: 11500, paid: 11500, balance: 0, dueDate: '15 Apr 2026', status: 'PAID', paymentMethod: 'UPI', paidOn: '10 Apr 2026', receiptNo: 'RCP-301' },
      { feeType: 'Tuition Q2', amount: 11500, paid: 11500, balance: 0, dueDate: '15 Jul 2026', status: 'PAID', paymentMethod: 'UPI', paidOn: '10 Jul 2026', receiptNo: 'RCP-302' },
      { feeType: 'Transport', amount: 3000, paid: 3000, balance: 0, dueDate: '15 Jul 2026', status: 'PAID', paymentMethod: 'UPI', paidOn: '12 Jul 2026', receiptNo: 'RCP-303' },
    ],
    leaveRequests: [],
    healthRecords: [
      { date: '2026-04-12', issue: 'Seasonal Cold', treatment: 'Rest + fluids', prescribedBy: 'Dr. Mehta', notes: 'Recovered in 2 days' },
    ],
    behaviorRecords: [
      { date: '2026-06-15', type: 'POSITIVE', description: 'Helped organize class library', points: 5, recordedBy: 'Mrs. Meena Iyer' },
    ],
    transportAssignment: {
      routeId: 'RTE-002',
      routeName: 'Indiranagar → LearnX',
      vehicleNo: 'KA-01-MN-3344',
      pickupPoint: 'MG Road Junction',
      dropPoint: 'MG Road Junction',
      pickupTime: '07:35 AM',
      dropTime: '04:15 PM',
    },
    activities: [
      { name: 'Classical Dance', role: 'Member', achievements: 'Won 2nd place at Inter-School Cultural Fest 2026' },
    ],
    documents: [
      { title: 'Birth Certificate', type: 'BIRTH_CERT', uploadedOn: '2025-06-12', verified: true },
      { title: 'Aadhaar Card', type: 'AADHAAR', uploadedOn: '2025-06-12', verified: true },
    ],
    reportCards: [
      { term: 'TERM 1', overallPercentage: 88.0, overallGrade: 'A', overallRank: 4, attendancePercentage: 95.2, conduct: 'Excellent', teacherRemark: 'Anaya shows great creativity and teamwork.', principalRemark: 'Keep it up!', generatedAt: '2025-10-15', status: 'PUBLISHED' },
    ],
    ptmMeetings: [
      { date: '2026-06-15', staffName: 'Mrs. Meena Iyer', mode: 'OFFLINE', status: 'COMPLETED', agenda: 'Term 1 Performance Review', feedback: 'Parents happy with progress. Discussed encouraging dance talent.', parentRating: 5 },
    ],
  },
]

// ============ TEACHERS DATA ============
export const TEACHERS: Teacher[] = [
  {
    id: 'STF-0042',
    employeeId: 'EMP-T-0042',
    firstName: 'Anita',
    lastName: 'Verma',
    fullName: 'Mrs. Anita Verma',
    dob: '1985-03-15',
    gender: 'Female',
    bloodGroup: 'B+',
    qualification: 'M.Sc, B.Ed',
    experience: 12,
    designation: 'Senior Teacher',
    department: 'Mathematics',
    subjectSpecialization: 'Mathematics & Physics',
    joiningDate: '2014-06-01',
    phone: '+91 98111 22334',
    email: 'anita.verma@learnx.edu',
    address: '25, HSR Layout, Bengaluru',
    aadhaarNo: 'XXXX-XXXX-1122',
    panNo: 'ABCDE1234F',
    bankAccountNo: 'XXXX-XXXX-4567',
    bankIfsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    photo: '👩‍🏫',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    attendance: [
      { date: '2026-07-01', status: 'PRESENT', checkIn: '07:45', checkOut: '15:30', workHours: 7.75 },
      { date: '2026-06-30', status: 'PRESENT', checkIn: '07:50', checkOut: '15:30', workHours: 7.67 },
      { date: '2026-06-29', status: 'PRESENT', checkIn: '07:48', checkOut: '15:30', workHours: 7.7 },
    ],
    salaryRecords: [
      { month: '2026-06', basicSalary: 45000, grossSalary: 62000, netSalary: 54000, pfDeduction: 5400, taxDeduction: 2600, status: 'PAID', paidOn: '2026-06-30' },
      { month: '2026-05', basicSalary: 45000, grossSalary: 62000, netSalary: 54000, pfDeduction: 5400, taxDeduction: 2600, status: 'PAID', paidOn: '2026-05-30' },
    ],
    leaveRequests: [
      { leaveType: 'Casual Leave', startDate: '2026-05-15', endDate: '2026-05-15', reason: 'Personal work', status: 'APPROVED', daysCount: 1, appliedOn: '2026-05-13' },
    ],
    classesTaught: ['7-A', '7-B', '8-A', '8-B'],
    subjectsTaught: ['Mathematics', 'Physics'],
    documents: [
      { title: 'M.Sc Certificate', type: 'EDUCATION', uploadedOn: '2014-06-01', verified: true },
      { title: 'B.Ed Certificate', type: 'EDUCATION', uploadedOn: '2014-06-01', verified: true },
      { title: 'Experience Letter', type: 'EXPERIENCE', uploadedOn: '2014-06-01', verified: true },
    ],
  },
  {
    id: 'STF-0018',
    employeeId: 'EMP-T-0018',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    fullName: 'Mr. Rajesh Kumar',
    dob: '1980-07-22',
    gender: 'Male',
    bloodGroup: 'O+',
    qualification: 'M.A, B.Ed',
    experience: 18,
    designation: 'Head of Department',
    department: 'Science',
    subjectSpecialization: 'Physics & Chemistry',
    joiningDate: '2008-06-01',
    phone: '+91 99000 11111',
    email: 'rajesh.kumar@learnx.edu',
    address: '58, Whitefield, Bengaluru',
    aadhaarNo: 'XXXX-XXXX-3344',
    panNo: 'GHIJK5678L',
    bankAccountNo: 'XXXX-XXXX-8901',
    bankIfsc: 'SBIN0005678',
    bankName: 'State Bank of India',
    photo: '👨‍🏫',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    attendance: [
      { date: '2026-07-01', status: 'PRESENT', checkIn: '07:50', checkOut: '15:30', workHours: 7.67 },
      { date: '2026-06-30', status: 'PRESENT', checkIn: '07:45', checkOut: '15:30', workHours: 7.75 },
    ],
    salaryRecords: [
      { month: '2026-06', basicSalary: 55000, grossSalary: 75000, netSalary: 66000, pfDeduction: 6600, taxDeduction: 2400, status: 'PAID', paidOn: '2026-06-30' },
    ],
    leaveRequests: [],
    classesTaught: ['9-A', '9-B', '10-A', '10-B'],
    subjectsTaught: ['Physics', 'Chemistry'],
    documents: [
      { title: 'M.A Certificate', type: 'EDUCATION', uploadedOn: '2008-06-01', verified: true },
      { title: 'B.Ed Certificate', type: 'EDUCATION', uploadedOn: '2008-06-01', verified: true },
    ],
  },
]

// ============ STAFF DATA ============
export const STAFF: Staff[] = [
  {
    id: 'STF-0031',
    employeeId: 'EMP-S-0031',
    firstName: 'Vikram',
    lastName: 'Nair',
    fullName: 'Dr. Vikram Nair',
    dob: '1975-12-10',
    gender: 'Male',
    qualification: 'MBBS, MD',
    designation: 'School Medical Officer',
    department: 'Health & Wellness',
    joiningDate: '2015-06-01',
    phone: '+91 98400 12345',
    email: 'vikram.nair@learnx.edu',
    address: '12, Indiranagar, Bengaluru',
    photo: '👨‍⚕️',
    status: 'ACTIVE',
    attendance: [
      { date: '2026-07-01', status: 'PRESENT', checkIn: '08:00', checkOut: '16:00', workHours: 8 },
      { date: '2026-06-30', status: 'PRESENT', checkIn: '08:00', checkOut: '16:00', workHours: 8 },
    ],
    salaryRecords: [
      { month: '2026-06', basicSalary: 60000, grossSalary: 80000, netSalary: 70000, pfDeduction: 7200, taxDeduction: 2800, status: 'PAID', paidOn: '2026-06-30' },
    ],
    leaveRequests: [],
    documents: [
      { title: 'MBBS Certificate', type: 'EDUCATION', uploadedOn: '2015-06-01', verified: true },
      { title: 'MD Certificate', type: 'EDUCATION', uploadedOn: '2015-06-01', verified: true },
      { title: 'Medical License', type: 'LICENSE', uploadedOn: '2015-06-01', verified: true },
    ],
  },
]

// ============ SEARCH FUNCTION ============
export interface SearchResult {
  type: 'student' | 'teacher' | 'staff'
  id: string
  name: string
  subtitle: string
  photo: string
  data: Student | Teacher | Staff
}

export function searchPeople(query: string): SearchResult[] {
  if (!query || query.trim().length < 1) return []
  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []

  // Search students
  STUDENTS.forEach((s) => {
    if (
      s.fullName.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.fatherName.toLowerCase().includes(q) ||
      s.guardianPhone.includes(q) ||
      s.sectionId.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'student',
        id: s.id,
        name: s.fullName,
        subtitle: `${s.sectionId} · ${s.admissionNo}`,
        photo: s.photo,
        data: s,
      })
    }
  })

  // Search teachers
  TEACHERS.forEach((t) => {
    if (
      t.fullName.toLowerCase().includes(q) ||
      t.employeeId.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.subjectSpecialization.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'teacher',
        id: t.id,
        name: t.fullName,
        subtitle: `${t.designation} · ${t.department}`,
        photo: t.photo,
        data: t,
      })
    }
  })

  // Search staff
  STAFF.forEach((s) => {
    if (
      s.fullName.toLowerCase().includes(q) ||
      s.employeeId.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.designation.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'staff',
        id: s.id,
        name: s.fullName,
        subtitle: `${s.designation} · ${s.department}`,
        photo: s.photo,
        data: s,
      })
    }
  })

  return results.slice(0, 10) // Limit to 10 results
}
