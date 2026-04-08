'use client'

import { useState, useRef, useCallback } from 'react'
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
const RAILWAY_URL = 'https://vid-converts-production.up.railway.app'

const PROCESSING_STEPS = [
  'Uploading video…',
  'Extracting audio…',
  'Transcribing speech via Whisper AI…',
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
  const [fileError, setFileError] = useState('')
  const [processingStep, setProcessingStep] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [goal, setGoal] = useState('')
  const [contextErrors, setContextErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

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
    try {
      const parsed = new URL(url)
      const validHosts = [
        'youtube.com', 'www.youtube.com', 'youtu.be',
        'vimeo.com', 'www.vimeo.com',
        'instagram.com', 'www.instagram.com',
        'facebook.com', 'www.facebook.com', 'fb.watch', 'fb.com',
        'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com',
      ]
      if (!validHosts.some(h => parsed.hostname === h)) {
        setUrlError('Please paste a YouTube, Vimeo, Instagram, Facebook, or TikTok URL.'); return false
      }
      return true
    } catch {
      setUrlError('That doesn\'t look like a valid URL.'); return false
    }
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
    setContextErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateContext()) return
    setStep('processing')
    setProcessingStep(0)

    const stepInterval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) return prev + 1
        clearInterval(stepInterval)
        return prev
      })
    }, 8000)

    try {
      // Send directly to Railway — no Vercel, no Supabase Storage involved
      const formData = new FormData()
      formData.append('niche', niche)
      formData.append('audience', audience)
      formData.append('goal', goal)
      formData.append('user_id', userId)
      if (userEmail) formData.append('user_email', userEmail)
      if (userName) formData.append('user_name', userName)

      if (selectedFile) {
        formData.append('file', selectedFile)
      } else {
        formData.append('videoUrl', videoUrl)
      }

      const response = await fetch(`${RAILWAY_URL}/analyze`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(stepInterval)
      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Something went wrong during analysis.')
        setStep('error')
        return
      }

      if (data.reportId) {
        router.push(`/report/${data.reportId}`)
      } else {
        setErrorMessage('Report was generated but could not be saved. Please try again.')
        setStep('error')
      }

    } catch (err) {
      clearInterval(stepInterval)
      setErrorMessage('A network error occurred. Please check your connection and try again.')
      setStep('error')
    }
  }

  const handleReset = () => {
    setStep('upload'); setSelectedFile(null); setVideoUrl('')
    setFileError(''); setUrlError(''); setNiche(''); setAudience(''); setGoal('')
    setContextErrors({}); setErrorMessage(''); setProcessingStep(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (step === 'upload') return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${mode === 'file' ? styles.tabActive : ''}`}
          onClick={() => { setMode('file'); setFileError(''); setUrlError('') }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
              value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setUrlError('') }} />
            {videoUrl && <button className={styles.clearUrl} onClick={() => setVideoUrl('')}>✕</button>}
          </div>
          <p className={styles.urlHint}>Supports YouTube, Vimeo, Instagram, Facebook, and TikTok</p>
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
          <p>These three fields are required. They make your report specific to your business — without them, the analysis would be generic.</p>
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
        <h2>Analysing your video</h2>
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
        <div className={styles.errorIcon}>⚠</div>
        <h2>Analysis could not be completed</h2>
        <p>{errorMessage}</p>
        <button className={styles.continueBtn} onClick={handleReset} style={{ marginTop: '8px' }}>
          Try again
        </button>
      </div>
    </div>
  )

  return null
}
