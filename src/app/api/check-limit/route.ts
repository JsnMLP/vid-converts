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

  // ── 4. Enforce limit ──────────────────────────────────────────────────────────
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

  // ── 5. Create job record ──────────────────────────────────────────────────────
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({ user_id: user.id, status: 'pending' })
    .select('id')
    .single()

  if (jobError || !job) {
    console.error('[Jobs] Failed to create job:', jobError)
    return NextResponse.json({ error: 'Failed to start job. Please try again.' }, { status: 500 })
  }

  // ── 6. Return everything the browser needs to upload direct to Railway ────────
  return NextResponse.json({
    jobId: job.id,
    userId: user.id,
    userEmail: user.email ?? '',
    userName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there',
    usingTopup,
    currentCount,
    topupCredits,
  })
}
