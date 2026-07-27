'use client'

/**
 * AICareerEnhanced — AI Career Counsellor module
 *
 * Reference: aicareercounsellor.space-z.ai — an AI-powered career guidance tool for students.
 *
 * Features:
 *   - Student Profile form: Name, Grade, Age, Interests (multi-select chips),
 *     Strengths (multi-select), Academic Performance (Excellent/Good/Average/Below Average)
 *   - Aptitude Assessment: 5 quick scenario questions covering logical, verbal,
 *     numerical, spatial, and interpersonal reasoning (each scored 1–5)
 *   - "Generate Career Analysis" produces:
 *       · Career Match Score (0–100) for top 5 career paths
 *       · Per career: name, match %, description, required skills,
 *         recommended courses/streams, expected salary range
 *       · Personality type analysis (The Innovator / Helper / Leader / etc.)
 *       · Strengths summary + Development areas + Next steps
 *   - Career path cards with animated gradient progress bars
 *   - "Send Report to Parent" via useNotificationPreview
 *   - Self-contained (no API calls), with rich demo data
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, GraduationCap, Target, TrendingUp, Award, Brain, Send, User,
  CheckCircle2, Star, ChevronRight, Bot, Sparkles, Heart, Zap, RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

// ============ Types ============
type AptitudeDomain = 'logical' | 'verbal' | 'numerical' | 'spatial' | 'interpersonal'
type AptitudeScores = Record<AptitudeDomain, number>

interface AptitudeOption { text: string; score: number }
interface AptitudeQuestion {
  domain: AptitudeDomain
  label: string
  question: string
  options: AptitudeOption[]
}

interface Career {
  id: string
  name: string
  emoji: string
  description: string
  interests: string[]
  strengths: string[]
  aptitudes: Partial<Record<AptitudeDomain, number>>
  requiredSkills: string[]
  courses: string[]
  salaryRange: string
  accent: string
}

interface PersonalityType {
  id: string
  name: string
  tagline: string
  description: string
  icon: any
  accent: string
  interests: string[]
  strengths: string[]
  aptitudes: Partial<Record<AptitudeDomain, number>>
}

interface CareerResult extends Career {
  matchScore: number
  matchReasons: string[]
}

interface Analysis {
  personality: PersonalityType
  topCareers: CareerResult[]
  strengthsSummary: string[]
  developmentAreas: string[]
  nextSteps: string[]
  generatedAt: string
}

interface StudentProfile {
  name: string
  grade: string
  age: string
  interests: string[]
  strengths: string[]
  performance: 'Excellent' | 'Good' | 'Average' | 'Below Average'
}

// ============ Constants ============
const INTERESTS = [
  'Technology', 'Medicine', 'Business', 'Arts', 'Sports', 'Science',
  'Literature', 'Social Work', 'Engineering', 'Law', 'Design', 'Music',
]

const STRENGTHS_LIST = [
  'Analytical Thinking', 'Communication', 'Creativity', 'Leadership',
  'Problem Solving', 'Teamwork', 'Writing', 'Mathematics',
  'Public Speaking', 'Research',
]

const PERFORMANCE_LEVELS = ['Excellent', 'Good', 'Average', 'Below Average'] as const
const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)
const PERFORMANCE_SCORES: Record<string, number> = {
  Excellent: 1.0, Good: 0.85, Average: 0.65, 'Below Average': 0.45,
}

// ============ Aptitude Questions (5 quick scenarios, each scored 1–5) ============
const APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  {
    domain: 'logical',
    label: 'Logical Reasoning',
    question: 'When faced with a complex puzzle you have never seen before, you typically…',
    options: [
      { text: 'Give up quickly', score: 1 },
      { text: 'Try one approach and stop if it fails', score: 2 },
      { text: 'Try multiple approaches systematically', score: 3 },
      { text: 'Break it down into smaller parts and solve each', score: 4 },
      { text: 'Love the challenge and methodically crack it', score: 5 },
    ],
  },
  {
    domain: 'verbal',
    label: 'Verbal Ability',
    question: 'When explaining a complex idea to others, you…',
    options: [
      { text: 'Struggle to find the right words', score: 1 },
      { text: 'Use simple examples to convey it', score: 2 },
      { text: 'Use analogies to clarify meaning', score: 3 },
      { text: 'Adapt your language to your audience', score: 4 },
      { text: 'Craft compelling narratives that engage everyone', score: 5 },
    ],
  },
  {
    domain: 'numerical',
    label: 'Numerical Aptitude',
    question: 'When you see a table of numbers and statistics, you…',
    options: [
      { text: 'Get confused and skip past it', score: 1 },
      { text: 'Skim to the conclusion only', score: 2 },
      { text: 'Read it carefully to understand', score: 3 },
      { text: 'Look for trends and patterns', score: 4 },
      { text: 'Immediately spot errors and insights', score: 5 },
    ],
  },
  {
    domain: 'spatial',
    label: 'Spatial Reasoning',
    question: 'Visualising how an unfolded 3D box would look when folded is…',
    options: [
      { text: 'Very hard for me', score: 1 },
      { text: 'Somewhat hard', score: 2 },
      { text: 'Doable with effort', score: 3 },
      { text: 'Easy for me', score: 4 },
      { text: 'Effortless — I see it instantly', score: 5 },
    ],
  },
  {
    domain: 'interpersonal',
    label: 'Interpersonal Skills',
    question: 'In group conflicts, you typically…',
    options: [
      { text: 'Avoid them entirely', score: 1 },
      { text: 'Take sides quickly', score: 2 },
      { text: 'Stay neutral and quiet', score: 3 },
      { text: 'Help mediate between parties', score: 4 },
      { text: 'Easily resolve and unite the group', score: 5 },
    ],
  },
]

// ============ Career Database (12 rich careers) ============
const CAREER_DB: Career[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    emoji: '💻',
    description: 'Designs and builds software applications, apps, and systems that power the digital world — from mobile apps to cloud platforms.',
    interests: ['Technology', 'Engineering'],
    strengths: ['Analytical Thinking', 'Problem Solving', 'Mathematics'],
    aptitudes: { logical: 0.35, numerical: 0.25, spatial: 0.15, verbal: 0.10, interpersonal: 0.15 },
    requiredSkills: ['Programming (Python, Java, JS)', 'Data Structures', 'Algorithms', 'Problem Solving', 'System Design'],
    courses: ['B.Tech / B.E. in Computer Science', 'B.Sc. Computer Science', 'Diploma in Software Engineering'],
    salaryRange: '₹6,00,000 – ₹40,00,000 / year',
    accent: '#3B82F6',
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    emoji: '📊',
    description: 'Analyses large datasets to uncover insights, build predictive models, and drive data-informed decisions.',
    interests: ['Technology', 'Science', 'Business'],
    strengths: ['Analytical Thinking', 'Mathematics', 'Research'],
    aptitudes: { logical: 0.30, numerical: 0.35, spatial: 0.10, verbal: 0.10, interpersonal: 0.15 },
    requiredSkills: ['Statistics', 'Python / R', 'Machine Learning', 'Data Visualisation', 'SQL'],
    courses: ['B.Tech / M.Sc. in Data Science', 'B.Stat / B.Sc. Statistics', 'PG Diploma in Analytics'],
    salaryRange: '₹8,00,000 – ₹35,00,000 / year',
    accent: '#8B5CF6',
  },
  {
    id: 'doctor',
    name: 'Doctor (Physician)',
    emoji: '🩺',
    description: 'Diagnoses and treats patients, improves lives through medical science, and leads healthcare teams.',
    interests: ['Medicine', 'Science', 'Social Work'],
    strengths: ['Problem Solving', 'Communication', 'Research'],
    aptitudes: { logical: 0.25, numerical: 0.15, spatial: 0.20, verbal: 0.20, interpersonal: 0.20 },
    requiredSkills: ['Biology', 'Chemistry', 'Empathy', 'Decision-Making', 'Stamina'],
    courses: ['MBBS (5.5 yr incl. internship)', 'BDS (Dental)', 'B.Sc. Nursing / Pharma'],
    salaryRange: '₹8,00,000 – ₹50,00,000 / year',
    accent: '#EF4444',
  },
  {
    id: 'architect',
    name: 'Architect',
    emoji: '🏛️',
    description: 'Designs buildings and spaces, blending art, science, and engineering to shape the built environment.',
    interests: ['Design', 'Engineering', 'Arts'],
    strengths: ['Creativity', 'Problem Solving', 'Analytical Thinking'],
    aptitudes: { logical: 0.20, numerical: 0.15, spatial: 0.35, verbal: 0.15, interpersonal: 0.15 },
    requiredSkills: ['Design Software (AutoCAD, SketchUp)', 'Sketching', 'Building Codes', 'Spatial Sense'],
    courses: ['B.Arch (5-year)', 'B.Des. Architecture', 'Diploma in Architecture'],
    salaryRange: '₹5,00,000 – ₹25,00,000 / year',
    accent: '#F59E0B',
  },
  {
    id: 'chartered-accountant',
    name: 'Chartered Accountant',
    emoji: '💼',
    description: 'Manages finances, audits accounts, and advises businesses on tax, strategy, and compliance.',
    interests: ['Business', 'Law'],
    strengths: ['Analytical Thinking', 'Mathematics', 'Research'],
    aptitudes: { logical: 0.30, numerical: 0.35, spatial: 0.05, verbal: 0.15, interpersonal: 0.15 },
    requiredSkills: ['Accounting', 'Taxation', 'Auditing', 'Financial Analysis', 'Excel'],
    courses: ['CA (ICAI)', 'B.Com + ACCA', 'CFA / CMA'],
    salaryRange: '₹7,00,000 – ₹40,00,000 / year',
    accent: '#10B981',
  },
  {
    id: 'lawyer',
    name: 'Lawyer / Advocate',
    emoji: '⚖️',
    description: 'Argues cases, advises clients, and shapes the legal system through advocacy and counsel.',
    interests: ['Law', 'Social Work', 'Literature'],
    strengths: ['Communication', 'Public Speaking', 'Research', 'Writing'],
    aptitudes: { logical: 0.25, numerical: 0.05, spatial: 0.10, verbal: 0.35, interpersonal: 0.25 },
    requiredSkills: ['Legal Research', 'Argumentation', 'Writing', 'Public Speaking', 'Negotiation'],
    courses: ['BA LLB (5-year integrated)', 'LLB (3-year after graduation)', 'LLM for specialisation'],
    salaryRange: '₹6,00,000 – ₹45,00,000 / year',
    accent: '#1E3A8A',
  },
  {
    id: 'graphic-designer',
    name: 'Graphic Designer',
    emoji: '🎨',
    description: 'Creates visual concepts that inspire, inform, and captivate consumers across digital and print media.',
    interests: ['Design', 'Arts', 'Music'],
    strengths: ['Creativity', 'Communication', 'Writing'],
    aptitudes: { logical: 0.10, numerical: 0.05, spatial: 0.40, verbal: 0.20, interpersonal: 0.25 },
    requiredSkills: ['Adobe Creative Suite', 'Typography', 'Colour Theory', 'UI/UX Basics'],
    courses: ['B.Des. Graphic Design', 'BFA (Fine Arts)', 'Diploma in Design'],
    salaryRange: '₹4,00,000 – ₹18,00,000 / year',
    accent: '#EC4899',
  },
  {
    id: 'marketing-manager',
    name: 'Marketing Manager',
    emoji: '📣',
    description: 'Drives brand growth, customer engagement, and market strategy across channels and campaigns.',
    interests: ['Business', 'Arts', 'Literature'],
    strengths: ['Communication', 'Leadership', 'Public Speaking', 'Creativity'],
    aptitudes: { logical: 0.20, numerical: 0.20, spatial: 0.10, verbal: 0.25, interpersonal: 0.25 },
    requiredSkills: ['Strategy', 'Communication', 'Analytics', 'Storytelling', 'Social Media'],
    courses: ['BBA / MBA Marketing', 'BMS Marketing', 'PG Diploma in Digital Marketing'],
    salaryRange: '₹6,00,000 – ₹30,00,000 / year',
    accent: '#F97316',
  },
  {
    id: 'research-scientist',
    name: 'Research Scientist',
    emoji: '🔬',
    description: 'Conducts experiments to discover new knowledge in science, technology, and engineering domains.',
    interests: ['Science', 'Technology', 'Engineering'],
    strengths: ['Research', 'Analytical Thinking', 'Problem Solving'],
    aptitudes: { logical: 0.30, numerical: 0.25, spatial: 0.10, verbal: 0.20, interpersonal: 0.15 },
    requiredSkills: ['Research Methods', 'Lab Techniques', 'Scientific Writing', 'Critical Thinking'],
    courses: ['B.Sc / M.Sc in chosen field', 'B.Tech + MS (Research)', 'PhD track'],
    salaryRange: '₹6,00,000 – ₹30,00,000 / year',
    accent: '#06B6D4',
  },
  {
    id: 'civil-servant',
    name: 'Civil Servant (IAS / IPS)',
    emoji: '🛡️',
    description: 'Serves the nation through administration, policy-making, and public service leadership.',
    interests: ['Social Work', 'Law', 'Business'],
    strengths: ['Leadership', 'Communication', 'Public Speaking', 'Research'],
    aptitudes: { logical: 0.20, numerical: 0.15, spatial: 0.05, verbal: 0.35, interpersonal: 0.25 },
    requiredSkills: ['General Knowledge', 'Essay Writing', 'Decision-Making', 'Ethics', 'Public Policy'],
    courses: ['Graduation in any stream + UPSC CSE', 'Optional subject specialisation'],
    salaryRange: '₹7,00,000 – ₹25,00,000 / year',
    accent: '#475569',
  },
  {
    id: 'content-writer',
    name: 'Content Writer / Author',
    emoji: '✍️',
    description: 'Crafts written content that informs, persuades, and entertains — across books, blogs, and brands.',
    interests: ['Literature', 'Arts', 'Social Work'],
    strengths: ['Writing', 'Creativity', 'Research', 'Communication'],
    aptitudes: { logical: 0.15, numerical: 0.05, spatial: 0.10, verbal: 0.45, interpersonal: 0.25 },
    requiredSkills: ['Grammar', 'Storytelling', 'SEO', 'Editing', 'Research'],
    courses: ['BA English / Journalism', 'BMM Mass Media', 'Creative Writing Certifications'],
    salaryRange: '₹3,50,000 – ₹15,00,000 / year',
    accent: '#A855F7',
  },
  {
    id: 'sports-manager',
    name: 'Sports Manager / Coach',
    emoji: '🏆',
    description: 'Leads athletes and teams, manages sports programmes, and drives performance and wellbeing.',
    interests: ['Sports', 'Business', 'Social Work'],
    strengths: ['Leadership', 'Teamwork', 'Communication'],
    aptitudes: { logical: 0.20, numerical: 0.15, spatial: 0.15, verbal: 0.20, interpersonal: 0.30 },
    requiredSkills: ['Sport Knowledge', 'Leadership', 'Strategy', 'Fitness', 'Team Management'],
    courses: ['BBA Sports Management', 'B.P.Ed / M.P.Ed', 'Diploma in Sports Coaching'],
    salaryRange: '₹4,00,000 – ₹22,00,000 / year',
    accent: '#16A34A',
  },
]

// ============ Personality Types ============
const PERSONALITY_TYPES: PersonalityType[] = [
  {
    id: 'innovator',
    name: 'The Innovator',
    tagline: 'You see what could be — and build it.',
    description: 'A creative problem-solver who thrives on turning new ideas into reality. You combine analytical thinking with bold imagination, making you ideal for technology, design, and entrepreneurship.',
    icon: Zap,
    accent: '#F97316',
    interests: ['Technology', 'Engineering', 'Design'],
    strengths: ['Analytical Thinking', 'Problem Solving', 'Creativity'],
    aptitudes: { logical: 0.4, spatial: 0.3, numerical: 0.2, verbal: 0.05, interpersonal: 0.05 },
  },
  {
    id: 'helper',
    name: 'The Helper',
    tagline: 'You make lives better — one person at a time.',
    description: 'A compassionate soul who finds purpose in serving others. With strong empathy and communication, you shine in medicine, social work, and teaching.',
    icon: Heart,
    accent: '#EF4444',
    interests: ['Medicine', 'Social Work', 'Literature'],
    strengths: ['Communication', 'Teamwork', 'Writing'],
    aptitudes: { interpersonal: 0.5, verbal: 0.3, logical: 0.1, numerical: 0.05, spatial: 0.05 },
  },
  {
    id: 'leader',
    name: 'The Leader',
    tagline: 'You inspire action — and people follow.',
    description: 'A natural decision-maker who rallies teams and drives results. Your confidence, communication, and strategic thinking make you suited for management, law, and public service.',
    icon: Award,
    accent: '#1E3A8A',
    interests: ['Business', 'Law', 'Sports'],
    strengths: ['Leadership', 'Public Speaking', 'Communication'],
    aptitudes: { interpersonal: 0.35, verbal: 0.35, logical: 0.15, numerical: 0.10, spatial: 0.05 },
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    tagline: 'You turn data into decisions.',
    description: 'A logical thinker who loves patterns, numbers, and structured problems. You thrive in research, finance, and engineering where precision is rewarded.',
    icon: Brain,
    accent: '#8B5CF6',
    interests: ['Science', 'Technology', 'Business'],
    strengths: ['Mathematics', 'Analytical Thinking', 'Research'],
    aptitudes: { numerical: 0.4, logical: 0.35, verbal: 0.10, spatial: 0.10, interpersonal: 0.05 },
  },
  {
    id: 'creator',
    name: 'The Creator',
    tagline: 'You give form to imagination.',
    description: 'An expressive artist who brings beauty and meaning into the world. You excel in design, writing, music, and the visual arts where originality matters.',
    icon: Sparkles,
    accent: '#EC4899',
    interests: ['Arts', 'Design', 'Music', 'Literature'],
    strengths: ['Creativity', 'Writing', 'Communication'],
    aptitudes: { spatial: 0.35, verbal: 0.35, logical: 0.10, numerical: 0.05, interpersonal: 0.15 },
  },
  {
    id: 'scholar',
    name: 'The Scholar',
    tagline: 'You seek truth — and share it.',
    description: 'A curious researcher who loves deep study and rigorous thinking. You shine in academia, science, and law where knowledge is currency.',
    icon: GraduationCap,
    accent: '#06B6D4',
    interests: ['Science', 'Literature', 'Law'],
    strengths: ['Research', 'Writing', 'Analytical Thinking'],
    aptitudes: { verbal: 0.30, logical: 0.30, numerical: 0.20, spatial: 0.10, interpersonal: 0.10 },
  },
]

// ============ Scoring helpers ============
function dotProduct(weights: Partial<Record<AptitudeDomain, number>>, scores: AptitudeScores): number {
  // weighted average of aptitude scores, normalised to 0..1 (scores are 1..5)
  let total = 0
  let weightSum = 0
  for (const k of Object.keys(weights) as AptitudeDomain[]) {
    const w = weights[k] || 0
    total += (scores[k] || 3) / 5 * w
    weightSum += w
  }
  return weightSum > 0 ? total / weightSum : 0.5
}

function scoreCareer(
  career: Career,
  profile: StudentProfile,
  aptitude: AptitudeScores,
): { matchScore: number; matchReasons: string[] } {
  const interestMatch = career.interests.length
    ? career.interests.filter(i => profile.interests.includes(i)).length / career.interests.length
    : 0
  const strengthMatch = career.strengths.length
    ? career.strengths.filter(s => profile.strengths.includes(s)).length / career.strengths.length
    : 0
  const aptitudeMatch = dotProduct(career.aptitudes, aptitude)
  const perfScore = PERFORMANCE_SCORES[profile.performance] ?? 0.65

  // Weights: interests 30%, strengths 30%, aptitude 25%, performance 15%
  const raw = interestMatch * 0.30 + strengthMatch * 0.30 + aptitudeMatch * 0.25 + perfScore * 0.15

  const matchReasons: string[] = []
  if (interestMatch >= 0.5) matchReasons.push(`${Math.round(interestMatch * 100)}% interest alignment`)
  if (strengthMatch >= 0.5) matchReasons.push(`${Math.round(strengthMatch * 100)}% strength match`)
  if (aptitudeMatch >= 0.7) matchReasons.push('Strong aptitude fit')
  if (perfScore >= 0.85) matchReasons.push('Academic performance supports path')
  if (matchReasons.length === 0) matchReasons.push('Exploratory match — good starting point')

  const matchScore = Math.round(Math.min(100, Math.max(38, raw * 100 + (interestMatch > 0 ? 6 : 0))))
  return { matchScore, matchReasons }
}

function scorePersonality(p: PersonalityType, profile: StudentProfile, aptitude: AptitudeScores): number {
  const interestMatch = p.interests.filter(i => profile.interests.includes(i)).length / Math.max(p.interests.length, 1)
  const strengthMatch = p.strengths.filter(s => profile.strengths.includes(s)).length / Math.max(p.strengths.length, 1)
  const aptitudeMatch = dotProduct(p.aptitudes, aptitude)
  return interestMatch * 0.35 + strengthMatch * 0.35 + aptitudeMatch * 0.30
}

// ============ Main component ============
export function AICareerEnhanced() {
  const { preview } = useNotificationPreview()

  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    grade: 'Grade 10',
    age: '',
    interests: [],
    strengths: [],
    performance: 'Good',
  })
  const [aptitude, setAptitude] = useState<Record<AptitudeDomain, number>>({
    logical: 0, verbal: 0, numerical: 0, spatial: 0, interpersonal: 0,
  })
  const [generating, setGenerating] = useState(false)
  const [stage, setStage] = useState(0)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  // ---- chip toggles ----
  const toggleInterest = (i: string) => {
    setProfile(p => ({
      ...p,
      interests: p.interests.includes(i)
        ? p.interests.filter(x => x !== i)
        : [...p.interests, i],
    }))
  }
  const toggleStrength = (s: string) => {
    setProfile(p => ({
      ...p,
      strengths: p.strengths.includes(s)
        ? p.strengths.filter(x => x !== s)
        : [...p.strengths, s],
    }))
  }

  // ---- generate analysis ----
  const handleGenerate = useCallback(() => {
    if (!profile.name.trim()) {
      toast.error('Please enter the student name')
      return
    }
    if (profile.interests.length === 0) {
      toast.error('Please pick at least one interest')
      return
    }
    if (profile.strengths.length === 0) {
      toast.error('Please pick at least one strength')
      return
    }

    setGenerating(true)
    setAnalysis(null)
    setStage(0)

    // Simulate AI processing stages
    const stages = [400, 800, 1200]
    stages.forEach((t, i) => setTimeout(() => setStage(i + 1), t))

    setTimeout(() => {
      // Fill unanswered aptitude questions with neutral 3
      const a: AptitudeScores = {
        logical: aptitude.logical || 3,
        verbal: aptitude.verbal || 3,
        numerical: aptitude.numerical || 3,
        spatial: aptitude.spatial || 3,
        interpersonal: aptitude.interpersonal || 3,
      }

      // Score careers
      const topCareers: CareerResult[] = CAREER_DB
        .map(c => ({ ...c, ...scoreCareer(c, profile, a) }))
        .sort((x, y) => y.matchScore - x.matchScore)
        .slice(0, 5)

      // Personality
      const personality = [...PERSONALITY_TYPES]
        .map(p => ({ p, s: scorePersonality(p, profile, a) }))
        .sort((x, y) => y.s - x.s)[0].p

      // Strengths summary: highlight top 3 user-selected strengths with descriptor
      const strengthDescriptors: Record<string, string> = {
        'Analytical Thinking': 'breaking down complex problems logically',
        'Communication': 'expressing ideas clearly and persuasively',
        'Creativity': 'generating original and imaginative ideas',
        'Leadership': 'guiding and inspiring teams towards goals',
        'Problem Solving': 'finding effective solutions to challenges',
        'Teamwork': 'collaborating effectively with diverse groups',
        'Writing': 'crafting clear and engaging written content',
        'Mathematics': 'reasoning with numbers, patterns, and logic',
        'Public Speaking': 'presenting confidently to audiences',
        'Research': 'gathering, analysing, and synthesising information',
      }
      const strengthsSummary = profile.strengths.slice(0, 4).map(s => strengthDescriptors[s] || s.toLowerCase())

      // Development areas: strengths not chosen but relevant to top careers
      const devPool = new Set<string>()
      topCareers.slice(0, 3).forEach(c => c.strengths.forEach(s => devPool.add(s)))
      const developmentAreas = Array.from(devPool)
        .filter(s => !profile.strengths.includes(s))
        .slice(0, 4)
      if (developmentAreas.length === 0) {
        developmentAreas.push('Time management', 'Networking', 'Public speaking', 'Coding fundamentals')
      }

      // Next steps
      const topCareer = topCareers[0]
      const nextSteps = [
        `Explore "${topCareer.name}" — start with the recommended course: ${topCareer.courses[0]}.`,
        `Build your "${profile.strengths[0] || 'top strength'}" by joining a club, workshop, or online community.`,
        `Improve on "${developmentAreas[0]}" through deliberate practice and feedback from mentors.`,
        `Speak to 2 professionals in the ${topCareer.interests[0] || 'related'} field for real-world insights.`,
        `Take a deeper psychometric test and revisit this analysis in 6 months to track growth.`,
      ]

      setAnalysis({
        personality,
        topCareers,
        strengthsSummary,
        developmentAreas,
        nextSteps,
        generatedAt: new Date().toISOString(),
      })
      setGenerating(false)
      toast.success('Career analysis generated')
    }, 1600)
  }, [profile, aptitude])

  // ---- send to parent ----
  const sendToParent = useCallback(() => {
    if (!analysis) return
    const lines: string[] = []
    lines.push(`Dear Parent,`)
    lines.push(``)
    lines.push(`Here is the AI Career Analysis report for ${profile.name || 'your child'} (${profile.grade}).`)
    lines.push(``)
    lines.push(`Personality Type: ${analysis.personality.name} — ${analysis.personality.tagline}`)
    lines.push(``)
    lines.push(`Top 5 Career Paths:`)
    analysis.topCareers.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.name} — ${c.matchScore}% match`)
    })
    lines.push(``)
    lines.push(`Strengths: ${analysis.strengthsSummary.join(', ')}`)
    lines.push(`Development areas: ${analysis.developmentAreas.join(', ')}`)
    lines.push(``)
    lines.push(`Top next step: ${analysis.nextSteps[0]}`)
    lines.push(``)
    lines.push(`— LearnX Career Counsellor AI`)

    preview({
      recipients: [{
        id: 'parent-' + (profile.name || 'student').replace(/\s+/g, '-').toLowerCase(),
        name: `Parent of ${profile.name || 'Student'}`,
        contact: '+91 98765 43210',
        channel: 'WHATSAPP',
        recipientType: 'PARENT',
      }],
      subject: `Career Analysis Report — ${profile.name || 'Student'}`,
      body: lines.join('\n'),
      audience: 'MINIMUM',
      source: 'ai-career-counsellor',
    })
    toast.success('Report drafted — review and send to parent')
  }, [analysis, profile, preview])

  const resetAll = () => {
    setProfile({
      name: '', grade: 'Grade 10', age: '', interests: [], strengths: [], performance: 'Good',
    })
    setAptitude({ logical: 0, verbal: 0, numerical: 0, spatial: 0, interpersonal: 0 })
    setAnalysis(null)
    toast.info('Form reset')
  }

  const loadDemo = () => {
    setProfile({
      name: 'Aarav Sharma',
      grade: 'Grade 10',
      age: '15',
      interests: ['Technology', 'Science', 'Engineering'],
      strengths: ['Analytical Thinking', 'Problem Solving', 'Mathematics', 'Research'],
      performance: 'Excellent',
    })
    setAptitude({ logical: 5, verbal: 3, numerical: 4, spatial: 4, interpersonal: 3 })
    setAnalysis(null)
    toast.success('Demo profile loaded — click "Generate Career Analysis"')
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        emoji="🧭"
        title="AI Career Counsellor"
        subtitle="AI-powered career guidance for students"
        accent="#F97316"
        onRefresh={resetAll}
        aiActions={[
          { label: 'Profile analysed', count: 1 },
          { label: 'Careers matched', count: 5 },
          { label: 'Personality type', count: 1 },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ===== Left: Form ===== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Student Profile */}
          <Card className="p-5 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Profile</h3>
                <p className="text-[11px] text-slate-500">Tell us about the student</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 mb-1 block">Student Name</Label>
                <Input
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Aarav Sharma"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 mb-1 block">Age</Label>
                <Input
                  type="number"
                  value={profile.age}
                  onChange={e => setProfile(p => ({ ...p, age: e.target.value }))}
                  placeholder="e.g. 15"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 mb-1 block">Grade</Label>
                <select
                  value={profile.grade}
                  onChange={e => setProfile(p => ({ ...p, grade: e.target.value }))}
                  className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-700 mb-1 block">Academic Performance</Label>
                <select
                  value={profile.performance}
                  onChange={e => setProfile(p => ({ ...p, performance: e.target.value as any }))}
                  className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  {PERFORMANCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Interests */}
            <div className="mb-4">
              <Label className="text-[11px] font-semibold text-slate-700 mb-2 block flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-rose-500" />
                Interests <span className="text-slate-400 font-normal">({profile.interests.length} selected)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map(i => {
                  const active = profile.interests.includes(i)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleInterest(i)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                        active
                          ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      {active && <CheckCircle2 className="w-3 h-3" />}
                      {i}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Strengths */}
            <div>
              <Label className="text-[11px] font-semibold text-slate-700 mb-2 block flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500" />
                Strengths <span className="text-slate-400 font-normal">({profile.strengths.length} selected)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {STRENGTHS_LIST.map(s => {
                  const active = profile.strengths.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStrength(s)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                        active
                          ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      {active && <CheckCircle2 className="w-3 h-3" />}
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Aptitude Assessment */}
          <Card className="p-5 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Aptitude Assessment</h3>
                <p className="text-[11px] text-slate-500">5 quick questions · 1–5 scoring</p>
              </div>
            </div>

            <div className="space-y-4">
              {APTITUDE_QUESTIONS.map((q, qi) => (
                <div key={q.domain} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                        {qi + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-800">{q.label}</span>
                    </div>
                    {aptitude[q.domain] > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] h-5">
                        Score {aptitude[q.domain]}/5
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">{q.question}</p>
                  <div className="grid grid-cols-1 gap-1">
                    {q.options.map((opt, oi) => {
                      const selected = aptitude[q.domain] === opt.score
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => setAptitude(a => ({ ...a, [q.domain]: opt.score }))}
                          className={`text-left text-[11px] px-2.5 py-1.5 rounded-md border transition-all flex items-center gap-2 ${
                            selected
                              ? 'bg-blue-50 border-blue-400 text-blue-900 font-medium'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          {opt.text}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-4 h-10 text-xs font-semibold text-white shadow-md"
              style={{ background: 'linear-gradient(90deg, #F97316 0%, #FB923C 100%)' }}
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generate Career Analysis
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* ===== Right: Results ===== */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-12 bg-gradient-to-br from-orange-50 via-white to-violet-50 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-violet-500 flex items-center justify-center mb-4"
                  >
                    <Brain className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">AI is analysing the career profile…</h3>
                  <div className="space-y-1.5 mt-4 max-w-sm mx-auto">
                    {[
                      'Parsing student profile & interests',
                      'Scoring aptitude across 5 dimensions',
                      'Matching 12 career paths',
                      'Deriving personality type',
                      'Compiling strengths & next steps',
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.3, x: -8 }}
                        animate={{
                          opacity: i <= stage ? 1 : 0.3,
                          x: i <= stage ? 0 : -8,
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center gap-1.5 text-xs text-slate-600"
                      >
                        {i < stage ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : i === stage ? (
                          <RefreshCw className="w-3.5 h-3.5 text-orange-600 animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                        )}
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Personality Type Hero Card */}
                <motion.div
                  initial={{ scale: 0.97, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card
                    className="p-5 text-white relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${analysis.personality.accent} 0%, ${analysis.personality.accent}CC 50%, #1E293B 100%)`,
                    }}
                  >
                    <div className="absolute top-0 right-0 opacity-10">
                      <analysis.personality.icon className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-white/20 text-white border-0 text-[10px] uppercase tracking-wider">
                          Personality Type
                        </Badge>
                        <Badge className="bg-white/15 text-white border-0 text-[10px]">
                          {profile.name || 'Student'} · {profile.grade}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <analysis.personality.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold leading-tight">{analysis.personality.name}</h3>
                          <p className="text-xs text-white/80 italic mt-0.5">{analysis.personality.tagline}</p>
                          <p className="text-[11px] text-white/85 leading-relaxed mt-2">
                            {analysis.personality.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Strengths + Development Areas (2-col) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-white">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Strengths Summary</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {analysis.strengthsSummary.map((s, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="flex items-start gap-1.5 text-[11px] text-slate-700"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="capitalize">{s}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-4 bg-white">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Target className="w-4 h-4 text-rose-500" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Development Areas</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {analysis.developmentAreas.map((s, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="flex items-start gap-1.5 text-[11px] text-slate-700"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span className="capitalize">{s}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Top Career Paths */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-orange-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Top 5 Career Matches</h4>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      AI Ranked
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {analysis.topCareers.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                      >
                        <Card className="p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            {/* Rank + emoji */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                style={{ background: c.accent + '15' }}
                              >
                                {c.emoji}
                              </div>
                              {i === 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] h-4 px-1">
                                  <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-500 text-amber-500" />
                                  BEST
                                </Badge>
                              )}
                            </div>

                            {/* Body */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="min-w-0">
                                  <h5 className="text-sm font-bold text-slate-900 truncate">{c.name}</h5>
                                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{c.description}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div
                                    className="text-lg font-bold leading-none"
                                    style={{ color: c.accent }}
                                  >
                                    {c.matchScore}%
                                  </div>
                                  <div className="text-[9px] text-slate-400 uppercase tracking-wide">match</div>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2 mb-2.5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.matchScore}%` }}
                                  transition={{ delay: 0.25 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{
                                    background: `linear-gradient(90deg, ${c.accent} 0%, ${c.accent}AA 100%)`,
                                  }}
                                />
                              </div>

                              {/* Reasons */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                {c.matchReasons.map((r, ri) => (
                                  <span
                                    key={ri}
                                    className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>

                              {/* Skills + Courses + Salary grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px]">
                                <div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5" /> Required Skills
                                  </div>
                                  <div className="text-slate-700 leading-relaxed">
                                    {c.requiredSkills.slice(0, 3).join(', ')}
                                    {c.requiredSkills.length > 3 && '…'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <GraduationCap className="w-2.5 h-2.5" /> Recommended Courses
                                  </div>
                                  <div className="text-slate-700 leading-relaxed">
                                    {c.courses[0]}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <TrendingUp className="w-2.5 h-2.5" /> Expected Salary
                                  </div>
                                  <div className="text-slate-700 leading-relaxed font-medium">
                                    {c.salaryRange}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <Card className="p-4 bg-gradient-to-br from-slate-50 to-orange-50/40">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Target className="w-4 h-4 text-orange-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Next Steps</h4>
                  </div>
                  <ol className="space-y-2">
                    {analysis.nextSteps.map((s, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.06 }}
                        className="flex items-start gap-2 text-[11px] text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{s}</span>
                      </motion.li>
                    ))}
                  </ol>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-orange-500" />
                    Generated by LearnX Career AI · {new Date(analysis.generatedAt).toLocaleString('en-IN')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="text-xs h-9"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Re-run
                    </Button>
                    <Button
                      size="sm"
                      onClick={sendToParent}
                      className="text-xs h-9 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Send Report to Parent
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-10 bg-white border-dashed border-2 border-slate-200 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Ready to discover your career path?</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                    Fill out the student profile, answer the 5 aptitude questions on the left, then click
                    <span className="font-semibold text-orange-700"> &quot;Generate Career Analysis&quot;</span> to
                    receive a personalised AI report — top 5 career matches, personality type, and actionable next steps.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mt-6 max-w-lg mx-auto">
                    {[
                      { icon: User, label: 'Student Profile', hint: 'Name, grade, interests, strengths' },
                      { icon: Brain, label: 'Aptitude Test', hint: '5 quick scenario questions' },
                      { icon: Briefcase, label: 'Career Matches', hint: 'Top 5 ranked by match %' },
                    ].map((f, i) => (
                      <div key={i} className="text-left p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <f.icon className="w-4 h-4 text-orange-600 mb-1.5" />
                        <div className="text-[11px] font-semibold text-slate-900">{f.label}</div>
                        <div className="text-[9.5px] text-slate-500 leading-tight mt-0.5">{f.hint}</div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={loadDemo}
                    className="mt-6 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Try with demo profile
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
