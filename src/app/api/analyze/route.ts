import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import os from 'os'
import { extractAudio, sampleFrames, checkFfmpeg } from '@/utils/ffmpeg'
import { transcribeAudio } from '@/utils/transcribe'
import { analyzeVideo } from '@/utils/analyze'
import { checkYtDlp, downloadVideo, getSupportedPlatform } from '@/utils/ytdlp'
import { sendEmail } from '@/lib/email/resend'
import { ReportReadyEmail } from '@/lib/email/templates/ReportReadyEmail'

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
      error: 'ffmpeg is not available on this server. Please contact support.',
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
    let videoTitle: string = 'your video'

    // ── FILE UPLOAD PATH ────────────────────────────────────────────────────
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      videoPath = path.join(tempDir, 'input.mp4')
      await writeFile(videoPath, buffer)
      videoTitle = file.name

    // ── URL DOWNLOAD PATH (yt-dlp) ──────────────────────────────────────────
    } else if (videoUrl) {
      // Validate it looks like a supported URL before spinning up yt-dlp
      const platform = getSupportedPlatform(videoUrl)
      if (!platform) {
        return NextResponse.json({
          error: 'Please provide a valid video URL (YouTube, Vimeo, TikTok, Instagram, etc.)',
          code: 'INVALID_URL'
        }, { status: 400 })
      }

      // Check yt-dlp is installed
      const ytDlpOk = await checkYtDlp()
      if (!ytDlpOk) {
        return NextResponse.json({
          error: 'URL-based video download is not available on this server. Please upload a file directly.',
          code: 'YTDLP_MISSING'
        }, { status: 500 })
      }

      // Download the video
      try {
        console.log(`[yt-dlp] Downloading from ${platform}: ${videoUrl}`)
        const result = await downloadVideo(videoUrl, tempDir, { maxDurationSeconds: 600 })
        videoPath = result.videoPath
        videoTitle = result.title
        console.log(`[yt-dlp] Downloaded: "${videoTitle}" (${Math.round(result.duration / 60)}m)`)
      } catch (dlErr: any) {
        return NextResponse.json({
          error: dlErr.message ?? 'Failed to download video. Please check the URL and try again.',
          code: 'DOWNLOAD_FAILED'
        }, { status: 422 })
      }
    } else {
      return NextResponse.json({ error: 'No video provided.' }, { status: 400 })
    }

    // ── STEP 1: Extract audio ───────────────────────────────────────────────
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

    // ── STEP 2: Sample frames ───────────────────────────────────────────────
    let frameDescriptions: string[] = []
    try {
      frameDescriptions = await sampleFrames(videoPath, tempDir)
    } catch (err) {
      console.error('Frame sampling failed:', err)
      frameDescriptions = []
    }

    // ── STEP 3: Check we have enough evidence ───────────────────────────────
    const hasTranscript = transcriptAvailable
    const hasFrames = frameDescriptions.length > 0

    if (!hasTranscript && !hasFrames) {
      return NextResponse.json({
        error: 'We could not extract enough evidence from this video to produce a reliable report. The video may be silent, corrupted, or in an unsupported format.',
        code: 'INSUFFICIENT_EVIDENCE'
      }, { status: 422 })
    }

    // ── STEP 4: Generate report ─────────────────────────────────────────────
    const report = await analyzeVideo({
      transcript: hasTranscript ? transcript : null,
      frameDescriptions: hasFrames ? frameDescriptions : [],
      niche,
      audience,
      goal,
      hasTranscript,
      hasFrames,
    })

    // ── STEP 5: Look up user's subscription tier before saving ──────────────
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()
    const userTier = subscription?.plan ?? 'free'
    const isPaid = userTier === 'complete'

    // ── STEP 6: Save report to Supabase ─────────────────────────────────────
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
        video_name: videoTitle,
        tier: userTier,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save report:', saveError)
      return NextResponse.json({ report, saved: false })
    }

    // ── STEP 7: Send report-ready email (non-blocking) ──────────────────────
    try {
      const userEmail = user.email
      const userName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there'
      const topFinding =
        (report as any)?.blockers?.[0] ??
        (report as any)?.findings?.[0] ??
        (report as any)?.summary ??
        'Open your report to see your top conversion insights.'

      if (userEmail) {
        await sendEmail({
          to: userEmail,
          subject: 'Your video conversion audit is ready',
          react: ReportReadyEmail({
            userName,
            videoTitle,
            reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/report/${savedReport.id}`,
            topFinding,
            isPaid,
          }),
        })
        console.log('[Email] Report ready email sent to:', userEmail)
      }
    } catch (emailErr) {
      console.error('[Email] Report ready email failed:', emailErr)
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
