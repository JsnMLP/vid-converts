const express = require('express')
const cors = require('cors')
const { execFile, exec } = require('child_process')
const { writeFile, mkdir, rm } = require('fs/promises')
const { existsSync } = require('fs')
const path = require('path')
const os = require('os')
const app = express()

app.use(cors())

// Parse JSON but also handle multipart
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

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
    let videoPath
    let videoTitle = 'your video'

    if (req.file) {
      videoPath = path.join(tempDir, 'input.mp4')
      await writeFile(videoPath, req.file.buffer)
      videoTitle = req.file.originalname

    } else if (videoUrl) {
      const dlResult = await downloadWithYtDlp(videoUrl, tempDir)
      videoPath = dlResult.videoPath
      videoTitle = dlResult.title
    }

    // Forward to Vercel for OpenAI processing
    res.json({
      status: 'processing',
      videoPath,
      videoTitle,
      message: 'Video downloaded successfully'
    })

  } catch (err) {
    console.error('Analyze error:', err)
    res.status(500).json({ error: err.message || 'Analysis failed' })
  } finally {
    try { await rm(tempDir, { recursive: true, force: true }) } catch {}
  }
})

function downloadWithYtDlp(url, tempDir) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(tempDir, '%(title)s.%(ext)s')
    execFile('yt-dlp', [
      '--no-playlist',
      '--format', 'mp4/bestvideo+bestaudio/best',
      '--output', outputTemplate,
      '--print', 'filename',
      url
    ], { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`yt-dlp failed: ${stderr || err.message}`))
      const videoPath = stdout.trim().split('\n').pop()
      const title = path.basename(videoPath, path.extname(videoPath))
      resolve({ videoPath, title })
    })
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => console.log(`Railway analyze service running on port ${PORT}`))