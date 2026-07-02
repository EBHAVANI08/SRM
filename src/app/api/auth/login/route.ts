import { NextRequest, NextResponse } from 'next/server'
import { DEMO_ACCOUNTS } from '@/lib/modules'
import type { UserRole } from '@/lib/store'
import { createToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json()

    // Demo authentication — check against DEMO_ACCOUNTS
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    )

    let matchedAccount = account

    // If role is provided without valid credentials, allow demo login
    if (!matchedAccount && role) {
      matchedAccount = DEMO_ACCOUNTS.find((a) => a.role === role) || undefined
    }

    if (matchedAccount) {
      const permissions = getPermissions(matchedAccount.role as UserRole)

      // Create real JWT token
      const token = await createToken({
        userId: 'usr_' + matchedAccount.role.toLowerCase(),
        email: matchedAccount.email,
        name: matchedAccount.name,
        role: matchedAccount.role,
        schoolId: 'school_default',
        permissions,
      })

      return NextResponse.json({
        success: true,
        user: {
          id: 'usr_' + matchedAccount.role.toLowerCase(),
          name: matchedAccount.name,
          email: matchedAccount.email,
          role: matchedAccount.role as UserRole,
          schoolName: 'LearnX International School',
          avatar: null,
          permissions,
        },
        token,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials. Try demo accounts.' },
      { status: 401 }
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

function getPermissions(role: UserRole): string[] {
  const base = ['dashboard.view', 'ai.chat']
  const rolePerms: Record<UserRole, string[]> = {
    SUPER_ADMIN: ['*'],
    SCHOOL_HEAD: ['*.view', '*.edit', 'reports.*', 'hrms.*', 'finance.*'],
    ADMIN: ['*.view', '*.edit', 'admissions.*', 'fees.*', 'attendance.*', 'communication.*'],
    TEACHER: ['attendance.*', 'academic.*', 'exams.*', 'students.view', 'reports.view'],
    STUDENT: ['dashboard.view', 'homework.view', 'fees.view', 'results.view', 'attendance.view'],
    PARENT: ['dashboard.view', 'child.view', 'fees.pay', 'attendance.view', 'communication.send'],
    RECEPTION: ['front-desk.*', 'admissions.*', 'visitors.*', 'communication.send'],
    IT_TEAM: ['settings.*', 'security.*', 'admin-engine.*', '*.view'],
  }
  return rolePerms[role] || base
}
