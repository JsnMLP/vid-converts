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
    cta: 'Get started free',
    ctaHref: '/',
    highlight: false,
    features: [
      'Overall score + 4 rubric scores',
      '2 strengths identified',
      '3 conversion blockers',
      '3 action checklist items',
      '2 transcript highlights',
      '2 frame observations',
      '3 measurement guidance items',
    ],
    locked: [
      'Full rubric breakdown (8 categories)',
      'All strengths & blockers',
      'Full action checklist',
      'Transcript + frame deep-dive',
      'Rewrite My Script',
      'Before/after comparison',
      'Competitor benchmark',
      'Email PDF delivery',
    ],
  },
  {
    name: 'Complete',
    monthlyPrice: 20,
    yearlyPrice: 16,
    description: 'Everything you need to improve',
    cta: 'Start Complete',
    ctaHref: '/?plan=complete',
    highlight: false,
    features: [
      'Full rubric breakdown (all 8 scores)',
      'All strengths & blockers',
      'Full action checklist',
      'All transcript highlights',
      'All frame observations',
      'Full measurement guidance',
      'Email PDF report delivery',
      'Before/after comparison mode',
    ],
    locked: [
      'Rewrite My Script (AI full script)',
      'Competitor benchmark mode',
    ],
  },
  {
    name: 'Premium',
    monthlyPrice: 40,
    yearlyPrice: 32,
    description: 'The full conversion system',
    cta: 'Start Premium',
    ctaHref: '/?plan=premium',
    highlight: true,
    features: [
      'Everything in Complete',
      'Rewrite My Script — full AI rewrite',
      'Hook, offer & CTA rewrites',
      'Competitor benchmark mode',
      'Before/after comparison mode',
      'Priority analysis queue',
      'Email PDF delivery (full report)',
    ],
    locked: [],
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

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

            {/* Toggle */}
            <div className={styles.toggle}>
              <button
                className={`${styles.toggleBtn} ${!annual ? styles.toggleActive : ''}`}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </button>
              <button
                className={`${styles.toggleBtn} ${annual ? styles.toggleActive : ''}`}
                onClick={() => setAnnual(true)}
              >
                Annually
                <span className={styles.saveBadge}>Save 20%</span>
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`${styles.card} ${plan.highlight ? styles.cardHighlight : ''}`}
              >
                {plan.highlight && (
                  <div className={styles.popularBadge}>Most Popular</div>
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

                <Link
                  href={plan.ctaHref}
                  className={`${styles.cta} ${plan.highlight ? styles.ctaPrimary : styles.ctaSecondary}`}
                >
                  {plan.cta}
                </Link>

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

          <p className={styles.guarantee}>
            No contracts. Cancel anytime. Questions? <Link href="/faq" className={styles.faqLink}>See our FAQ →</Link>
          </p>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>Vid Converts</span>
        <span className={styles.by}>by <a href="https://digitalnuclei.com" target="_blank" rel="noopener noreferrer">Digital Nuclei</a></span>
      </footer>
    </>
  )
}
