import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { readdir } from 'fs/promises'
import OpenAI from 'openai'
import { readFileSync } from 'fs'

const execAsync = promisify(exec)

export async function checkFfmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version')
    return true
  } catch {
    return false
  }
}

export async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  const cmd = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -b:a 64k "${audioPath}" -y`
  try {
    await execAsync(cmd, { timeout: 120000 })
  } catch (error: any) {
    if (error.stderr?.includes('no audio') || error.stderr?.includes('does not contain')) {
      throw new Error('NO_AUDIO_STREAM')
    }
    throw new Error(`Audio extraction failed: ${error.message}`)
  }
}

export async function sampleFrames(videoPath: string, tempDir: string): Promise<string[]> {
  const framesDir = path.join(tempDir, 'frames')

  const { mkdir } = await import('fs/promises')
  await mkdir(framesDir, { recursive: true })

  // Sample 1 frame every 30 seconds, max 8 frames
  const cmd = `ffmpeg -i "${videoPath}" -vf "fps=1/30,scale=640:-1" -frames:v 8 "${path.join(framesDir, 'frame_%03d.jpg')}" -y`

  try {
    await execAsync(cmd, { timeout: 60000 })
  } catch (error: any) {
    throw new Error(`Frame sampling failed: ${error.message}`)
  }

  const files = (await readdir(framesDir))
    .filter(f => f.endsWith('.jpg'))
    .sort()

  if (files.length === 0) {
    throw new Error('No frames were extracted')
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const descriptions: string[] = []

  for (const file of files.slice(0, 8)) {
    const framePath = path.join(framesDir, file)
    try {
      const imageData = readFileSync(framePath).toString('base64')
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`,
                detail: 'low'
              }
            },
            {
              type: 'text',
              text: 'Describe this video frame for a conversion audit. Note: what is visible on screen, any text/captions shown, the setting/background, the person\'s appearance and body language if present, any graphics or overlays, and whether the visual looks professional or amateur. Be specific and factual. 2-3 sentences max.'
            }
          ]
        }]
      })
      const text = response.choices[0]?.message?.content || ''
      if (text) descriptions.push(`Frame ${descriptions.length + 1}: ${text}`)
    } catch (err) {
      console.error(`Failed to describe frame ${file}:`, err)
    }
  }

  return descriptions
}
