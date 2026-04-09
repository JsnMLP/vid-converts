import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const maxDuration = 30

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

  // ── Get or create subscription row ───────────────────────────────────────────
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
    return NextResponse.json({ error: 'Could not load your account.' }, { status: 500 })
  }

  // ── Determine effective plan ──────────────────────────────────────────────────
  const effectivePlan = (sub.status === 'active' && sub.plan !== 'free') ? sub.plan : 'free'
  const limit = PLAN_LIMITS[effectivePlan] ?? 2

  // ── Reset counter if new month ────────────────────────────────────────────────
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

  // ── Check limit ───────────────────────────────────────────────────────────────
  if (limit !== Infinity && currentCount >= limit) {
    return NextResponse.json({
      error: `You've used all ${limit} analyses included in your ${effectivePlan} plan this month. Upgrade to keep going.`,
      code: 'LIMIT_REACHED',
      plan: effectivePlan,
      limit,
      used: currentCount,
    }, { status: 403 })
  }

  // ── Return approval + increment token ────────────────────────────────────────
  return NextResponse.json({
    allowed: true,
    plan: effectivePlan,
    used: currentCount,
    limit: limit === Infinity ? null : limit,
    userId: user.id,
    userEmail: user.email ?? '',
    userName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there',
  })
}
