import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const maxDuration = 300

const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  complete: 8,
  premium: Infinity,
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const analyzeServiceUrl = process.env.ANALYZE_SERVICE_URL
  if (!analyzeServiceUrl) {
    return NextResponse.json({ error: 'Analyze service not configured.' }, { status: 500 })
  }

  // ── 1. Get or create subscription row ────────────────────────────────────────
  let { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, analyses_count, analyses_reset_date, topup_credits')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub) {
    const { data: newSub } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: 'free',
        status: 'inactive',
        analyses_count: 0,
        topup_credits: 0,
        analyses_reset_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      }, { onConflict: 'user_id' })
      .select('plan, status, analyses_count, analyses_reset_date, topup_credits')
      .maybeSingle()
    sub = newSub
  }

  if (!sub) {
    return NextResponse.json({ error: 'Could not load your account. Please try again.' }, { status: 500 })
  }

  // ── 2. Determine effective plan ───────────────────────────────────────────────
  const effectivePlan = (sub.status === 'active' && sub.plan !== 'free') ? sub.plan : 'free'
  const limit = PLAN_LIMITS[effectivePlan] ?? 2

  // ── 3. Reset counter if new month ────────────────────────────────────────────
  const now = new Date()
  const resetDate = new Date(sub.analyses_reset_date)
  const isNewMonth =
    now.getFullYear() > resetDate.getFullYear() ||
    now.getMonth() > resetDate.getMonth()

  let currentCount = sub.analyses_count ?? 0
  const topupCredits = sub.topup_credits ?? 0

  if (isNewMonth) {
    currentCount = 0
    await supabase
      .from('subscriptions')
      .update({
        analyses_count: 0,
        analyses_reset_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      })
      .eq('user_id', user.id)
  }

  // ── 4. Enforce limit — but allow topup credits to cover overages ──────────────
  const withinPlanLimit = limit === Infinity || currentCount < limit
  const hasTopupCredit = topupCredits > 0
  const usingTopup = !withinPlanLimit && hasTopupCredit

  if (!withinPlanLimit && !hasTopupCredit) {
    return NextResponse.json({
      error: `You've reached your monthly analyses limit. Buy a one-time report for $5 or upgrade your plan.`,
      code: 'LIMIT_REACHED',
      plan: effectivePlan,
      limit,
      used: currentCount,
    }, { status: 403 })
  }

  // ── 5. Forward to Railway ─────────────────────────────────────────────────────
  try {
    const contentType = request.headers.get('content-type') || ''
    let forwardFormData: FormData

    if (contentType.includes('multipart/form-data')) {
      const incoming = await request.formData()
      forwardFormData = new FormData()
      Array.from(incoming.entries()).forEach(([key, value]) => {
        forwardFormData.append(key, value)
      })
      forwardFormData.set('user_id', user.id)
      forwardFormData.set('user_email', user.email ?? '')
      forwardFormData.set('user_name', user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there')
    } else {
      const body = await request.json()
      const { videoUrl, niche, audience, goal, platform, sourceType, fileName } = body

      if (!videoUrl) {
        return NextResponse.json({ error: 'No video URL provided.' }, { status: 400 })
      }

      forwardFormData = new FormData()
      forwardFormData.append('videoUrl', videoUrl)
      forwardFormData.append('niche', niche ?? '')
      forwardFormData.append('audience', audience ?? '')
      forwardFormData.append('goal', goal ?? '')
      forwardFormData.append('platform', platform ?? '')
      forwardFormData.append('sourceType', sourceType ?? 'url')
      if (fileName) forwardFormData.append('fileName', fileName)
      forwardFormData.append('user_id', user.id)
      forwardFormData.append('user_email', user.email ?? '')
      forwardFormData.append('user_name', user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there')
    }

    const response = await fetch(`${analyzeServiceUrl}/analyze`, {
      method: 'POST',
      body: forwardFormData,
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    // ── 6. Increment counter or consume topup credit on success ────────────────
    if (usingTopup) {
      await supabase
        .from('subscriptions')
        .update({ topup_credits: topupCredits - 1 })
        .eq('user_id', user.id)
      console.log(`[TopUp] Used 1 credit for user ${user.id}. Remaining: ${topupCredits - 1}`)
    } else {
      await supabase
        .from('subscriptions')
        .update({ analyses_count: currentCount + 1 })
        .eq('user_id', user.id)
    }

    // ── 7. Send report complete email ─────────────────────────────────────────
    try {
      const { Resend } = await import('resend')
      const { default: ReportCompleteEmail } = await import('@/lib/email/templates/ReportCompleteEmail')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const firstName = user.user_metadata?.full_name?.split(' ')[0]
        ?? user.email?.split('@')[0]
        ?? 'there'
      const reportId = result.reportId ?? ''
      const overallScore = result.overallScore ?? result.report?.overallScore ?? 0
      const reportUrl = `https://www.vidconverts.com/report/${reportId}`

      await resend.emails.send({
        from: 'Vid Converts <reports@vidconverts.com>',
        to: user.email!,
        subject: `Your conversion audit is ready — ${overallScore}/100`,
        react: ReportCompleteEmail({ firstName, reportId, overallScore, reportUrl }),
      })
    } catch (emailErr) {
      // Non-fatal — never fail the route over an email error
      console.error('[Report email] Failed to send:', emailErr)
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Analyze proxy error:', error)
    return NextResponse.json({
      error: 'Failed to reach analyze service.',
      code: 'SERVICE_UNAVAILABLE'
    }, { status: 503 })
  }
}
