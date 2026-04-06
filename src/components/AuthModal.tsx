'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import styles from './AuthModal.module.css'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  // Auto-trigger Google on mount (like the screenshot showed)
  // We show the modal with Google prominently — user clicks once
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const signInWithGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const signInWithEmail = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoVid}>Vid</span>
            <span className={styles.logoConverts}> Converts</span>
          </div>
          <h2 className={styles.title}>
            {sent ? 'Check your email' : 'Sign in to get your audit'}
          </h2>
          <p className={styles.subtitle}>
            {sent
              ? `We sent a magic link to ${email}`
              : 'Free to start — no credit card required'}
          </p>
        </div>

        {!sent && (
          <div className={styles.body}>
            {/* Google — primary action */}
            <button
              className={styles.googleBtn}
              onClick={signInWithGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className={styles.spinner} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.2 0-9.6-3.2-11.3-7.7l-6.5 5C9.5 39.5 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37 38.3 44 33 44 24c0-1.3-.1-2.7-.4-3.9z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className={styles.divider}>
              <span>or continue with email</span>
            </div>

            <div className={styles.emailRow}>
              <input
                type="email"
                className={styles.emailInput}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && signInWithEmail()}
                autoFocus={false}
              />
              <button
                className={styles.emailBtn}
                onClick={signInWithEmail}
                disabled={loading || !email}
              >
                {loading ? <span className={styles.spinner} /> : 'Send link'}
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <p className={styles.terms}>
              By continuing, you agree to our{' '}
              <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
        )}

        {sent && (
          <div className={styles.sentState}>
            <div className={styles.sentIcon}>✓</div>
            <p>Click the link in your email to sign in.<br />You can close this window.</p>
            <button className={styles.resend} onClick={() => setSent(false)}>
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
