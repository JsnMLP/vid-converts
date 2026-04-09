import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const maxDuration = 10

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('analyses_count')
    .eq('user_id', user.id)
    .single()

  const currentCount = sub?.analyses_count ?? 0

  await supabase
    .from('subscriptions')
    .update({ analyses_count: currentCount + 1 })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
