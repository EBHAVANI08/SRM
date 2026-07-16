/**
 * POST /api/documents/upload — Upload a document file to the server.
 * Saves the file to /public/uploads/documents/ and creates a Document DB record.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const ALLOWED_MIME = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('document', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const studentId = (formData.get('studentId') as string) || null
    const notes = (formData.get('notes') as string) || null

    if (!file || !title || !type) return NextResponse.json({ success: false, error: 'file, title, and type are required' }, { status: 400 })
    if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ success: false, error: `File type "${file.type}" not allowed` }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: 'File too large. Max 10MB' }, { status: 400 })

    const fileExt = file.name.split('.').pop() || 'pdf'
    const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}.${fileExt}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
    await mkdir(uploadDir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(join(uploadDir, uniqueName), Buffer.from(bytes))
    const fileUrl = `/uploads/documents/${uniqueName}`

    const document = await db.document.create({
      data: {
        schoolId: user.schoolId, title, type,
        studentId: studentId || null,
        fileUrl, fileFormat: fileExt.toLowerCase(), fileSize: file.size,
        originalFileName: file.name, mimeType: file.type,
        uploadedBy: user.userId, uploadedByName: user.name || user.email || 'Admin',
        uploadedAt: new Date(), status: 'PENDING', notes,
      },
    })

    return NextResponse.json({ success: true, document: { id: document.id, title: document.title, fileUrl: document.fileUrl, status: document.status, uploadedByName: document.uploadedByName } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
