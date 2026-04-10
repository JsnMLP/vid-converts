'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import styles from './pricing.module.css'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

const plans = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Start free. Upgrade when clients start to matter.',
    cta: 'Start Free',
    ctaHref: '/',
    highlight: false,
    monthlyPriceId: null,
    annualPriceId: null,
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
    monthlyPrice: 35,
    yearlyPrice: 28,
    description: 'Turn more viewers into paying clients.',
    cta: 'Start Complete',
    highlight: false,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_COMPLETE_PRICE_ID,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_COMPLETE_ANNUAL_PRICE_ID,
    plan: 'complete',
    badge: null,
    features: [
      '8 video analyses per month',
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
    monthlyPrice: 65,
    yearlyPrice: 52,
    description: 'Your secret leverage for a Premium client acquisition system.',
    cta: 'Start Premium',
    highlight: true,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID,
    plan: 'premium',
    badge: 'Most Popular',
    features: [
      'UNLIMITED video analyses',
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

function PlanNameStyled({ name }: { name: string }) {
  if (name === 'Complete') return <span style={{ color: '#7C5CFC' }}>{name}</span>
  if (name === 'Premium') return <span style={{ color: '#F5A623' }}>{name}</span>
  return <>{name}</>
}

function FeatureText({ text }: { text: string }) {
  if (text === 'UNLIMITED video analyses') {
    return (
      <span>
        <span style={{
          textDecoration: 'underline',
          textDecorationColor: '#F5A623',
          textDecorationThickness: '2px',
          textUnderlineOffset: '3px',
          fontWeight: 700,
        }}>Unlimited</span>
        {' video analyses'}
      </span>
    )
  }
  return <span>{text}</span>
}

function DailyCost({ monthlyPrice, yearlyPrice, annual }: { monthlyPrice: number; yearlyPrice: number; annual: boolean }) {
  if (monthlyPrice === 0) return null
  const price = annual ? yearlyPrice : monthlyPrice
  const daily = (price / 30).toFixed(2)
  return (
    <p style={{ fontSize: '12px', color: '#2DD4BF', marginTop: '4px', fontWeight: 600 }}>
      Just ${daily}/day{annual ? ' (billed annually)' : ''}
    </p>
  )
}

function PlanCard({
  plan,
  annual,
  loading,
  onUpgrade,
}: {
  plan: typeof plans[0]
  annual: boolean
  loading: string | null
  onUpgrade: (p: string | null | undefined, m: string | null | undefined, a: string | null | undefined, href?: string) => void
}) {
  const score = annual ? plan.yearlyPrice : plan.monthlyPrice
  return (
    <div
      className={`${styles.card} ${plan.highlight ? styles.cardHighlight : ''}`}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {plan.badge && <div className={styles.popularBadge}>{plan.badge}</div>}

      <div className={styles.cardHeader}>
        <h2 className={styles.planName}><PlanNameStyled name={plan.name} /></h2>
        <div className={styles.priceRow}>
          <span className={styles.price}>${score}</span>
          <span className={styles.period}>USD / month</span>
          {annual && plan.monthlyPrice > 0 && (
            <span style={{ color: '#2DD4BF', fontSize: '0.85rem', fontWeight: 600, marginLeft: '8px', alignSelf: 'center' }}>
              Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/yr
            </span>
          )}
        </div>
        <DailyCost monthlyPrice={plan.monthlyPrice} yearlyPrice={plan.yearlyPrice} annual={annual} />
        {annual && plan.monthlyPrice > 0 && (
          <p className={styles.billedAs}>Billed as ${plan.yearlyPrice * 12} USD/year</p>
        )}
        <p className={styles.planDesc}>{plan.description}</p>
      </div>

      <button
        className={`${styles.cta} ${plan.highlight ? styles.ctaPrimary : styles.ctaSecondary}`}
        onClick={() => onUpgrade(plan.plan, plan.monthlyPriceId, plan.annualPriceId, (plan as any).ctaHref)}
        disabled={plan.plan !== null && loading === plan.plan}
      >
        {plan.plan !== null && loading === plan.plan
          ? <span className={styles.spinner} />
          : plan.cta}
      </button>

      <div className={styles.features} style={{ flex: 1 }}>
        {plan.features.map((f) => (
          <div key={f} className={styles.featureRow}>
            <span className={styles.checkIcon}>✓</span>
            <FeatureText text={f} />
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
  )
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [showAddOn, setShowAddOn] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const handleUpgrade = async (
    plan: string | null | undefined,
    monthlyPriceId: string | null | undefined,
    annualPriceId: string | null | undefined,
    ctaHref?: string
  ) => {
    if (!plan || !monthlyPriceId) {
      window.location.href = ctaHref || '/'
      return
    }
    const priceId = annual && annualPriceId ? annualPriceId : monthlyPriceId
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

          {/* ── Hero ── */}
          <div className={styles.header}>
            <h1 className={styles.title}>
              One improved video.<br />
              One more paying customer.<br />
              Full year&apos;s subscription paid for. 💥
            </h1>
            <p className={styles.subtitle}>
              <span style={{ color: '#F5A623', fontWeight: 800 }}>
                An exquisite tool. First of its kind.{' '}
              </span>
              <span style={{ color: '#2DD4BF', fontWeight: 800 }}>92¢ per day</span>
              <span style={{ color: '#2DD4BF', fontWeight: 800 }}>.</span>
              <sup style={{ fontSize: '0.55em', color: '#64748b', verticalAlign: 'super', lineHeight: 0 }}>*</sup>
            </p>
            <p className={styles.startFree}>Start Free.</p>
          </div>

          {/* ── DESKTOP toggle (inside header area, not sticky) ── */}
          <div className={styles.desktopToggleWrap}>
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

          {/* ── MOBILE: sticky control bar (toggle + plan tabs combined) ── */}
          <div className={styles.stickyControls}>
            {/* Monthly / Annual row */}
            <div className={styles.toggle} style={{ width: '100%' }}>
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
            {/* Plan tabs row */}
            <div className={styles.mobileTabs}>
              {plans.map((plan, i) => (
                <button
                  key={plan.name}
                  className={`${styles.mobileTab} ${activeTab === i ? styles.mobileTabActive : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  <PlanNameStyled name={plan.name} />
                </button>
              ))}
            </div>
          </div>

          {/* ── DESKTOP: 3-col grid ── */}
          <div className={styles.grid} style={{ alignItems: 'stretch' }}>
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} annual={annual} loading={loading} onUpgrade={handleUpgrade} />
            ))}
          </div>

          {/* ── MOBILE: single active plan card ── */}
          <div className={styles.mobilePlans}>
            <PlanCard
              plan={plans[activeTab]}
              annual={annual}
              loading={loading}
              onUpgrade={handleUpgrade}
            />
          </div>

          {/* ── Social Media Video Add-on ── */}
          <div className={styles.addOnSection}>
            <button className={styles.addOnToggle} onClick={() => setShowAddOn(!showAddOn)}>
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
                    <span className={styles.addOnPriceAmount}>${addOn.completePrice}<small>/video</small></span>
                    <span className={styles.addOnPriceSub}>Discounted rate · {addOn.turnaround}</span>
                  </div>
                  <div className={`${styles.addOnPrice} ${styles.addOnPricePremium}`}>
                    <strong>Premium plan members</strong>
                    <span className={styles.addOnPriceAmount}>Included</span>
                    <span className={styles.addOnPriceSub}>{addOn.premiumNote}</span>
                  </div>
                </div>
                <div className={styles.addOnDetails}>
                  {addOn.details.map((d, i) => (
                    <div key={i} className={styles.addOnDetail}>
                      <span>✓</span><span>{d}</span>
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

          {/* ── Footer links ── */}
          <p className={styles.guarantee}>
            Questions?{' '}
            <Link href="/faq" className={styles.faqLink}>See our FAQ →</Link>
            {' · '}
            <Link href="/terms" className={styles.faqLink}>Terms of Service</Link>
            {' · '}
            <Link href="/privacy" className={styles.faqLink}>Privacy Policy</Link>
            {' · '}
            <Link href="/refund" className={styles.faqLink}>Refund Policy</Link>
          </p>

          <p className={styles.footnote}>
            * Based on the Complete Annual plan — $336/yr ÷ 365 days
          </p>
        </div>
      </main>

      <footer className={styles.footer}>
        <BrandLogo />
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
