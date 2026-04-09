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
    .select('plan, status, analyses_count, analyses_reset_date')
    .eq('user_id', user.id)
    .single()

  if (!sub) {
    const { data: newSub } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: 'free',
        status: 'inactive',
        analyses_count: 0,
        analyses_reset_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      }, { onConflict: 'user_id' })
      .select('plan, status, analyses_count, analyses_reset_date')
      .single()
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

  // ── 4. Enforce limit ──────────────────────────────────────────────────────────
  if (limit !== Infinity && currentCount >= limit) {
    return NextResponse.json({
      error: `You've used all ${limit} analyses included in your ${effectivePlan} plan this month. Upgrade to keep going.`,
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
      // File upload — parse incoming multipart and forward to Railway
      const incoming = await request.formData()
      forwardFormData = new FormData()

      // FIX: Use Array.from instead of for...of to avoid TypeScript downlevelIteration error
      Array.from(incoming.entries()).forEach(([key, value]) => {
        forwardFormData.append(key, value)
      })

      // Inject user identity
      forwardFormData.set('user_id', user.id)
      forwardFormData.set('user_email', user.email ?? '')
      forwardFormData.set('user_name', user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there')

    } else {
      // URL submission — parse JSON and build FormData for Railway
      const body = await request.json()
      const { videoUrl, niche, audience, goal, sourceType, fileName } = body

      if (!videoUrl) {
        return NextResponse.json({ error: 'No video URL provided.' }, { status: 400 })
      }

      forwardFormData = new FormData()
      forwardFormData.append('videoUrl', videoUrl)
      forwardFormData.append('niche', niche ?? '')
      forwardFormData.append('audience', audience ?? '')
      forwardFormData.append('goal', goal ?? '')
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

    // ── 6. Increment counter on success ────────────────────────────────────────
    await supabase
      .from('subscriptions')
      .update({ analyses_count: currentCount + 1 })
      .eq('user_id', user.id)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Analyze proxy error:', error)
    return NextResponse.json({
      error: 'Failed to reach analyze service.',
      code: 'SERVICE_UNAVAILABLE'
    }, { status: 503 })
  }
}
