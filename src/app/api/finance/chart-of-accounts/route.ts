/** GET /api/finance/chart-of-accounts — list chart of accounts */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders } from '@/lib/apiScope'

export const runtime = 'nodejs'

const DEFAULT_ACCOUNTS = [
  // Assets
  { accountCode: '1001', accountName: 'Cash in Hand', accountType: 'ASSET', subType: 'CURRENT_ASSET' },
  { accountCode: '1002', accountName: 'Bank Account', accountType: 'ASSET', subType: 'CURRENT_ASSET' },
  { accountCode: '1003', accountName: 'Accounts Receivable (Fees)', accountType: 'ASSET', subType: 'CURRENT_ASSET' },
  { accountCode: '1004', accountName: 'Prepaid Expenses', accountType: 'ASSET', subType: 'CURRENT_ASSET' },
  { accountCode: '1101', accountName: 'Furniture & Fixtures', accountType: 'ASSET', subType: 'FIXED_ASSET' },
  { accountCode: '1102', accountName: 'Computer Equipment', accountType: 'ASSET', subType: 'FIXED_ASSET' },
  { accountCode: '1103', accountName: 'Building', accountType: 'ASSET', subType: 'FIXED_ASSET' },
  // Liabilities
  { accountCode: '2001', accountName: 'Accounts Payable (Vendors)', accountType: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { accountCode: '2002', accountName: 'PF Payable', accountType: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { accountCode: '2003', accountName: 'ESI Payable', accountType: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { accountCode: '2004', accountName: 'TDS Payable', accountType: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { accountCode: '2005', accountName: 'Salary Payable', accountType: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { accountCode: '2006', accountName: 'GST Payable', accountType: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  // Equity
  { accountCode: '3001', accountName: 'Capital', accountType: 'EQUITY' },
  { accountCode: '3002', accountName: 'Retained Earnings', accountType: 'EQUITY' },
  // Income
  { accountCode: '4001', accountName: 'Tuition Fee Income', accountType: 'INCOME' },
  { accountCode: '4002', accountName: 'Transport Fee Income', accountType: 'INCOME' },
  { accountCode: '4003', accountName: 'Hostel Fee Income', accountType: 'INCOME' },
  { accountCode: '4004', accountName: 'Lab Fee Income', accountType: 'INCOME' },
  { accountCode: '4005', accountName: 'Exam Fee Income', accountType: 'INCOME' },
  { accountCode: '4006', accountName: 'Canteen Income', accountType: 'INCOME' },
  { accountCode: '4007', accountName: 'Donations', accountType: 'INCOME' },
  // Expenses
  { accountCode: '5001', accountName: 'Salary Expense', accountType: 'EXPENSE' },
  { accountCode: '5002', accountName: 'TRAVEL Expense', accountType: 'EXPENSE' },
  { accountCode: '5003', accountName: 'EQUIPMENT Expense', accountType: 'EXPENSE' },
  { accountCode: '5004', accountName: 'CONSUMABLES Expense', accountType: 'EXPENSE' },
  { accountCode: '5005', accountName: 'MISC Expense', accountType: 'EXPENSE' },
  { accountCode: '5006', accountName: 'Electricity & Utilities', accountType: 'EXPENSE' },
  { accountCode: '5007', accountName: 'Maintenance & Repairs', accountType: 'EXPENSE' },
  { accountCode: '5008', accountName: 'Marketing & Advertising', accountType: 'EXPENSE' },
  { accountCode: '5009', accountName: 'Professional Tax Payable', accountType: 'EXPENSE' },
]

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    let accounts = await (db as any).chartOfAccount.findMany({ where: { schoolId: user.schoolId }, orderBy: { accountCode: 'asc' } })

    // If no accounts exist, seed the defaults
    if (accounts.length === 0) {
      await (db as any).chartOfAccount.createMany({
        data: DEFAULT_ACCOUNTS.map(a => ({ schoolId: user.schoolId, ...a })),
      })
      accounts = await (db as any).chartOfAccount.findMany({ where: { schoolId: user.schoolId }, orderBy: { accountCode: 'asc' } })
    }

    return NextResponse.json({ success: true, accounts, count: accounts.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
