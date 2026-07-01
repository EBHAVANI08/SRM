import { NextRequest, NextResponse } from 'next/server'
import { DEMO_ACCOUNTS } from '@/lib/modules'
import type { UserRole } from '@/lib/store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json()

    // Demo authentication — check against DEMO_ACCOUNTS
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    )

    if (account) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'usr_' + account.role.toLowerCase(),
          name: account.name,
          email: account.email,
          role: account.role as UserRole,
          schoolName: 'LearnX International School',
          avatar: null,
          permissions: getPermissions(account.role as UserRole),
        },
        token: 'demo-token-' + Date.now(),
      })
    }

    // If role is provided without valid credentials, allow demo login
    if (role) {
      const acc = DEMO_ACCOUNTS.find((a) => a.role === role)
      if (acc) {
        return NextResponse.json({
          success: true,
          user: {
            id: 'usr_' + acc.role.toLowerCase(),
            name: acc.name,
            email: acc.email,
            role: acc.role as UserRole,
            schoolName: 'LearnX International School',
            avatar: null,
            permissions: getPermissions(acc.role as UserRole),
          },
          token: 'demo-token-' + Date.now(),
        })
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials. Try a demo account.' },
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
