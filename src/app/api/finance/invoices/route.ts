/** GET/POST /api/finance/invoices — list + create GST invoices */
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
    const sp = req.nextUrl.searchParams
    const status = sp.get('status')
    const limit = Number(sp.get('limit') || 50)

    const where: any = { schoolId: user.schoolId }
    if (status) where.paymentStatus = status

    const invoices = await db.gSTInvoice.findMany({ where, orderBy: { invoiceDate: 'desc' }, take: limit })

    const formatted = invoices.map(inv => ({ ...inv, lineItems: JSON.parse(inv.lineItems || '[]') }))

    return NextResponse.json({ success: true, invoices: formatted, count: formatted.length })
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
    const { invoiceDate, dueDate, partyType, partyName, partyGstin, partyAddress, partyPhone, lineItems, notes } = body

    if (!invoiceDate || !partyName || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ success: false, error: 'invoiceDate, partyName, and lineItems required' }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0
    for (const item of lineItems) {
      const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0)
      subtotal += amount
      const gstRate = Number(item.gstRate) || 0
      const isInterState = body.isInterState || false
      if (isInterState) {
        item.igst = Math.round(amount * gstRate / 100)
        igstTotal += item.igst
      } else {
        item.cgst = Math.round(amount * gstRate / 200) // half of GST
        item.sgst = Math.round(amount * gstRate / 200)
        cgstTotal += item.cgst
        sgstTotal += item.sgst
      }
      item.amount = amount
      item.total = amount + (item.igst || 0) + (item.cgst || 0) + (item.sgst || 0)
    }
    const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal

    const invCount = await db.gSTInvoice.count()
    const invoiceNo = `INV-2026-${String(invCount + 1).padStart(4, '0')}`

    const invoice = await db.gSTInvoice.create({
      data: {
        schoolId: user.schoolId,
        invoiceNo,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        partyType: partyType || 'OTHER',
        partyName, partyGstin: partyGstin || null, partyAddress: partyAddress || null, partyPhone: partyPhone || null,
        lineItems: JSON.stringify(lineItems),
        subtotal, cgstTotal, sgstTotal, igstTotal, grandTotal,
        paymentStatus: 'UNPAID', balanceDue: grandTotal,
        notes: notes || null,
        createdBy: user.userId, createdByName: user.name || user.email || 'Admin',
      },
    })

    return NextResponse.json({ success: true, invoice: { ...invoice, lineItems } }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
