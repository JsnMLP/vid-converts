const express = require('express')
const cors = require('cors')
const { execFile } = require('child_process')
const { writeFile, mkdir, rm, readFile } = require('fs/promises')
const { existsSync } = require('fs')
const path = require('path')
const os = require('os')
const multer = require('multer')
const OpenAI = require('openai').default
const Anthropic = require('@anthropic-ai/sdk')
const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe')?.path || 'ffprobe'

const app = express()
app.use(cors())
const upload = multer({ storage: multer.memoryStorage() })

// ── Clients ──────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vidconverts.com'
const EMAIL_FROM = process.env.EMAIL_FROM || 'hello@vidconverts.com'
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'

// ── Constants ─────────────────────────────────────────────────────────────────
const COOKIES_PATH = path.join(os.tmpdir(), 'yt-cookies.txt')

// ── Job helpers ───────────────────────────────────────────────────────────────
async function markJobComplete(jobId, reportId) {
  if (!jobId) return
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'complete', report_id: reportId })
    .eq('id', jobId)
  if (error) console.error('[Jobs] Failed to mark complete:', error)
  else console.log(`[Jobs] Job ${jobId} marked complete, report ${reportId}`)
}

async function markJobFailed(jobId, errorMessage) {
  if (!jobId) return
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'failed', error: errorMessage })
    .eq('id', jobId)
  if (error) console.error('[Jobs] Failed to mark failed:', error)
  else console.log(`[Jobs] Job ${jobId} marked failed: ${errorMessage}`)
}

async function incrementUsage(user_id, usingTopup, currentCount, topupCredits) {
  if (usingTopup) {
    await supabase
      .from('subscriptions')
      .update({ topup_credits: topupCredits - 1 })
      .eq('user_id', user_id)
    console.log(`[TopUp] Used 1 credit for user ${user_id}. Remaining: ${topupCredits - 1}`)
  } else {
    await supabase
      .from('subscriptions')
      .update({ analyses_count: currentCount + 1 })
      .eq('user_id', user_id)
  }
}

// ── YouTube helpers ──────────────────────────────────────────────────────────
function isYouTubeUrl(url) {
  try {
    const parsed = new URL(url)
    return ['youtube.com', 'www.youtube.com', 'youtu.be'].includes(parsed.hostname)
  } catch { return false }
}

function isFacebookUrl(url) {
  try {
    const parsed = new URL(url)
    return ['facebook.com', 'www.facebook.com', 'fb.watch', 'fb.com'].includes(parsed.hostname)
  } catch { return false }
}

function isTikTokUrl(url) {
  try {
    const parsed = new URL(url)
    return ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].includes(parsed.hostname)
  } catch { return false }
}

function isLinkedInUrl(url) {
  try {
    const parsed = new URL(url)
    return ['linkedin.com', 'www.linkedin.com'].includes(parsed.hostname)
  } catch { return false }
}

function extractYouTubeId(url) {
  try {
    const parsed = new URL(url)
    // youtu.be/VIDEOID
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1).split('?')[0]
    // youtube.com/shorts/VIDEOID
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/shorts/')[1].split('?')[0]
    // youtube.com/watch?v=VIDEOID
    return parsed.searchParams.get('v')
  } catch { return null }
}

async function getYouTubeTitle(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return 'your video'
  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + videoId + '&key=' + apiKey
    )
    const data = await res.json()
    return data.items?.[0]?.snippet?.title || 'your video'
  } catch { return 'your video' }
}

// Fetch YouTube transcript directly — no package, no cookies, never expires
async function getYouTubeTranscript(videoId) {
  try {
    const pageRes = await fetch('https://www.youtube.com/watch?v=' + videoId, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })
    const html = await pageRes.text()
    const captionMatch = html.match(/"captionTracks":\s*\[.*?"baseUrl":\s*"([^"]+)"/)
    if (!captionMatch) {
      console.warn('No caption tracks found for video:', videoId)
      return null
    }
    const captionUrl = captionMatch[1].replace(/\u0026/g, '&')
    const captionRes = await fetch(captionUrl)
    const captionXml = await captionRes.text()
    const transcript = captionXml
      .replace(/<text[^>]*>/g, '')
      .replace(/<\/text>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return transcript.length > 20 ? transcript : null
  } catch (err) {
    console.warn('YouTube transcript fetch failed:', err.message)
    return null
  }
}


// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ── Main route ────────────────────────────────────────────────────────────────
app.post('/analyze', upload.single('file'), async (req, res) => {
  const {
    videoUrl, niche, audience, goal, user_id, user_email, user_name,
    sourceType, fileName, job_id,
    using_topup, current_count, topup_credits
  } = req.body

  // Parse usage fields passed from Vercel
  const usingTopup = using_topup === 'true'
  const currentCount = parseInt(current_count || '0', 10)
  const topupCredits = parseInt(topup_credits || '0', 10)

  if (!niche || !audience || !goal) {
    await markJobFailed(job_id, 'Missing required context fields.')
    return res.status(400).json({ error: 'Missing required context fields.' })
  }
  if (!req.file && !videoUrl) {
    await markJobFailed(job_id, 'No video provided.')
    return res.status(400).json({ error: 'No video provided.' })
  }

  // Respond immediately — Railway will keep processing async
  // (Vercel already returned jobId; Railway doesn't need to respond to Vercel)
  res.json({ received: true, job_id })

  const tempDir = path.join(os.tmpdir(), `vidconverts-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  try {
    // ── 1. Get video file ───────────────────────────────────────────────────
    let videoPath
    let videoTitle = 'your video'
    let transcript = null
    let hasTranscript = false
    let frameDescriptions = []
    let hasFrames = false

    if (req.file) {
      videoPath = path.join(tempDir, 'input.mp4')
      await writeFile(videoPath, req.file.buffer)
      videoTitle = decodeURIComponent(req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()) || 'your video'

    } else if (sourceType === 'upload' && videoUrl) {
      console.log('Downloading uploaded file from Supabase Storage:', videoUrl)
      const ext = (fileName || 'input.mp4').split('.').pop() || 'mp4'
      videoPath = path.join(tempDir, `input.${ext}`)
      videoTitle = fileName
        ? decodeURIComponent(fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim())
        : 'your video'

      const fileRes = await fetch(videoUrl)
      if (!fileRes.ok) throw new Error(`Failed to download video from storage: ${fileRes.status}`)
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      await writeFile(videoPath, buffer)

    } else if (isYouTubeUrl(videoUrl)) {
      console.log('YouTube URL detected — using transcript API + thumbnails (no download)')
      const videoId = extractYouTubeId(videoUrl)
      if (!videoId) throw new Error('Could not extract YouTube video ID from URL.')

      videoTitle = await getYouTubeTitle(videoId)
      console.log('YouTube title:', videoTitle)

      transcript = await getYouTubeTranscript(videoId)
      hasTranscript = !!transcript && transcript.trim().length > 10
      console.log('YouTube transcript:', hasTranscript ? `${transcript.split(' ').length} words` : 'not available')

      if (!hasTranscript) {
        console.log('No captions found — falling back to yt-dlp download + Whisper for', videoUrl)
        try {
          const dlResult = await downloadWithYtDlp(videoUrl, tempDir)
          videoPath = dlResult.videoPath
          if (!videoTitle || videoTitle === 'your video') videoTitle = dlResult.title
          console.log('yt-dlp fallback succeeded, videoPath:', videoPath)
        } catch (dlErr) {
          console.warn('yt-dlp fallback also failed:', dlErr.message)
        }
      }

      if (!videoPath) {
        console.log('No yt-dlp fallback — using YouTube thumbnails for visual analysis')
        const thumbnailUrls = [
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        ]
        const thumbResults = await Promise.all(thumbnailUrls.map(async (thumbUrl, i) => {
          try {
            const thumbRes = await fetch(thumbUrl)
            if (!thumbRes.ok) return null
            const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer())
            if (thumbBuffer.length < 5000) return null
            const base64 = thumbBuffer.toString('base64')
            const response = await anthropic.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: 150,
              messages: [{
                role: 'user',
                content: [
                  { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
                  { type: 'text', text: 'Describe this YouTube video thumbnail in 1-2 sentences focusing on: what is visible, any text on screen, the setting, and anything relevant to video marketing effectiveness.' }
                ]
              }]
            })
            const desc = response.content?.[0]?.text?.trim()
            if (desc) {
              console.log(`YouTube thumbnail ${i + 1} described successfully`)
              return `Thumbnail ${i + 1}: ${desc}`
            }
            return null
          } catch (err) {
            console.warn(`YouTube thumbnail ${i + 1} failed:`, err.message)
            return null
          }
        }))
        frameDescriptions = thumbResults.filter(Boolean)
        hasFrames = frameDescriptions.length > 0
        console.log(`YouTube thumbnails: ${frameDescriptions.length}/3 described`)
      } else {
        console.log('yt-dlp fallback active — real frames will be extracted below by ffmpeg')
      }

    } else if (isFacebookUrl(videoUrl)) {
      console.log('Facebook URL detected — downloading via yt-dlp')
      const dlResult = await downloadWithYtDlp(videoUrl, tempDir)
      videoPath = dlResult.videoPath
      videoTitle = dlResult.title

    } else if (isTikTokUrl(videoUrl)) {
      console.log('TikTok URL detected — downloading via yt-dlp')
      const dlResult = await downloadWithYtDlp(videoUrl, tempDir)
      videoPath = dlResult.videoPath
      videoTitle = dlResult.title

    } else if (isLinkedInUrl(videoUrl)) {
      console.log('LinkedIn URL detected — downloading via yt-dlp')
      const dlResult = await downloadWithYtDlp(videoUrl, tempDir)
      videoPath = dlResult.videoPath
      videoTitle = dlResult.title

    } else {
      const dlResult = await downloadWithYtDlp(videoUrl, tempDir)
      videoPath = dlResult.videoPath
      videoTitle = dlResult.title
    }

    // ── 2. Extract audio + 3. Whisper + 4. Frames ──────────────────────────
    if (videoPath) {
      const audioPath = path.join(tempDir, 'audio.mp3')
      try {
        await extractAudio(videoPath, audioPath)
      } catch (err) {
        console.warn('Audio extraction failed:', err.message)
      }

      try {
        const audioBuffer = await readFile(audioPath)
        const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mp3' })
        const whisperResponse = await openai.audio.transcriptions.create({
          file: audioFile, model: 'whisper-1', language: 'en',
        })
        transcript = whisperResponse.text || null
        hasTranscript = !!transcript && transcript.trim().length > 10
      } catch (err) {
        console.warn('Whisper transcription failed (continuing without):', err.message)
      }

      try {
        frameDescriptions = await extractFrameDescriptions(videoPath, tempDir)
        hasFrames = frameDescriptions.length > 0
      } catch (err) {
        console.warn('Frame extraction failed (continuing without):', err.message)
      }
    }

    // ── 5. AI analysis ──────────────────────────────────────────────────────
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
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user_id)
        .maybeSingle()

      const activePlan = subscription?.status === 'active' ? subscription?.plan : 'free'
      isPaid = activePlan === 'complete' || activePlan === 'premium'

      const { data: saved, error: saveError } = await supabase
        .from('reports')
        .insert({
          user_id,
          video_name: videoTitle,
          video_source: sourceType === 'upload' ? 'upload' : (videoUrl ? 'url' : 'upload'),
          niche,
          audience,
          goal,
          transcript: transcript || null,
          report_data: report,
          tier: activePlan === 'free' ? 'free' : activePlan,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (saveError) {
        console.error('Supabase save error:', saveError)
      } else {
        reportId = saved?.id
      }

      // ── 7. Increment usage counter ────────────────────────────────────────
      if (reportId) {
        await incrementUsage(user_id, usingTopup, currentCount, topupCredits)
      }
    }

    // ── 8. Mark job complete in Supabase ────────────────────────────────────
    await markJobComplete(job_id, reportId)

    // ── 9. Send email ───────────────────────────────────────────────────────
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

  } catch (err) {
    console.error('Analyze error:', err)
    await markJobFailed(job_id, err.message || 'Analysis failed')
  } finally {
    try { await rm(tempDir, { recursive: true, force: true }) } catch {}
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function getYtDlpTitle(url, proxyUrl) {
  return new Promise((resolve) => {
    const hasCookies = existsSync(COOKIES_PATH)
    const args = [
      '--no-playlist',
      '--print', 'title',
      ...(hasCookies ? ['--cookies', COOKIES_PATH] : []),
      ...(proxyUrl ? ['--proxy', proxyUrl] : []),
      url
    ]
    execFile('yt-dlp', args, { timeout: 30000 }, (err, stdout) => {
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
    const proxyHost = process.env.IPROYAL_HOST
    const proxyPort = process.env.IPROYAL_PORT
    const proxyUser = process.env.IPROYAL_USER
    const proxyPass = process.env.IPROYAL_PASS
    const hasProxy = proxyHost && proxyPort && proxyUser && proxyPass
    const proxyUrl = hasProxy
      ? 'http://' + proxyUser + ':' + proxyPass + '@' + proxyHost + ':' + proxyPort
      : null

    if (hasProxy) {
      console.log('Using IPRoyal residential proxy for download')
    } else {
      console.warn('No proxy configured — download may be blocked by YouTube')
    }

    const title = await getYtDlpTitle(url, proxyUrl)
    const outputTemplate = path.join(tempDir, 'video.%(ext)s')

    execFile('yt-dlp', [
      '--no-playlist',
      '--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4/bestvideo+bestaudio/best',
      '--output', outputTemplate,
      '--no-check-certificates',
      '--no-warnings',
      '--retries', '3',
      '--fragment-retries', '3',
      '--socket-timeout', '30',
      ...(proxyUrl ? ['--proxy', proxyUrl] : []),
      url
    ], { timeout: 45000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error('yt-dlp failed: ' + (stderr || err.message)))
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
  const frameDir = path.join(tempDir, 'frames')
  await mkdir(frameDir, { recursive: true })

  const duration = await getVideoDuration(videoPath)
  const timestamps = [0.1, 0.3, 0.6, 0.85].map(p => Math.floor(duration * p))

  const descriptions = []
  for (let i = 0; i < timestamps.length; i++) {
    const framePath = path.join(frameDir, `frame${i}.jpg`)
    await extractFrame(videoPath, timestamps[i], framePath)

    const frameBuffer = await readFile(framePath)
    const base64 = frameBuffer.toString('base64')

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
          },
          {
            type: 'text',
            text: `Describe this video frame in 1-2 sentences focusing on: what is visible, any text/captions on screen, the setting, and anything relevant to video marketing effectiveness.`
          }
        ]
      }]
    })

    const desc = response.content?.[0]?.text?.trim()
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

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  let raw = response.content?.[0]?.text || '{}'
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  const jsonStart = raw.indexOf('{')
  const jsonEnd = raw.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    raw = raw.slice(jsonStart, jsonEnd + 1)
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    console.error('JSON parse failed, raw length:', raw.length, 'stop_reason:', response.stop_reason)
    console.error('Parse error:', e.message)
    throw new Error('Analysis response could not be parsed. Please try again.')
  }

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
