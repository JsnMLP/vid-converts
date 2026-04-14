'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'
import AuthModal from '@/components/AuthModal'
import Navbar from '@/components/Navbar'
import BrandLogo from '@/components/BrandLogo'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('hook')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const tabs = [
    { id: 'hook', label: 'Hook', count: 1 },
    { id: 'problem_clarity', label: 'Problem Clarity', count: 1 },
    { id: 'offer_clarity', label: 'Offer Clarity', count: 1 },
    { id: 'trust_proof', label: 'Trust & Proof', count: 2 },
    { id: 'cta', label: 'CTA', count: 1 },
    { id: 'visual_communication', label: 'Visual Communication', count: 2 },
    { id: 'platform_fit', label: 'Platform Fit', count: 1 },
    { id: 'measurement_readiness', label: 'Measurement Readiness', count: 1 },
  ]

  type TabCard = {
    slug?: string
    title: string
    excerpt: string
    meta: string
    free: boolean
  }

  const tabCards: Record<string, TabCard[]> = {
    hook: [
      {
        title: "The 3-Second Decision: What Neuroscience Says About Hooks That Stop the Scroll",
        excerpt: "Your viewer's brain makes a stay-or-leave decision in under 400ms. Here's what it's scanning for.",
        meta: "Coming soon",
        free: false,
      },
    ],
    problem_clarity: [
      {
        title: "The Pain Precision Framework: How to Name Your Viewer's Problem So Clearly They Feel Seen",
        excerpt: "Vague pain statements get ignored. Specific ones stop the scroll. Here's how to articulate your viewer's problem better than they can.",
        meta: "Coming soon",
        free: false,
      },
    ],
    offer_clarity: [
      {
        title: "Why Your Offer Lands Flat on Video — And the One Reframe That Fixes It",
        excerpt: "The problem is not your offer. It is the sequence your brain presents it in. One structural shift changes everything.",
        meta: "Coming soon",
        free: false,
      },
    ],
    trust_proof: [
      {
        slug: "faceless-video-lie",
        title: "The Faceless Video Lie: Why Hiding Your Face Is Quietly Killing Your Sales",
        excerpt: "The neuroscience behind why your viewer's brain needs a face — and what happens to your conversion rate without one.",
        meta: "4 min · April 2026",
        free: true,
      },
      {
        title: "Social Proof on Video: The Hierarchy That Makes Testimonials Actually Convert",
        excerpt: "Not all social proof is equal. Here's the credibility hierarchy that makes viewers believe what they're seeing.",
        meta: "Coming soon",
        free: false,
      },
    ],
    cta: [
      {
        title: "The CTA Science: Why Most Calls to Action Fail and How to Write One That Converts",
        excerpt: "The exact structure of a CTA that triggers action — and the common mistakes that make viewers scroll past.",
        meta: "Coming soon",
        free: false,
      },
    ],
    visual_communication: [
      {
        slug: "csp-playbook",
        title: "The CSP Playbook: Expert Advice for Camera-Shy People Who Still Want to Convert",
        excerpt: "Four field-tested strategies from neuroscience and performance psychology for people who hate the camera.",
        meta: "5 min · April 2026",
        free: false,
      },
      {
        title: "Frame, Light, Distance: The Camera Setup That Makes You Look Confident Before You Feel It",
        excerpt: "Your environment is working for you or against you. Here is the exact setup that removes anxiety signals.",
        meta: "Coming soon",
        free: false,
      },
    ],
    platform_fit: [
      {
        title: "Wrong Platform, Wrong Format: Why Great Videos Fail Before Anyone Watches Them",
        excerpt: "The best video in the world underperforms on the wrong platform. Here's how to match format to where your audience lives.",
        meta: "Coming soon",
        free: false,
      },
    ],
    measurement_readiness: [
      {
        title: "Are You Measuring the Right Things? The Video Metrics That Actually Predict Revenue",
        excerpt: "Views and likes don't pay the bills. Here's the measurement framework that connects video performance to business outcomes.",
        meta: "Coming soon",
        free: false,
      },
    ],
  }

  return (
    <>
      <Navbar user={user} onSignIn={() => setShowAuth(true)} />

      <main className={styles.main}>
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
          <div className={styles.uploadZone + ' fade-up-delay-3'} onClick={() => { if (user) window.location.href = '/dashboard' }}>
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
                <a href="https://www.freeconvert.com/video-compressor" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize:'12px', color:'var(--teal)', textDecoration:'none', marginTop:'4px', display:'inline-block', opacity:0.85 }}>
                  Video over 500MB? Compress it free &rarr;
                </a>
              </div>
              <button className={styles.uploadBtn} onClick={() => user ? window.location.href = '/dashboard' : setShowAuth(true)}>
                Analyze My Video
              </button>
            </div>
            <div className={styles.uploadDivider}><span>or</span></div>
            <div className={styles.urlRow}>
              <input className={styles.urlInput} placeholder="Paste a video URL (YouTube, Vimeo, Instagram...)" readOnly onClick={() => user ? window.location.href = '/dashboard' : setShowAuth(true)} />
              <button className={styles.urlBtn} onClick={() => user ? window.location.href = '/dashboard' : setShowAuth(true)}>Audit URL</button>
            </div>
          </div>
          <p className={styles.disclaimer + ' fade-up-delay-4'}>Free audit available — no credit card required</p>
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
                <span>Every spoken word extracted and analysed</span>
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

        {/* BLOG SECTION */}
        <section className={styles.blogSection}>
          <div className={styles.blogInner}>

            {/* Header */}
            <div className={styles.blogHeader}>
              <div className={styles.blogHeaderLeft}>
                <div className={styles.blogKicker}>
                  <div className={styles.vcLogo}>
                    <div className={styles.vcLogoInner} />
                    <div className={styles.vcLogoPlay} />
                  </div>
                  The Conversion Blog
                </div>
                <h2 className={styles.blogTitle}>
                  From the <span className={styles.blogTitleTeal}>Lab.</span>
                </h2>
              </div>
              <div className={styles.blogHeaderRight}>
                <p className={styles.blogDesc}>
                  The psychology, neuroscience, and strategy behind video that actually converts.
                </p>
                <a href="/library" className={styles.blogAllLink}>Browse the full library &rarr;</a>
              </div>
            </div>

            {/* Foundation Zone */}
            <div className={styles.foundationZone}>
              <div className={styles.foundationLabel}>
                Foundation &middot; Free to Read <span className={styles.foundationCount}>1</span>
              </div>
              <a href="/blog/no-video-no-market-share" className={styles.blogFeatured}>
                <div className={styles.blogFeaturedVisual}>
                  <div className={styles.blogFeatTag}>
                    <div className={styles.nodeSm} />
                    Free to Read
                  </div>
                  <div className={styles.blogFeatEyebrow}>Business Strategy &middot; Foundation</div>
                  <div className={styles.blogFeatTitle}>
                    No Video, No Market Share:<br />
                    <em>The Revenue Cost of Sitting This One Out</em>
                  </div>
                  <div className={styles.blogFeatBigText}>02</div>
                </div>
                <div className={styles.blogFeatBody}>
                  <p className={styles.blogFeatExcerpt}>
                    This is not a trend piece. This is about the measurable, documented, revenue-level cost of not using video — and what businesses already using it are doing to your market share right now.
                  </p>
                  <div className={styles.blogFeatFooter}>
                    <span className={styles.blogFeatMeta}>5 min read &middot; April 2026</span>
                    <span className={styles.blogFeatBtn}>Read now &rarr;</span>
                  </div>
                </div>
              </a>
            </div>

            {/* Category tabs */}
            <div className={styles.blogTabsNavWrap}>
            <div className={styles.blogTabsNav}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={styles.blogTabBtn + (activeTab === tab.id ? ' ' + styles.blogTabBtnActive : '')}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  <span className={styles.blogTabCount + (activeTab === tab.id ? ' ' + styles.blogTabCountActive : '')}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            </div>

            {/* Tab cards */}
            <div className={styles.blogTabCards}>
              {(tabCards[activeTab] || []).map((card, i) => (
                card.free && card.slug ? (
                  <a key={i} href={'/blog/' + card.slug} className={styles.blogCard}>
                    <div className={styles.blogCardTop}>
                      <span className={styles.blogCardFree}>Free</span>
                    </div>
                    <div className={styles.blogCardTitle}>{card.title}</div>
                    <p className={styles.blogCardExcerpt}>{card.excerpt}</p>
                    <div className={styles.blogCardFooter}>
                      <span className={styles.blogCardMeta}>{card.meta}</span>
                      <span className={styles.blogCardArrow}>&rarr;</span>
                    </div>
                  </a>
                ) : (
                  <div key={i} className={styles.blogCard + ' ' + styles.blogCardLocked}>
                    <div className={styles.blogCardTop}>
                      <span className={styles.blogCardExclusive}>Complete + Premium</span>
                      <span className={styles.blogCardLock}>🔒</span>
                    </div>
                    <div className={styles.blogCardTitle}>{card.title}</div>
                    <p className={styles.blogCardExcerpt + ' ' + styles.blogCardExcerptBlur}>{card.excerpt}</p>
                    <div className={styles.blogCardFooter}>
                      <span className={styles.blogCardMeta}>{card.meta}</span>
                      <span className={styles.blogCardArrow}>&rarr;</span>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Upgrade nudge */}
            <div className={styles.blogNudge}>
              <span className={styles.blogNudgeText}>Upgrade to Unlock Access to Full Library</span>
              <a href="/pricing" className={styles.blogNudgeBtn}>See Plans &rarr;</a>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <BrandLogo className={styles.footerLogo} />
              <span className={styles.footerTagline}>Your videos should be your #1 client acquisition asset.<br />Vid Converts makes sure they are.</span>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <span className={styles.footerColTitle}>Product</span>
                <a href="/" className={styles.footerLink}>Home</a>
                <a href="/pricing" className={styles.footerLink}>Pricing</a>
                <a href="/faq" className={styles.footerLink}>FAQ</a>
                <a href="/dashboard" className={styles.footerLink}>Dashboard</a>
              </div>
              <div className={styles.footerCol}>
                <span className={styles.footerColTitle}>Legal</span>
                <a href="/privacy" className={styles.footerLink}>Privacy Policy</a>
                <a href="/terms" className={styles.footerLink}>Terms of Service</a>
              </div>
              <div className={styles.footerCol}>
                <span className={styles.footerColTitle}>Company</span>
                <a href="https://digitalnuclei.com" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Digital Nuclei</a>
                <a href="mailto:support@vidconverts.com" className={styles.footerLink}>support@vidconverts.com</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>&copy; 2026 Digital Nuclei. All rights reserved.</span>
            <span><BrandLogo /> is a product of <a href="https://digitalnuclei.com" target="_blank" rel="noopener noreferrer" className={styles.footerTealLink}>Digital Nuclei</a></span>
          </div>
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
