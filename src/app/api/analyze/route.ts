import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import os from 'os'
import { extractAudio, sampleFrames, checkFfmpeg } from '@/utils/ffmpeg'
import { transcribeAudio } from '@/utils/transcribe'
import { analyzeVideo } from '@/utils/analyze'

export const maxDuration = 300 // 5 min timeout for Vercel

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check ffmpeg is available before doing anything
  const ffmpegOk = await checkFfmpeg()
  if (!ffmpegOk) {
    return NextResponse.json({
      error: 'ffmpeg is not available on this server. Audio extraction cannot proceed. Please contact support.',
      code: 'FFMPEG_MISSING'
    }, { status: 500 })
  }

  let tempDir: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const videoUrl = formData.get('videoUrl') as string | null
    const niche = formData.get('niche') as string
    const audience = formData.get('audience') as string
    const goal = formData.get('goal') as string

    if (!niche || !audience || !goal) {
      return NextResponse.json({ error: 'Missing required context fields.' }, { status: 400 })
    }

    if (!file && !videoUrl) {
      return NextResponse.json({ error: 'No video provided.' }, { status: 400 })
    }

    // Create temp directory
    tempDir = path.join(os.tmpdir(), `vidconverts-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })

    let videoPath: string

    if (file) {
      // Save uploaded file to temp dir
      const buffer = Buffer.from(await file.arrayBuffer())
      videoPath = path.join(tempDir, 'input.mp4')
      await writeFile(videoPath, buffer)
    } else {
      // URL-based: return not yet implemented
      return NextResponse.json({
        error: 'URL-based video analysis is coming soon. Please upload a file directly for now.',
        code: 'URL_NOT_YET_SUPPORTED'
      }, { status: 400 })
    }

    // Step 1: Extract audio
    let transcript = ''
    let transcriptAvailable = false
    try {
      const audioPath = path.join(tempDir, 'audio.mp3')
      await extractAudio(videoPath, audioPath)
      transcript = await transcribeAudio(audioPath)
      transcriptAvailable = transcript.trim().length > 20
    } catch (err) {
      console.error('Audio extraction/transcription failed:', err)
      transcriptAvailable = false
      transcript = ''
    }

    // Step 2: Sample frames
    let frameDescriptions: string[] = []
    try {
      frameDescriptions = await sampleFrames(videoPath, tempDir)
    } catch (err) {
      console.error('Frame sampling failed:', err)
      frameDescriptions = []
    }

    // Step 3: Check we have enough evidence
    const hasTranscript = transcriptAvailable
    const hasFrames = frameDescriptions.length > 0

    if (!hasTranscript && !hasFrames) {
      return NextResponse.json({
        error: 'We could not extract enough evidence from this video to produce a reliable report. The video may be silent, corrupted, or in an unsupported format. We will not generate a report based on guesswork.',
        code: 'INSUFFICIENT_EVIDENCE'
      }, { status: 422 })
    }

    // Step 4: Generate report
    const report = await analyzeVideo({
      transcript: hasTranscript ? transcript : null,
      frameDescriptions: hasFrames ? frameDescriptions : [],
      niche,
      audience,
      goal,
      hasTranscript,
      hasFrames,
    })

    // Step 5: Save to Supabase
    const { data: savedReport, error: saveError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        niche,
        audience,
        goal,
        transcript: transcript || null,
        report_data: report,
        video_source: file ? 'upload' : 'url',
        video_name: file?.name || videoUrl || 'unknown',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save report:', saveError)
      // Still return the report even if save fails
      return NextResponse.json({ report, saved: false })
    }

    return NextResponse.json({ report, reportId: savedReport.id, saved: true })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred during analysis.',
      code: 'UNKNOWN_ERROR'
    }, { status: 500 })
  } finally {
    // Clean up temp files
    if (tempDir && existsSync(tempDir)) {
      try {
        const { rm } = await import('fs/promises')
        await rm(tempDir, { recursive: true, force: true })
      } catch {}
    }
  }
}
