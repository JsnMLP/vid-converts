import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reportId, folder, tags } = await request.json()

  if (!reportId) {
    return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (folder !== undefined) updates.folder = folder || null
  if (tags !== undefined) updates.tags = tags

  const { error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .eq('user_id', user.id) // ensure user owns this report

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
