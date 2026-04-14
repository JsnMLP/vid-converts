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
  const [activeTab, setActiveTab] = useState('protagonist')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const tabs = [
    { id: 'protagonist', label: 'Protagonist', count: 2 },
    { id: 'hook', label: 'Hook', count: 4 },
    { id: 'offer', label: 'Offer', count: 3 },
    { id: 'cta', label: 'CTA', count: 2 },
    { id: 'retention', label: 'Retention', count: 3 },
    { id: 'trust', label: 'Trust Signals', count: 2 },
    { id: 'pacing', label: 'Pacing', count: 2 },
    { id: 'clarity', label: 'Clarity', count: 2 },
  ]

  const tabCards: Record<string, Array<{
    slug?: string
    title: string
    excerpt: string
    meta: string
    free: boolean
  }>> = {
    protagonist: [
      {
        slug: 'faceless-video-lie',
        title: 'The Faceless Video Lie: Why Hiding Your Face Is Quietly Killing Your Sales',
        excerpt: "The neuroscience behind why your viewer's brain needs a face — and what happens to your conversion rate without one.",
        meta: '4 min · April 2026',
        free: true,
      },
      {
        title: 'The CSP Playbook: Expert Advice for Camera-Shy People Who Still Want to Convert',
        excerpt: 'Four field-tested strategies from neuroscience and performance psychology for people who hate the camera but need it to work for them.',
        meta: '5 min · April 2026',
        free: false,
      },
    ],
    hook: [
      {
        title: "The 3-Second Decision: What Neuroscience Says About Hooks That Stop the Scroll",
        excerpt: "Your viewer's brain makes a stay-or-leave decision in under 400ms. Here's what it's scanning for and how to give it every time.",
        meta: '5 min · Coming soon',
        free: true,
      },
      {
        title: 'Pattern Interrupts: The Attention Science Behind Hooks That Work at Scale',
        excerpt: 'Why your brain is wired to ignore everything familiar — and the four interrupt types that force attention even in the most distracted feeds.',
        meta: '5 min · Coming soon',
        free: false,
      },
      {
        title: "The Question Hook Formula: How to Open With Something Your Viewer Can't Ignore",
        excerpt: "Questions trigger a neurological compulsion to answer. Here's the structure that creates an open loop your viewer must close.",
        meta: '4 min · Coming soon',
        free: false,
      },
      {
        title: 'Hook Testing Framework: How to Know Which Opening Wins Before You Post',
        excerpt: 'A systematic approach to A/B testing hooks with the exact metrics to watch and the decision threshold that tells you when you have a winner.',
        meta: '6 min · Coming soon',
        free: false,
      },
    ],
    offer: [
      {
        title: 'Why Your Offer Lands Flat on Video — And the One Reframe That Fixes It',
        excerpt: "The problem isn't your offer. It's the sequence your brain presents it in. One structural shift changes everything about how it lands.",
        meta: '5 min · Coming soon',
        free: false,
      },
      {
        title: 'The Specificity Principle: Why Vague Offers Get Ignored and Precise Ones Convert',
        excerpt: "Concrete specifics outperform generic claims in every conversion study ever run. Here's the mechanism and how to apply it to your offer.",
        meta: '4 min · Coming soon',
        free: false,
      },
      {
        title: 'Anchoring and Framing: The Psychology of How Price Perception Works on Video',
        excerpt: 'What you say before you name a price changes how the brain processes that number. This is the anchoring science — used ethically.',
        meta: '6 min · Coming soon',
        free: false,
      },
    ],
    cta: [
      {
        title: 'The CTA Science: Why Most Calls to Action Fail and How to Write One That Converts',
        excerpt: 'The exact structure of a CTA that triggers action — and the common mistakes that make viewers scroll past without clicking.',
        meta: '5 min · Coming soon',
        free: false,
      },
      {
        title: "Urgency Without Manipulation: How to Create Real Scarcity Your Viewer Actually Believes",
        excerpt: "Fake urgency destroys trust. Real urgency converts. Here's the difference — and how to build it authentically into every video.",
        meta: '5 min · Coming soon',
        free: false,
      },
    ],
    retention: [
      {
        title: 'The Retention Loop: How to Keep Viewers Watching Past the First 30 Seconds',
        excerpt: "Most viewers leave in the first half-minute. Here's the neurological mechanism behind retention — and how to engineer it deliberately.",
        meta: '5 min · Coming soon',
        free: false,
      },
      {
        title: 'Pattern and Payoff: The Narrative Structure That Makes Videos Impossible to Leave',
        excerpt: "The brain is wired to complete open loops. Here's how to use that compulsion to hold attention from open to close.",
        meta: '4 min · Coming soon',
        free: false,
      },
      {
        title: "Re-engagement Moments: Where to Place Value Spikes to Recover Dropping Attention",
        excerpt: "Attention is not linear. It peaks, drops, and recovers. Here's how to engineer the recovery moments that save your watch time.",
        meta: '6 min · Coming soon',
        free: false,
      },
    ],
    trust: [
      {
        title: 'Social Proof on Video: The Hierarchy That Makes Testimonials Actually Convert',
        excerpt: "Not all social proof is equal. Here's the credibility hierarchy that makes viewers believe what they're seeing — and act on it.",
        meta: '5 min · Coming soon',
        free: false,
      },
      {
        title: "Authority Signals: The Non-Verbal Cues That Establish Expertise Before You Say a Word",
        excerpt: "Your viewer's brain assigns authority in the first seconds — before your content lands. Here's what it's reading and how to control it.",
        meta: '5 min · Coming soon',
        free: false,
      },
    ],
    pacing: [
      {
        title: 'The Rhythm of Persuasion: How Pacing Controls Emotional Response on Video',
        excerpt: "Pacing is not editing speed. It's emotional sequencing. Here's how to control the rhythm that moves viewers toward a decision.",
        meta: '5 min · Coming soon',
        free: false,
      },
      {
        title: 'Dead Air and Dead Weight: Editing for Energy Without Losing Authenticity',
        excerpt: 'The cuts that drain energy versus the cuts that build it. A practical guide to pacing that converts without feeling manufactured.',
        meta: '4 min · Coming soon',
        free: false,
      },
    ],
    clarity: [
      {
        title: "Message Clarity: Why Viewers Tune Out When They Can't Immediately Understand What You Do",
        excerpt: "Confusion is the conversion killer. Here's the clarity framework that makes your message land in the first five seconds.",
        meta: '4 min · Coming soon',
        free: false,
      },
      {
        title: 'One Job: The Constraint That Forces Clarity and Doubles Conversion Rate',
        excerpt: "Every video that tries to do two things fails at both. Here's how the one-job constraint transforms unfocused content into conversion machines.",
        meta: '4 min · Coming soon',
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
                  Video over 500MB? Compress it free →
                </a>
              </div>
              <button className={styles.uploadBtn} onClick={() => user ? window.location.href = '/dashboard' : setShowAuth(true)}>
                Analyze My Video
              </button>
            </div>
            <div className={styles.uploadDivider}><span>or</span></div>
            <div className={styles.urlRow}>
              <input className={styles.urlInput} placeholder="Paste a video URL (YouTube, Vimeo, Instagram…)" readOnly onClick={() => user ? window.location.href = '/dashboard' : setShowAuth(true)} />
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

        {/* ── BLOG SECTION ── */}
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
                <a href="/library" className={styles.blogAllLink}>Browse the full library →</a>
              </div>
            </div>

            {/* Featured card */}
            <a href="/blog/faceless-video-lie" className={styles.blogFeatured}>
              <div className={styles.blogFeaturedVisual}>
                <div className={styles.blogFeatTag}>
                  <div className={styles.nodeSm} />
                  Free to Read
                </div>
                <div className={styles.blogFeatEyebrow}>Psychology &amp; Neuroscience · Protagonist</div>
                <div className={styles.blogFeatTitle}>
                  The Faceless Video Lie:<br />
                  <em>Why Hiding Your Face Is<br />Quietly Killing Your Sales</em>
                </div>
                <div className={styles.blogFeatBigText}>01</div>
              </div>
              <div className={styles.blogFeatBody}>
                <p className={styles.blogFeatExcerpt}>
                  You&apos;ve been told great content is enough. The neuroscience says otherwise — and your conversion rate is paying the price. This is what your viewer&apos;s brain decides before you say a single word.
                </p>
                <div className={styles.blogFeatFooter}>
                  <span className={styles.blogFeatMeta}>4 min read · April 2026</span>
                  <span className={styles.blogFeatBtn}>Read now →</span>
                </div>
              </div>
            </a>

            {/* Category tabs */}
            <div className={styles.blogTabsNav}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.blogTabBtn} ${activeTab === tab.id ? styles.blogTabBtnActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  <span className={`${styles.blogTabCount} ${activeTab === tab.id ? styles.blogTabCountActive : ''}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab cards */}
            <div className={styles.blogTabCards}>
              {(tabCards[activeTab] || []).map((card, i) => (
                card.free && card.slug ? (
                  <a key={i} href={`/blog/${card.slug}`} className={styles.blogCard}>
                    <div className={styles.blogCardTop}>
                      <span className={styles.blogCardFree}>Free</span>
                    </div>
                    <div className={styles.blogCardTitle}>{card.title}</div>
                    <p className={styles.blogCardExcerpt}>{card.excerpt}</p>
                    <div className={styles.blogCardFooter}>
                      <span className={styles.blogCardMeta}>{card.meta}</span>
                      <span className={styles.blogCardArrow}>→</span>
                    </div>
                  </a>
                ) : (
                  <div key={i} className={`${styles.blogCard} ${styles.blogCardLocked}`}>
                    <div className={styles.blogCardTop}>
                      <span className={styles.blogCardExclusive}>Complete + Premium</span>
                      <span className={styles.blogCardLock}>🔒</span>
                    </div>
                    <div className={styles.blogCardTitle}>{card.title}</div>
                    <p className={`${styles.blogCardExcerpt} ${styles.blogCardExcerptBlur}`}>{card.excerpt}</p>
                    <div className={styles.blogCardFooter}>
                      <span className={styles.blogCardMeta}>{card.meta}</span>
                      <span className={styles.blogCardArrow}>→</span>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Upgrade nudge */}
            <div className={styles.blogNudge}>
              <span className={styles.blogNudgeText}>Upgrade to Unlock Access to Full Library</span>
              <a href="/pricing" className={styles.blogNudgeBtn}>See Plans →</a>
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
            <span>© 2026 Digital Nuclei. All rights reserved.</span>
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
