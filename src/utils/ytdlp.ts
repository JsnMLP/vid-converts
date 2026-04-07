import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

/**
 * Checks whether yt-dlp is available on this machine/server.
 */
export async function checkYtDlp(): Promise<boolean> {
  try {
    await execAsync('yt-dlp --version')
    return true
  } catch {
    return false
  }
}

/**
 * Validates that a URL is a supported video platform.
 * yt-dlp supports 1000+ sites — this is just a UX guard for clear error messages.
 */
export function getSupportedPlatform(url: string): string | null {
  const patterns: Record<string, string> = {
    'youtube.com':  'YouTube',
    'youtu.be':     'YouTube',
    'vimeo.com':    'Vimeo',
    'tiktok.com':   'TikTok',
    'instagram.com':'Instagram',
    'facebook.com': 'Facebook',
    'twitter.com':  'Twitter/X',
    'x.com':        'Twitter/X',
    'loom.com':     'Loom',
    'wistia.com':   'Wistia',
  }
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    for (const [domain, name] of Object.entries(patterns)) {
      if (hostname.includes(domain)) return name
    }
    // Still try — yt-dlp supports many more sites
    return 'video'
  } catch {
    return null
  }
}

export interface YtDlpResult {
  videoPath: string
  title: string
  duration: number  // seconds
  platform: string
}

/**
 * Downloads a video from a URL using yt-dlp.
 * Outputs an mp4 to the specified directory.
 * Enforces a 10-minute duration limit to prevent abuse.
 */
export async function downloadVideo(
  url: string,
  outputDir: string,
  options: { maxDurationSeconds?: number } = {}
): Promise<YtDlpResult> {
  const maxDuration = options.maxDurationSeconds ?? 600 // 10 min default

  const platform = getSupportedPlatform(url)
  if (!platform) {
    throw new Error('Invalid URL. Please provide a valid video URL.')
  }

  const outputPath = path.join(outputDir, 'input.mp4')

  // Step 1: Get video metadata first to check duration
  let title = 'Unknown video'
  let duration = 0
  try {
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-playlist "${url}"`,
      { timeout: 30000 }
    )
    const meta = JSON.parse(stdout.trim().split('\n')[0]) // first result only
    title = meta.title ?? title
    duration = meta.duration ?? 0

    if (duration > maxDuration) {
      throw new Error(
        `Video is ${Math.round(duration / 60)} minutes long. ` +
        `Please use a video under ${Math.round(maxDuration / 60)} minutes for analysis.`
      )
    }
  } catch (err: any) {
    // If it's our own duration error, re-throw it
    if (err.message?.includes('minutes long')) throw err
    // Otherwise metadata fetch failed — still attempt download
    console.warn('[yt-dlp] Could not fetch metadata, attempting download anyway:', err.message)
  }

  // Step 2: Download the video
  // - best mp4 format under 1080p to keep file size reasonable
  // - no playlist, just single video
  // - merge into mp4 container
  const downloadCmd = [
    'yt-dlp',
    `"${url}"`,
    '--no-playlist',
    '--format "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"',
    '--merge-output-format mp4',
    `--output "${outputPath}"`,
    '--no-warnings',
    '--quiet',
  ].join(' ')

  try {
    await execAsync(downloadCmd, { timeout: 300000 }) // 5 min download timeout
  } catch (err: any) {
    console.error('[yt-dlp] Download failed:', err.message)

    // Provide friendly error messages for common failures
    if (err.message?.includes('Private video') || err.message?.includes('not available')) {
      throw new Error('This video is private or unavailable. Please use a public video URL.')
    }
    if (err.message?.includes('Sign in') || err.message?.includes('age')) {
      throw new Error('This video requires sign-in or is age-restricted and cannot be analysed.')
    }
    if (err.message?.includes('copyright') || err.message?.includes('blocked')) {
      throw new Error('This video is blocked due to copyright restrictions.')
    }
    throw new Error(`Could not download video from ${platform}. Please check the URL and try again.`)
  }

  if (!existsSync(outputPath)) {
    throw new Error('Download appeared to succeed but output file was not created.')
  }

  return { videoPath: outputPath, title, duration, platform }
}
