'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'
import AuthModal from '@/components/AuthModal'
import Navbar from '@/components/Navbar'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <Navbar user={user} onSignIn={() => setShowAuth(true)} />

      <main className={styles.main}>
        {/* Background grid */}
        <div className={styles.gridBg} aria-hidden />
        <div className={styles.glowOrb} aria-hidden />

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.badge + ' fade-up'}>
            <span className={styles.badgeDot} />
            Evidence-based video audits
          </div>

          <h1 className={styles.headline + ' fade-up-delay-1'}>
            Your video is losing<br />
            <span className={styles.tealGradient}>conversions.</span><br />
            Here&apos;s exactly why.
          </h1>

          <p className={styles.subheadline + ' fade-up-delay-2'}>
            Upload your marketing video and get a scored audit grounded in your real transcript and frames —
            not templates, not guesswork.
          </p>

          {/* Upload CTA — the hero element */}
          <div className={styles.uploadZone + ' fade-up-delay-3'}>
            <div className={styles.uploadInner}>
              <div className={styles.uploadIcon}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 8v16M13 15l7-7 7 7" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 28v2a2 2 0 002 2h20a2 2 0 002-2v-2" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className={styles.uploadText}>
                <strong>Drop your video here to get started</strong>
                <span>MP4 or MOV up to 500MB · or paste a URL below</span>
              </div>
              <button
                className={styles.uploadBtn}
                onClick={() => setShowAuth(true)}
              >
                {user ? 'Go to Dashboard' : 'Analyse My Video'}
              </button>
            </div>
            <div className={styles.uploadDivider}>
              <span>or</span>
            </div>
            <div className={styles.urlRow}>
              <input
                className={styles.urlInput}
                placeholder="Paste a video URL (YouTube, Vimeo, Instagram…)"
                readOnly
                onClick={() => setShowAuth(true)}
              />
              <button className={styles.urlBtn} onClick={() => setShowAuth(true)}>
                Audit URL
              </button>
            </div>
          </div>

          <p className={styles.disclaimer + ' fade-up-delay-4'}>
            Free audit available — no credit card required
          </p>
        </section>

        {/* Rubric preview */}
        <section className={styles.rubric}>
          <div className="container">
            <p className={styles.rubricLabel}>Every video is scored on 8 conversion factors</p>
            <div className={styles.rubricGrid}>
              {[
                { label: 'Hook', desc: 'Does it stop the scroll?' },
                { label: 'Problem Clarity', desc: 'Is the pain obvious?' },
                { label: 'Offer Clarity', desc: 'Is the solution clear?' },
                { label: 'Trust & Proof', desc: 'Is credibility shown?' },
                { label: 'CTA', desc: 'Is the ask specific?' },
                { label: 'Visual Communication', desc: 'Is the screen readable?' },
                { label: 'Platform Fit', desc: 'Right format for the channel?' },
                { label: 'Measurement Readiness', desc: 'Can you track performance?' },
              ].map((item) => (
                <div key={item.label} className={styles.rubricCard}>
                  <div className={styles.rubricDot} />
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className={styles.trustBar}>
          <div className="container">
            <div className={styles.trustGrid}>
              <div className={styles.trustItem}>
                <strong>Real transcript</strong>
                <span>Every word extracted via Whisper AI</span>
              </div>
              <div className={styles.trustDivider} />
              <div className={styles.trustItem}>
                <strong>Real frame analysis</strong>
                <span>Actual screenshots reviewed, not guesses</span>
              </div>
              <div className={styles.trustDivider} />
              <div className={styles.trustItem}>
                <strong>No fake reports</strong>
                <span>If evidence is missing, we say so plainly</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <span className={styles.footerBrand}>Vid Converts</span>
          <span className={styles.footerBy}>by <a href="https://digitalnuclei.com" target="_blank" rel="noopener noreferrer">Digital Nuclei</a></span>
        </div>
      </footer>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false)
            window.location.href = '/dashboard'
          }}
        />
      )}
    </>
  )
}
