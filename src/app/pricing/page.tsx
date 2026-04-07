'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import styles from './pricing.module.css'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Try it before you commit',
    cta: 'Start for free',
    ctaHref: '/',
    highlight: false,
    priceId: null,
    plan: null,
    badge: null,
    features: [
      '2 video analyses per month',
      'Overall conversion score',
      '4 of 8 rubric scores',
      '2 strengths identified',
      '3 conversion blockers',
      '3 action checklist items',
      '2 transcript highlights',
      '2 frame observations',
    ],
    locked: [
      'Full rubric breakdown (all 8 scores)',
      'All strengths & blockers',
      'Full action checklist',
      '1 expert resource link per finding',
      '1 "How To" article per finding',
      'Downloadable PDF report',
      'Script rewrite tools',
      'A/B test variants',
    ],
  },
  {
    name: 'Complete',
    monthlyPrice: 25,
    yearlyPrice: 20,
    description: 'Everything you need to improve',
    cta: 'Start Complete',
    highlight: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_COMPLETE_PRICE_ID,
    plan: 'complete',
    badge: null,
    features: [
      '10 video analyses per month',
      'Full rubric breakdown (all 8 scores)',
      'All strengths & blockers',
      'Full action checklist',
      'All transcript highlights & frame observations',
      'Full measurement guidance',
      '1 expert YouTube resource per finding',
      '1 "How To" article link per finding',
      'Downloadable PDF report',
      'Social media video add-on available (discounted)',
    ],
    locked: [
      '2 expert resources per finding',
      'Script rewrite tool (AI full rewrite)',
      'A/B test variants',
      'Before/after comparison mode',
      '1 social media video/month included',
    ],
  },
  {
    name: 'Premium',
    monthlyPrice: 40,
    yearlyPrice: 32,
    description: 'Your complete conversion system',
    cta: 'Start Premium',
    highlight: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    plan: 'premium',
    badge: 'Most Popular',
    features: [
      'Unlimited video analyses',
      'Everything in Complete',
      '2 expert YouTube resources per finding',
      '2 "How To" article links per finding',
      'Script rewrite tool — full AI rewrite',
      'Hook, offer & CTA rewrites',
      'A/B test variants (2 versions)',
      'Before/after comparison mode',
      'Priority analysis queue',
      '1 × 60-second social media video/month included',
      'Up to 3 business day turnaround on video',
    ],
    locked: [],
  },
]

const addOn = {
  name: 'Social Media Video Add-on',
  description: 'We edit your footage into a polished 60-second social media video — ready to post.',
  completePrice: 47,
  standardPrice: 97,
  turnaround: 'Up to 5 business days',
  premiumNote: '1 × 60-second social media video/month included in Premium',
  details: [
    '60-second edited video optimised for your platform',
    'Captions, cuts, and colour grading included',
    'Submit raw footage + your audit report',
    'Receive a download link when ready',
    'Available as many times as you need (pay per video)',
    'Complete members: discounted rate of $47/video',
  ],
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [showAddOn, setShowAddOn] = useState(false)

  const handleUpgrade = async (
    priceId: string | null | undefined,
    plan: string | null | undefined,
    ctaHref?: string
  ) => {
    if (!priceId || !plan) {
      window.location.href = ctaHref || '/'
      return
    }
    setLoading(plan)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'Unauthorized') {
        window.location.href = '/?signin=true'
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Navbar user={null} onSignIn={() => window.location.href = '/'} />

      <main className={styles.main}>
        <div className={styles.gridBg} aria-hidden />

        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Simple, honest pricing</h1>
            <p className={styles.subtitle}>
              Start free. Upgrade when you need more depth.
            </p>

            <div className={styles.toggle}>
              <button
                className={`${styles.toggleBtn} ${!annual ? styles.toggleActive : ''}`}
                onClick={() => setAnnual(false)}>
                Monthly
              </button>
              <button
                className={`${styles.toggleBtn} ${annual ? styles.toggleActive : ''}`}
                onClick={() => setAnnual(true)}>
                Annually
                <span className={styles.saveBadge}>Save 20%</span>
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {plans.map((plan) => (
              <div key={plan.name}
                className={`${styles.card} ${plan.highlight ? styles.cardHighlight : ''}`}>
                {plan.badge && (
                  <div className={styles.popularBadge}>{plan.badge}</div>
                )}

                <div className={styles.cardHeader}>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>
                      ${annual ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className={styles.period}>/ month</span>
                  </div>
                  {annual && plan.monthlyPrice > 0 && (
                    <p className={styles.billedAs}>
                      Billed as ${(annual ? plan.yearlyPrice : plan.monthlyPrice) * 12}/year
                    </p>
                  )}
                  <p className={styles.planDesc}>{plan.description}</p>
                </div>

                <button
                  className={`${styles.cta} ${plan.highlight ? styles.ctaPrimary : styles.ctaSecondary}`}
                  onClick={() => handleUpgrade(plan.priceId, plan.plan, (plan as any).ctaHref)}
                  disabled={loading === plan.plan}>
                  {loading === plan.plan ? (
                    <span className={styles.spinner} />
                  ) : plan.cta}
                </button>

                <div className={styles.features}>
                  {plan.features.map((f) => (
                    <div key={f} className={styles.featureRow}>
                      <span className={styles.checkIcon}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.locked.map((f) => (
                    <div key={f} className={`${styles.featureRow} ${styles.locked}`}>
                      <span className={styles.lockIcon}>—</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Social Media Video Add-on */}
          <div className={styles.addOnSection}>
            <button
              className={styles.addOnToggle}
              onClick={() => setShowAddOn(!showAddOn)}>
              <span>🎬</span>
              <div>
                <strong>{addOn.name}</strong>
                <span>{addOn.description}</span>
              </div>
              <span className={styles.addOnChevron}>{showAddOn ? '▲' : '▼'}</span>
            </button>

            {showAddOn && (
              <div className={styles.addOnContent}>
                <div className={styles.addOnPrices}>
                  <div className={styles.addOnPrice}>
                    <strong>Complete plan members</strong>
                    <span className={styles.addOnPriceAmount}>
                      ${addOn.completePrice}<small>/video</small>
                    </span>
                    <span className={styles.addOnPriceSub}>
                      Discounted rate · {addOn.turnaround}
                    </span>
                  </div>
                  <div className={`${styles.addOnPrice} ${styles.addOnPricePremium}`}>
                    <strong>Premium plan members</strong>
                    <span className={styles.addOnPriceAmount}>Included</span>
                    <span className={styles.addOnPriceSub}>
                      {addOn.premiumNote}
                    </span>
                  </div>
                </div>
                <div className={styles.addOnDetails}>
                  {addOn.details.map((d, i) => (
                    <div key={i} className={styles.addOnDetail}>
                      <span>✓</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
                <p className={styles.addOnNote}>
                  Social media video add-on launches soon.{' '}
                  <Link href="/dashboard" className={styles.faqLink}>Join the waitlist →</Link>
                </p>
              </div>
            )}
          </div>

          <p className={styles.guarantee}>
            Questions?{' '}
            <Link href="/faq" className={styles.faqLink}>See our FAQ →</Link>
            {' · '}
            <Link href="/terms" className={styles.faqLink}>Terms of Service</Link>
            {' · '}
            <Link href="/privacy" className={styles.faqLink}>Privacy Policy</Link>
          </p>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>Vid Converts</span>
        <span className={styles.by}>
          by{' '}
          <a href="https://digitalnuclei.com" target="_blank" rel="noopener noreferrer">
            Digital Nuclei
          </a>
        </span>
      </footer>
    </>
  )
}
