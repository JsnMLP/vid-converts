'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import styles from './UploadZone.module.css'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  userEmail?: string
  userName?: string
}

type UploadMode = 'file' | 'url'
type Step = 'upload' | 'context' | 'processing' | 'error'

const MAX_FILE_SIZE = 500 * 1024 * 1024
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime']

const PROCESSING_STEPS = [
  'Uploading video…',
  'Extracting audio…',
  'Transcribing speech…',
  'Sampling frames…',
  'Scoring against conversion rubric…',
  'Generating evidence-based report…',
]

export default function UploadZone({ userId, userEmail, userName }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<UploadMode>('file')
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [urlWarning, setUrlWarning] = useState('')
  const [fileError, setFileError] = useState('')
  const [processingStep, setProcessingStep] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLimitError, setIsLimitError] = useState(false)
  const [limitPlan, setLimitPlan] = useState<string>('free')
  const [jobId, setJobId] = useState<string | null>(null)

  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [goal, setGoal] = useState('')
  const [platform, setPlatform] = useState('')
  const [contextErrors, setContextErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Poll job status ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId || step !== 'processing') return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (!res.ok) return // keep polling — transient error

        const job = await res.json()

        if (job.status === 'complete') {
          stopPolling()
          if (job.report_id) {
            router.push(`/report/${job.report_id}`)
          } else {
            setErrorMessage('Report was created but we lost the ID. Please check your dashboard.')
            setStep('error')
          }
        } else if (job.status === 'failed') {
          stopPolling()
          setErrorMessage(job.error || 'Analysis failed. Please try again.')
          setStep('error')
        }
        // status === 'pending' → keep polling
      } catch {
        // network hiccup — keep polling
      }
    }, 3000)

    return () => stopPolling()
  }, [jobId, step])

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current)
      stepIntervalRef.current = null
    }
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetFile(file)
  }, [])

  const validateAndSetFile = (file: File) => {
    setFileError('')
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Please upload an MP4 or MOV file.'); return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large. Max 500MB. Yours is ${(file.size / 1024 / 1024).toFixed(0)}MB.`); return
    }
    setSelectedFile(file)
  }

  const validateUrl = (url: string) => {
    setUrlError('')
    setUrlWarning('')

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlError("That doesn't look like a URL. Paste the full link starting with https://")
      return false
    }

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      setUrlError("That doesn't look like a valid URL.")
      return false
    }

    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'instagram.com') {
      if (!parsed.pathname.includes('/reel/')) {
        setUrlError("That looks like an Instagram profile or post, not a reel. Open the reel, tap Share → Copy Link. The URL should contain '/reel/' in it.")
        return false
      }
      return true
    }

    if (['facebook.com', 'fb.com'].includes(host)) {
      if (!parsed.pathname.includes('/reel') && !parsed.pathname.includes('/videos/')) {
        setUrlError("That looks like a Facebook profile or page. Open the specific reel or video, tap Share → Copy Link. The URL should contain '/reel' or '/videos/' in it.")
        return false
      }
      return true
    }
    if (host === 'fb.watch') return true

    if (['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].includes(host)) {
      if (host === 'tiktok.com' && !parsed.pathname.includes('/video/')) {
        setUrlError("That looks like a TikTok profile. Open the specific video, tap Share → Copy Link. The URL should contain '/video/' in it.")
        return false
      }
      return true
    }

    if (['youtube.com', 'youtu.be', 'vimeo.com'].includes(host)) return true
    if (host === 'linkedin.com') {
      setUrlWarning("LinkedIn videos work if they're public. If the video requires you to be logged in, it may fail — in that case, download it and upload as an MP4 instead.")
      return true
    }

    if (['twitter.com', 'x.com'].includes(host)) {
      setUrlError("Twitter/X links aren't supported. Try YouTube, TikTok, Instagram, Facebook, LinkedIn, or Vimeo.")
      return false
    }
    if (host === 'snapchat.com') {
      setUrlError("Snapchat links aren't supported. Try YouTube, TikTok, Instagram, Facebook, LinkedIn, or Vimeo.")
      return false
    }
    if (host === 'pinterest.com') {
      setUrlError("Pinterest links aren't supported. Try YouTube, TikTok, Instagram, Facebook, LinkedIn, or Vimeo.")
      return false
    }
    if (['twitch.tv', 'kick.com'].includes(host)) {
      setUrlError("Twitch/Kick links aren't supported. Upload the video as an MP4 instead.")
      return false
    }
    if (host === 'threads.net') {
      setUrlError("Threads links aren't supported. Try Instagram, TikTok, YouTube, Facebook, LinkedIn, or Vimeo.")
      return false
    }

    setUrlError("That URL isn't supported. Paste a link from YouTube, TikTok, Instagram, Facebook, LinkedIn, or Vimeo.")
    return false
  }

  const handleContinue = () => {
    if (mode === 'file' && !selectedFile) { setFileError('Please select a video file first.'); return }
    if (mode === 'url') {
      if (!videoUrl) { setUrlError('Please paste a video URL.'); return }
      if (!validateUrl(videoUrl)) return
    }
    setStep('context')
  }

  const validateContext = () => {
    const errors: Record<string, string> = {}
    if (!niche.trim()) errors.niche = 'Please describe your industry or niche.'
    if (!audience.trim()) errors.audience = 'Please describe your target customer.'
    if (!goal.trim()) errors.goal = 'Please describe the goal of this video.'
    if (!platform.trim()) errors.platform = 'Please select the platform for this video.'
    setContextErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateContext()) return
    setStep('processing')
    setProcessingStep(0)
    setIsLimitError(false)
    setJobId(null)

    // Animate processing steps — cosmetic only, real status comes from polling
    stepIntervalRef.current = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) return prev + 1
        clearInterval(stepIntervalRef.current!)
        return prev
      })
    }, 18000)

    try {
      let response: Response

      if (mode === 'file' && selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('niche', niche)
        formData.append('audience', audience)
        formData.append('goal', goal)
        formData.append('platform', platform)
        formData.append('sourceType', 'file')
        formData.append('fileName', selectedFile.name)
        response = await fetch('/api/analyze', { method: 'POST', body: formData })
      } else {
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl,
            niche,
            audience,
            goal,
            platform,
            sourceType: 'url',
          }),
        })
      }

      const result = await response.json()

      if (!response.ok) {
        stopPolling()
        if (result.code === 'LIMIT_REACHED') {
          setIsLimitError(true)
          setLimitPlan(result.plan ?? 'free')
          setErrorMessage(result.error ?? 'Monthly limit reached.')
        } else {
          setErrorMessage(result.error ?? 'Something went wrong. Please try again.')
        }
        setStep('error')
        return
      }

      // New async flow: Vercel returns jobId instantly
      if (result.jobId) {
        setJobId(result.jobId)
        // Polling kicks off via the useEffect watching jobId
      } else {
        // Fallback: old synchronous response with reportId (safety net)
        stopPolling()
        if (result.reportId) {
          router.push(`/report/${result.reportId}`)
        } else {
          setErrorMessage('Report was created but we lost the ID. Please check your dashboard.')
          setStep('error')
        }
      }
    } catch {
      stopPolling()
      setErrorMessage('Network error. Please check your connection and try again.')
      setStep('error')
    }
  }

  const handleReset = () => {
    stopPolling()
    setStep('upload')
    setSelectedFile(null)
    setVideoUrl('')
    setUrlError('')
    setFileError('')
    setErrorMessage('')
    setIsLimitError(false)
    setProcessingStep(0)
    setJobId(null)
    setNiche('')
    setAudience('')
    setGoal('')
    setPlatform('')
    setContextErrors({})
  }

  if (step === 'upload') return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${mode === 'file' ? styles.tabActive : ''}`}
          onClick={() => { setMode('file'); setFileError(''); setUrlError('') }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 7v5M5.5 9.5L8 7l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Upload file
        </button>
        <button className={`${styles.tab} ${mode === 'url' ? styles.tabActive : ''}`}
          onClick={() => { setMode('url'); setFileError(''); setUrlError('') }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Paste URL
        </button>
      </div>

      {mode === 'file' && (
        <div className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''} ${selectedFile ? styles.dropzoneSelected : ''}`}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept=".mp4,.mov,video/mp4,video/quicktime"
            onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f) }}
            className={styles.hiddenInput} />
          {!selectedFile ? (
            <>
              <div className={styles.dropIcon}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 8v16M13 15l7-7 7 7" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 30v2a2 2 0 002 2h20a2 2 0 002-2v-2" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className={styles.dropTitle}>{isDragging ? 'Drop it here' : 'Drag your video here'}</p>
              <p className={styles.dropSub}>or click to browse — MP4 or MOV, up to 500MB</p>
              <a
                href="https://www.freeconvert.com/video-compressor"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: '12px',
                  color: 'var(--teal)',
                  textDecoration: 'none',
                  marginTop: '8px',
                  display: 'inline-block',
                  opacity: 0.8,
                }}
              >
                Video over 500MB? Compress it free →
              </a>
            </>
          ) : (
            <div className={styles.fileSelected}>
              <div className={styles.fileIcon}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 4a2 2 0 012-2h8l6 6v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4z" stroke="var(--teal)" strokeWidth="1.5"/>
                  <path d="M14 2v6h6" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className={styles.fileInfo}>
                <strong>{selectedFile.name}</strong>
                <span>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <button className={styles.removeFile}
                onClick={e => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>✕</button>
            </div>
          )}
        </div>
      )}

      {mode === 'url' && (
        <div className={styles.urlZone}>
          <div className={styles.urlInputWrap}>
            <svg className={styles.urlIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7.5 10.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L8.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10.5 7.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="url" className={styles.urlInput} placeholder="https://youtube.com/watch?v=..."
              value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setUrlError(''); setUrlWarning('') }} />
            {videoUrl && <button className={styles.clearUrl} onClick={() => setVideoUrl('')}>✕</button>}
          </div>
          <p className={styles.urlHint}>Supports YouTube, Vimeo, Instagram, Facebook, TikTok, and LinkedIn</p>
          {urlWarning && <p className={styles.urlWarning}>{urlWarning}</p>}
        </div>
      )}

      {(fileError || urlError) && <p className={styles.error}>{fileError || urlError}</p>}

      <button className={styles.continueBtn} onClick={handleContinue}
        disabled={mode === 'file' ? !selectedFile : !videoUrl}>
        Continue — Add context
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )

  if (step === 'context') return (
    <div className={styles.container}>
      <div className={styles.contextHeader}>
        <button className={styles.backBtn} onClick={() => setStep('upload')}>← Back</button>
        <div className={styles.contextTitle}>
          <h2>Tell us about your video</h2>
          <p>These four fields are required. They make your report specific to your business — without them, the analysis would be generic.</p>
        </div>
      </div>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label}>Your industry or niche <span className={styles.required}>*</span></label>
          <p className={styles.fieldHint}>e.g. "Business coach for female entrepreneurs" or "Online fitness trainer for busy dads"</p>
          <input type="text" className={`${styles.input} ${contextErrors.niche ? styles.inputError : ''}`}
            placeholder="Describe your industry or niche..." value={niche}
            onChange={e => { setNiche(e.target.value); setContextErrors(p => ({ ...p, niche: '' })) }} maxLength={200} />
          {contextErrors.niche && <p className={styles.fieldError}>{contextErrors.niche}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Your target customer <span className={styles.required}>*</span></label>
          <p className={styles.fieldHint}>e.g. "Coaches earning under $5k/month who want to scale"</p>
          <input type="text" className={`${styles.input} ${contextErrors.audience ? styles.inputError : ''}`}
            placeholder="Describe your ideal customer..." value={audience}
            onChange={e => { setAudience(e.target.value); setContextErrors(p => ({ ...p, audience: '' })) }} maxLength={200} />
          {contextErrors.audience && <p className={styles.fieldError}>{contextErrors.audience}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Goal of this video <span className={styles.required}>*</span></label>
          <p className={styles.fieldHint}>e.g. "Book a discovery call" or "Get people to buy my $297 course"</p>
          <input type="text" className={`${styles.input} ${contextErrors.goal ? styles.inputError : ''}`}
            placeholder="What should viewers do after watching?" value={goal}
            onChange={e => { setGoal(e.target.value); setContextErrors(p => ({ ...p, goal: '' })) }} maxLength={200} />
          {contextErrors.goal && <p className={styles.fieldError}>{contextErrors.goal}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Where is this video posted? <span className={styles.required}>*</span></label>
          <p className={styles.fieldHint}>This helps us assess aspect ratio, pacing, captions, and platform-specific best practices.</p>
          <select
            className={`${styles.input} ${contextErrors.platform ? styles.inputError : ''}`}
            value={platform}
            onChange={e => { setPlatform(e.target.value); setContextErrors(p => ({ ...p, platform: '' })) }}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Select a platform...</option>
            <option value="YouTube (landscape 16:9)">YouTube (landscape 16:9)</option>
            <option value="YouTube Shorts (vertical 9:16)">YouTube Shorts (vertical 9:16)</option>
            <option value="Instagram Reels (vertical 9:16)">Instagram Reels (vertical 9:16)</option>
            <option value="TikTok (vertical 9:16)">TikTok (vertical 9:16)</option>
            <option value="Facebook (landscape or square)">Facebook (landscape or square)</option>
            <option value="LinkedIn (landscape 16:9)">LinkedIn (landscape 16:9)</option>
            <option value="Website / landing page">Website / landing page</option>
            <option value="Not sure yet">Not sure yet</option>
          </select>
          {contextErrors.platform && <p className={styles.fieldError}>{contextErrors.platform}</p>}
        </div>
      </div>
      <div className={styles.uploadSummary}>
        <span className={styles.summaryIcon}>🎬</span>
        <span className={styles.summaryText}>{selectedFile ? selectedFile.name : videoUrl}</span>
      </div>
      <button className={styles.continueBtn} onClick={handleSubmit}>
        Start analysis
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )

  if (step === 'processing') return (
    <div className={styles.container}>
      <div className={styles.processing}>
        <div className={styles.processingSpinner} />
        <h2>Analyzing your video</h2>
        <div className={styles.processingSteps}>
          {PROCESSING_STEPS.map((s, i) => (
            <div key={i} className={`${styles.processingStep} ${i <= processingStep ? styles.processingStepActive : ''}`}>
              <span className={`${styles.processingDot} ${i <= processingStep ? styles.processingDotActive : ''}`} />
              {s}
            </div>
          ))}
        </div>
        <p className={styles.processingNote}>This takes 1–3 minutes. Do not close this tab.</p>
        <button className={styles.cancelBtn} onClick={handleReset}>Cancel</button>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div className={styles.container}>
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>{isLimitError ? '🔒' : '⚠'}</div>
        <h2>{isLimitError ? "You've reached your monthly limit" : 'Analysis could not be completed'}</h2>
        <p>{errorMessage}</p>
        {isLimitError ? (
          <a
            href={`/pricing?limit=reached&plan=${limitPlan}`}
            className={styles.continueBtn}
            style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            See upgrade options
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ) : (
          <>
            <div style={{
              background: 'rgba(45,212,191,0.06)',
              border: '1px solid rgba(45,212,191,0.2)',
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '13px',
              color: '#9CA3AF',
              lineHeight: 1.6,
              textAlign: 'left',
              marginTop: '4px',
            }}>
              <strong style={{ color: '#2DD4BF', display: 'block', marginBottom: '4px' }}>
                Your report may still be on its way
              </strong>
              Video analysis can take 2-3 minutes. If you submitted a video, check your{' '}
              <a href="/dashboard" style={{ color: '#2DD4BF', textDecoration: 'underline' }}>dashboard</a>
              {' '}and your email - your report may have completed successfully in the background.
            </div>
            <button className={styles.continueBtn} onClick={handleReset} style={{ marginTop: '8px' }}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )

  return null
}
