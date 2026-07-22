/** GET/POST /api/finance/vendors — list + create vendors */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const vendors = await db.vendor.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, vendors, count: vendors.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const body = await req.json()
    if (!body.name) return NextResponse.json({ success: false, error: 'Vendor name is required' }, { status: 400 })

    const vCount = await db.vendor.count()
    const vendorCode = `V-${String(vCount + 1).padStart(3, '0')}`

    const vendor = await db.vendor.create({
      data: {
        schoolId: user.schoolId,
        vendorCode,
        name: body.name,
        gstin: body.gstin || null, pan: body.pan || null,
        address: body.address || null, city: body.city || null, state: body.state || null, pincode: body.pincode || null,
        phone: body.phone || null, email: body.email || null, contactPerson: body.contactPerson || null,
        bankAccountNo: body.bankAccountNo || null, bankIfsc: body.bankIfsc || null, bankName: body.bankName || null,
        openingBalance: body.openingBalance || 0,
      },
    })
    return NextResponse.json({ success: true, vendor }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
