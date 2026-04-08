const express = require('express')
const cors = require('cors')
const { execFile } = require('child_process')
const { writeFile, mkdir, rm, readFile } = require('fs/promises')
const { existsSync } = require('fs')
const path = require('path')
const os = require('os')
const multer = require('multer')
const OpenAI = require('openai').default
const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe')?.path || 'ffprobe'

const app = express()
app.use(cors())
const upload = multer({ storage: multer.memoryStorage() })

// ── Clients ──────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vidconverts.com'
const EMAIL_FROM = process.env.EMAIL_FROM || 'hello@vidconverts.com'
const ANALYSIS_MODEL = process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o'

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ── Main route ────────────────────────────────────────────────────────────────
app.post('/analyze', upload.single('file'), async (req, res) => {
  const { videoUrl, niche, audience, goal, user_id, user_email, user_name } = req.body

  if (!niche || !audience || !goal) {
    return res.status(400).json({ error: 'Missing required context fields.' })
  }
  if (!req.file && !videoUrl) {
    return res.status(400).json({ error: 'No video provided.' })
  }

  const tempDir = path.join(os.tmpdir(), `vidconverts-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  try {
    // ── 1. Get video file ───────────────────────────────────────────────────
    let videoPath
    let videoTitle = 'your video'

    if (req.file) {
      videoPath = path.join(tempDir, 'input.mp4')
      await writeFile(videoPath, req.file.buffer)
      // FIX: Clean up filename — strip extension and decode any URL encoding
      videoTitle = decodeURIComponent(req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()) || 'your video'
    } else {
      const dlResult = await downloadWithYtDlp(videoUrl, tempDir)
      videoPath = dlResult.videoPath
      videoTitle = dlResult.title
    }

    // ── 2. Extract audio with ffmpeg ────────────────────────────────────────
    const audioPath = path.join(tempDir, 'audio.mp3')
    await extractAudio(videoPath, audioPath)

    // ── 3. Whisper transcription ────────────────────────────────────────────
    let transcript = null
    let hasTranscript = false
    try {
      const audioBuffer = await readFile(audioPath)
      const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mp3' })
      const whisperResponse = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      })
      transcript = whisperResponse.text || null
      hasTranscript = !!transcript && transcript.trim().length > 10
    } catch (err) {
      console.warn('Whisper transcription failed (continuing without):', err.message)
    }

    // ── 4. Frame descriptions (lightweight vision pass) ─────────────────────
    let frameDescriptions = []
    let hasFrames = false
    try {
      frameDescriptions = await extractFrameDescriptions(videoPath, tempDir)
      hasFrames = frameDescriptions.length > 0
    } catch (err) {
      console.warn('Frame extraction failed (continuing without):', err.message)
    }

    // ── 5. OpenAI analysis ──────────────────────────────────────────────────
    const report = await analyzeVideo({
      transcript,
      frameDescriptions,
      niche,
      audience,
      goal,
      hasTranscript,
      hasFrames,
    })

    // ── 6. Supabase save ────────────────────────────────────────────────────
    let reportId = null
    let isPaid = false

    if (user_id) {
      // Check if user has paid plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user_id)
        .single()

      isPaid = profile?.tier === 'complete' || profile?.tier === 'premium'

      const { data: saved, error: saveError } = await supabase
        .from('reports')
        .insert({
          user_id,
          video_name: videoTitle,
          video_source: videoUrl ? 'url' : 'upload',
          niche,
          audience,
          goal,
          transcript: transcript || null,
          report_data: report,
          tier: isPaid ? 'complete' : 'free',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (saveError) {
        console.error('Supabase save error:', saveError)
      } else {
        reportId = saved?.id
      }
    }

    // ── 7. Send email ───────────────────────────────────────────────────────
    if (user_email && reportId) {
      const reportUrl = `${APP_URL}/reports/${reportId}`
      const topFinding = report.rubricScores?.[0]?.finding || report.evidenceSummary || ''

      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: user_email,
          subject: `Your video audit is ready — ${videoTitle}`,
          html: buildReportEmail({
            userName: user_name || 'there',
            videoTitle,
            reportUrl,
            topFinding,
            isPaid,
          }),
        })
      } catch (emailErr) {
        console.warn('Email send failed (non-fatal):', emailErr.message)
      }
    }

    // ── 8. Respond ──────────────────────────────────────────────────────────
    return res.json({
      success: true,
      reportId,
      videoTitle,
      report,
    })

  } catch (err) {
    console.error('Analyze error:', err)
    return res.status(500).json({ error: err.message || 'Analysis failed' })
  } finally {
    try { await rm(tempDir, { recursive: true, force: true }) } catch {}
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

// FIX: Extract real video title from yt-dlp using --print title before downloading.
// Falls back to 'your video' only if title extraction fails.
function getYtDlpTitle(url) {
  return new Promise((resolve) => {
    execFile('yt-dlp', [
      '--no-playlist',
      '--print', 'title',
      url
    ], { timeout: 30000 }, (err, stdout) => {
      if (err || !stdout?.trim()) {
        console.warn('yt-dlp title extraction failed, using fallback')
        resolve('your video')
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

function downloadWithYtDlp(url, tempDir) {
  return new Promise(async (resolve, reject) => {
    // FIX: Get the real title first, then download
    const title = await getYtDlpTitle(url)

    const outputTemplate = path.join(tempDir, 'video.%(ext)s')
    execFile('yt-dlp', [
      '--no-playlist',
      '--format', 'mp4/bestvideo+bestaudio/best',
      '--output', outputTemplate,
      '--extractor-args', 'youtube:player_client=ios',
      '--no-check-certificates',
      url
    ], { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`yt-dlp failed: ${stderr || err.message}`))
      const files = require('fs').readdirSync(tempDir)
      const videoFile = files.find(f => f.startsWith('video.'))
      if (!videoFile) return reject(new Error('Downloaded video file not found'))
      const videoPath = path.join(tempDir, videoFile)
      resolve({ videoPath, title })
    })
  })
}

function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, [
      '-i', videoPath,
      '-vn',
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'libmp3lame',
      '-q:a', '4',
      audioPath,
      '-y'
    ], { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`ffmpeg failed: ${stderr || err.message}`))
      resolve()
    })
  })
}

async function extractFrameDescriptions(videoPath, tempDir) {
  // Extract 4 frames at 10%, 30%, 60%, 85% through the video
  const frameDir = path.join(tempDir, 'frames')
  await mkdir(frameDir, { recursive: true })

  // Get video duration first
  const duration = await getVideoDuration(videoPath)
  const timestamps = [0.1, 0.3, 0.6, 0.85].map(p => Math.floor(duration * p))

  const descriptions = []
  for (let i = 0; i < timestamps.length; i++) {
    const framePath = path.join(frameDir, `frame${i}.jpg`)
    await extractFrame(videoPath, timestamps[i], framePath)

    const frameBuffer = await readFile(framePath)
    const base64 = frameBuffer.toString('base64')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' }
          },
          {
            type: 'text',
            text: `Describe this video frame in 1-2 sentences focusing on: what is visible, any text/captions on screen, the setting, and anything relevant to video marketing effectiveness.`
          }
        ]
      }],
      max_tokens: 150,
    })

    const desc = response.choices[0]?.message?.content?.trim()
    if (desc) descriptions.push(`Frame ${i + 1} (~${Math.round(timestamps[i])}s): ${desc}`)
  }

  return descriptions
}

function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    execFile(ffprobePath, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ], { timeout: 30000 }, (err, stdout) => {
      if (err) return reject(err)
      resolve(parseFloat(stdout.trim()) || 60)
    })
  })
}

function extractFrame(videoPath, timestamp, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, [
      '-ss', String(timestamp),
      '-i', videoPath,
      '-frames:v', '1',
      '-q:v', '5',
      outputPath,
      '-y'
    ], { timeout: 30000 }, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

async function analyzeVideo({ transcript, frameDescriptions, niche, audience, goal, hasTranscript, hasFrames }) {
  const evidenceBlock = buildEvidenceBlock({ transcript, frameDescriptions, hasTranscript, hasFrames })

  const prompt = `You are a world-class video marketing coach — part conversion strategist, part encouraging mentor. Your role is to give creators an honest, evidence-based audit that genuinely builds them up while identifying clear paths to improvement.

CORE PHILOSOPHY:
You believe great marketing speaks to both PAIN and PLEASURE. Pain = the problem the viewer wants to escape. Pleasure = the outcome they're excited to reach. The best videos address both. Your analysis must reflect this balance.

Your tone is that of a trusted expert who has reviewed thousands of videos. You celebrate genuine wins enthusiastically, you're honest about what needs work, and you always leave the creator feeling more capable and motivated than before they read your report — never deflated.

CRITICAL EVIDENCE RULE: Every finding must be grounded in the actual evidence provided. Do not invent or fabricate. If you cannot find evidence for something, say so clearly. Never produce generic advice that could apply to any video.

VIDEO CONTEXT:
- Industry/Niche: ${niche}
- Target Customer: ${audience}
- Goal of Video: ${goal}

EVIDENCE:
${evidenceBlock}

YOUR TASK — produce a JSON report with this exact structure:

1. openingCelebration: Start with 2-3 sentences of genuine, specific praise based on what the evidence shows this creator did well. Be specific — reference actual content. This sets an encouraging tone before any critique.

2. evidenceSummary: 2-3 sentences on what evidence was available and the overall conversion potential you see.

3. rubricScores: Score each of the 8 categories below on a scale of 1-10 based ONLY on evidence:

   For EACH category provide:
   - score (1-10)
   - evidence: direct quote from transcript OR specific frame observation (or "INSUFFICIENT_EVIDENCE")
   - finding: what you found — written in a coaching voice, acknowledge what's working first
   - recommendation: specific, actionable improvement — frame it as an exciting opportunity, not just a fix. Include both the PAIN angle (problem to solve) AND the PLEASURE angle (positive outcome to amplify)
   - celebration: 1 sentence specifically celebrating something genuine in this category, even if the score is low. Find the positive. If truly nothing positive, celebrate their courage in creating content at all.
   - pleasureAngle: 1 sentence describing the positive outcome or reward the viewer could gain — the "towards" motivation, not just "away from pain"

   CATEGORIES:
   1. Hook — Does the opening stop the scroll?
   2. Problem Clarity — Is "${audience}"'s specific pain addressed?
   3. Offer Clarity — Is the solution clearly explained?
   4. Trust & Proof — Are credentials, results, or social proof present?
   5. CTA — Is there a specific call to action?
   6. Visual Communication — Are visuals clear and professional?
   7. Platform Fit — Does format/length/pacing match the platform?
   8. Measurement Readiness — Are tracking mechanisms present?

4. strengths: Array of 4-6 genuine strengths backed by evidence.
5. blockers: Array of 4-6 conversion blockers written as coachable opportunities.
6. actionChecklist: 6-8 specific, prioritised action items starting with a verb.
7. measurementGuidance: 4-5 specific measurement suggestions tied to the goal.
8. transcriptHighlights: 3-5 most significant direct quotes from the transcript.
9. frameObservations: 3-5 most significant visual observations.
10. missingEvidence: What could not be assessed and why.
11. overallScore: A number 1-100 reflecting overall conversion potential.

Respond ONLY with a valid JSON object matching this structure exactly:
{
  "overallScore": <number>,
  "openingCelebration": "<string>",
  "evidenceSummary": "<string>",
  "rubricScores": [
    {
      "category": "<string>",
      "score": <number>,
      "evidence": "<string>",
      "finding": "<string>",
      "recommendation": "<string>",
      "celebration": "<string>",
      "pleasureAngle": "<string>"
    }
  ],
  "strengths": ["<string>"],
  "blockers": ["<string>"],
  "actionChecklist": ["<string>"],
  "measurementGuidance": ["<string>"],
  "transcriptHighlights": ["<string>"],
  "frameObservations": ["<string>"],
  "missingEvidence": ["<string>"]
}`

  const response = await openai.chat.completions.create({
    model: ANALYSIS_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)
  // Normalize missingEvidence to always be an array
  if (typeof parsed.missingEvidence === 'string') {
    parsed.missingEvidence = [parsed.missingEvidence]
  }
  return { ...parsed, generatedAt: new Date().toISOString() }
}

function buildEvidenceBlock({ transcript, frameDescriptions, hasTranscript, hasFrames }) {
  const parts = []

  if (hasTranscript && transcript) {
    const words = transcript.split(' ')
    const opening = words.slice(0, 60).join(' ')
    const closing = words.slice(-40).join(' ')
    parts.push(`TRANSCRIPT (${words.length} words total):
Opening (first 60 words): "${opening}"
Closing (last 40 words): "${closing}"
Full transcript: "${transcript}"`)
  } else {
    parts.push('TRANSCRIPT: Not available — video appears to have no speech or audio could not be extracted.')
  }

  if (hasFrames && frameDescriptions.length > 0) {
    parts.push(`FRAME OBSERVATIONS (${frameDescriptions.length} frames sampled):
${frameDescriptions.join('\n')}`)
  } else {
    parts.push('FRAME OBSERVATIONS: Not available — frames could not be extracted.')
  }

  return parts.join('\n\n')
}

function buildReportEmail({ userName, videoTitle, reportUrl, topFinding, isPaid }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#f6f9fc;font-family:Arial,sans-serif;margin:0;padding:40px 0;">
  <div style="background:#fff;margin:0 auto;padding:40px 32px;border-radius:8px;max-width:520px;">
    <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:8px;">Your audit is ready 🎯</h1>
    <p style="font-size:15px;color:#444;line-height:1.6;">Hi ${userName},</p>
    <p style="font-size:15px;color:#444;line-height:1.6;">
      We've finished analysing <strong>${videoTitle}</strong>. Here's your top finding:
    </p>
    <div style="background:#f0f4ff;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin:16px 0;">
      <p style="font-size:14px;color:#3730a3;font-style:italic;margin:0;">"${topFinding}"</p>
    </div>
    <a href="${reportUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;font-weight:600;font-size:15px;text-decoration:none;display:inline-block;margin:16px 0;">
      View Full Report
    </a>
    ${!isPaid ? `<p style="font-size:13px;color:#666;background:#fffbeb;padding:12px;border-radius:4px;">
      🔒 Unlock all findings, scripts, and A/B recommendations with a Complete plan.
    </p>` : ''}
    <hr style="border-color:#e5e7eb;margin:24px 0;">
    <p style="font-size:12px;color:#9ca3af;text-align:center;">Vid Converts · Evidence-based video audits</p>
  </div>
</body>
</html>`
}

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => console.log(`Railway analyze service running on port ${PORT}`))
