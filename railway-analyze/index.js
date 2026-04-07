const express = require('express')
const cors = require('cors')
const { execFile } = require('child_process')
const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/analyze', (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL required' })

  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    url
  ]

  execFile('yt-dlp', args, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('yt-dlp error:', error.message)
      return res.status(500).json({ error: 'Failed to analyze URL', details: error.message })
    }
    try {
      const data = JSON.parse(stdout)
      res.json(data)
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse yt-dlp output' })
    }
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Railway analyze service running on port ${PORT}`)) 
