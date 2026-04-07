import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const maxDuration = 300

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

  try {
    const formData = await request.formData()
    formData.append('user_id', user.id)
    formData.append('user_email', user.email ?? '')
    formData.append('user_name', user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there')

    const response = await fetch(`${analyzeServiceUrl}/analyze`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
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