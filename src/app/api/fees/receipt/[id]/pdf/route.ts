import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const fee = await (db as any).feeRecord.findUnique({
      where: { id },
      include: {
        student: true,
      },
    })

    if (!fee) {
      return new NextResponse('Fee Record not found', { status: 404 })
    }

    const { student } = fee
    const receiptNo = fee.receiptNo || `RCP-${fee.id.slice(-6).toUpperCase()}`
    const paidOn = fee.paidOn ? new Date(fee.paidOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt — ${receiptNo}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 20px; font-size: 13px; }
    .receipt-card { max-width: 750px; margin: 0 auto; border: 2px solid #0f172a; padding: 30px; border-radius: 8px; position: relative; }
    
    .top-bar { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
    .school-title { font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
    .school-contact { font-size: 11px; color: #64748b; margin-top: 4px; }
    
    .receipt-header { text-align: right; }
    .receipt-title { font-size: 18px; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px; }
    .receipt-no { font-size: 13px; font-weight: 700; color: #334155; margin-top: 2px; }

    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
    .item { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
    .label { font-weight: 600; color: #64748b; }
    .value { font-weight: 700; color: #0f172a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { background: #0f172a; color: white; padding: 10px; text-align: left; font-size: 12px; }
    td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    
    .amount-box { display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1.5px solid #86efac; padding: 15px 20px; border-radius: 6px; margin-bottom: 30px; }
    .amount-text { font-size: 14px; font-weight: 700; color: #166534; }
    .amount-num { font-size: 24px; font-weight: 900; color: #15803d; }

    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .sig { text-align: center; width: 200px; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; font-weight: 600; color: #475569; }

    .stamp { position: absolute; bottom: 80px; right: 50px; border: 3px double #16a34a; color: #16a34a; border-radius: 50%; width: 100px; h: 100px; height: 100px; display: flex; align-items: center; justify-content: center; transform: rotate(-15deg); font-weight: 900; font-size: 12px; text-transform: uppercase; text-align: center; opacity: 0.85; }

    .print-bar { text-align: center; margin-bottom: 20px; }
    .btn-print { background: #16a34a; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; }
    .btn-print:hover { background: #15803d; }

    @media print {
      .print-bar { display: none; }
      body { padding: 0; }
      .receipt-card { border: none; padding: 0; }
    }
  </style>
</head>
<body>

  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">💳 Print / Download Fee Receipt</button>
  </div>

  <div class="receipt-card">
    <div class="stamp">PAID &<br>VERIFIED</div>

    <div class="top-bar">
      <div>
        <div class="school-title">LEARNX INTERNATIONAL SCHOOL</div>
        <div class="school-contact">Accounts & Finance Division · Ph: +91 80 2938 1000 · Accounts@learnx.edu.in</div>
      </div>
      <div class="receipt-header">
        <div class="receipt-title">FEE RECEIPT</div>
        <div class="receipt-no">No: ${receiptNo}</div>
      </div>
    </div>

    <div class="grid-info">
      <div class="item"><span class="label">Student Name:</span> <span class="value">${student.fullName}</span></div>
      <div class="item"><span class="label">Admission No:</span> <span class="value">${student.admissionNo}</span></div>
      <div class="item"><span class="label">Class & Section:</span> <span class="value">${student.classId || 'Class 7'} - ${student.sectionId || 'A'}</span></div>
      <div class="item"><span class="label">Payment Date:</span> <span class="value">${paidOn}</span></div>
      <div class="item"><span class="label">Payment Method:</span> <span class="value">${fee.paymentMethod || 'UPI / Online'}</span></div>
      <div class="item"><span class="label">Transaction ID:</span> <span class="value">${fee.transactionId || 'TXN-' + id.slice(-8).toUpperCase()}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Fee Particulars</th>
          <th>Due Date</th>
          <th style="text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${fee.feeType}</strong></td>
          <td>${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN') : 'N/A'}</td>
          <td style="text-align: right; font-weight: 700;">₹${fee.amount.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="amount-box">
      <div class="amount-text">Total Amount Paid:</div>
      <div class="amount-num">₹${fee.amount.toLocaleString('en-IN')}</div>
    </div>

    <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
      * Computer generated receipt — valid without physical signature when stamped. Please retain this receipt for official purposes.
    </div>

    <div class="signatures">
      <div class="sig">Parent / Guardian Signature</div>
      <div class="sig">Authorized Accountant Seal & Signature</div>
    </div>
  </div>

</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e: any) {
    return new NextResponse('Internal Error: ' + e?.message, { status: 500 })
  }
}
