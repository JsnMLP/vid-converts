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
    const body = await request.json()
    const { videoUrl, niche, audience, goal, sourceType, fileName } = body

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video URL provided.' }, { status: 400 })
    }

    // Build FormData to send to Railway — Railway service stays unchanged
    const formData = new FormData()
    formData.append('videoUrl', videoUrl)
    formData.append('niche', niche ?? '')
    formData.append('audience', audience ?? '')
    formData.append('goal', goal ?? '')
    formData.append('sourceType', sourceType ?? 'url')
    if (fileName) formData.append('fileName', fileName)
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
