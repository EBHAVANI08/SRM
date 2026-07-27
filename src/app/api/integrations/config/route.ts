/** GET/PUT /api/integrations/config — manage integration credentials */
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
    const configs = await db.integrationConfig.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { provider: 'asc' },
    })
    // Mask secrets
    const masked = configs.map(c => ({
      ...c,
      apiKeyEnc: c.apiKeyEnc ? '***CONFIGURED***' : null,
      apiSecretEnc: c.apiSecretEnc ? '***CONFIGURED***' : null,
    }))
    return NextResponse.json({ success: true, configs: masked })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const body = await req.json()
    const { provider, apiKey, apiSecret, phoneNumberId, businessName, webhookUrl, isActive } = body

    if (!provider) return NextResponse.json({ success: false, error: 'provider is required' }, { status: 400 })

    const existing = await db.integrationConfig.findFirst({
      where: { schoolId: user.schoolId, provider },
    })

    const data: any = {
      isActive: isActive ?? true,
    }
    if (apiKey !== undefined && apiKey !== '***CONFIGURED***') data.apiKeyEnc = apiKey || null
    if (apiSecret !== undefined && apiSecret !== '***CONFIGURED***') data.apiSecretEnc = apiSecret || null
    if (phoneNumberId !== undefined) data.phoneNumberId = phoneNumberId || null
    if (businessName !== undefined) data.businessName = businessName || null
    if (webhookUrl !== undefined) data.webhookUrl = webhookUrl || null

    let config
    if (existing) {
      config = await db.integrationConfig.update({ where: { id: existing.id }, data })
    } else {
      config = await db.integrationConfig.create({ data: { schoolId: user.schoolId, provider, ...data } })
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        apiKeyEnc: config.apiKeyEnc ? '***CONFIGURED***' : null,
        apiSecretEnc: config.apiSecretEnc ? '***CONFIGURED***' : null,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
