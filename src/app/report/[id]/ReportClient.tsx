'use client'
import BrandLogo from '@/components/BrandLogo'

import styles from './report.module.css'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { RUBRIC_TOOLTIPS, RUBRIC_RESOURCES } from '@/utils/analyze'
import { createClient } from '@/utils/supabase/client'

interface RubricScore {
  category: string
  score: number
  evidence: string
  finding: string
  recommendation: string
  celebration?: string
  pleasureAngle?: string
}

interface ReportData {
  overallScore: number
  openingCelebration?: string
  evidenceSummary: string
  rubricScores: RubricScore[]
  strengths: string[]
  blockers: string[]
  actionChecklist: string[]
  measurementGuidance: string[]
  transcriptHighlights: string[]
  frameObservations: string[]
  missingEvidence: string[]
}

interface Report {
  id: string
  video_name: string
  niche: string
  audience: string
  goal: string
  tier: string
  report_data: ReportData
  created_at: string
}

interface Props {
  report: Report
}

const FREE_RUBRIC_LIMIT = 4
const FREE_STRENGTHS_LIMIT = 2
const FREE_BLOCKERS_LIMIT = 3
const FREE_CHECKLIST_LIMIT = 3
const FREE_MEASUREMENT_LIMIT = 3
const FREE_TRANSCRIPT_LIMIT = 2
const FREE_FRAMES_LIMIT = 2

const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  complete: 8,
  premium: Infinity,
}

const EVIDENCE_LABEL_MAP: Record<string, string> = {
  INSUFFICIENT_EVIDENCE: "We didn't have enough footage to evaluate this area",
  NO_TRANSCRIPT: "No transcript was available for this section",
  NO_FRAMES: "No frames were captured for this section",
}

function formatFrameObservation(raw: string): string {
  if (EVIDENCE_LABEL_MAP[raw]) return EVIDENCE_LABEL_MAP[raw]
  if (/^[A-Z_]+$/.test(raw)) {
    return raw
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ')
  }
  return raw
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const pct = score / 10
  const color = score >= 7 ? 'var(--teal)' : score >= 4 ? '#f59e0b' : '#f87171'
  const r = (size / 2) - 6
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.22} fontFamily="var(--font-display)" fontWeight="800">
        {score}
      </text>
      <text x={size/2} y={size/2 + size * 0.18} textAnchor="middle" dominantBaseline="middle"
        fill="var(--text-muted)" fontSize={size * 0.13} fontFamily="var(--font-body)">
        /10
      </text>
    </svg>
  )
}

function OverallScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--teal)' : score >= 45 ? '#f59e0b' : '#f87171'
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 65 65)" />
      <text x="65" y="60" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="28" fontFamily="var(--font-display)" fontWeight="800">
        {score}
      </text>
      <text x="65" y="78" textAnchor="middle" dominantBaseline="middle"
        fill="var(--text-muted)" fontSize="13" fontFamily="var(--font-body)">
        / 100
      </text>
    </svg>
  )
}

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className={styles.tooltipWrap}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="More information">
      <span className={styles.tooltipIcon}>?</span>
      {visible && (
        <span className={styles.tooltipBox} role="tooltip">{text}</span>
      )}
    </span>
  )
}

function TierBadge({ tier }: { tier: string }) {
  if (tier === 'premium') {
    return (
      <span className={styles.premiumBadge} style={{
        background: 'rgba(245, 166, 35, 0.15)',
        color: '#F5A623',
        border: '1px solid rgba(245, 166, 35, 0.4)',
      }}>
        ⭐ Premium
      </span>
    )
  }
  if (tier === 'complete') {
    return (
      <span className={styles.completeBadge} style={{
        background: 'rgba(124, 92, 252, 0.15)',
        color: '#7C5CFC',
        border: '1px solid rgba(124, 92, 252, 0.4)',
      }}>
        ✦ Complete
      </span>
    )
  }
  return <span className={styles.freeBadge}>Free report</span>
}

function UpgradeBanner() {
  return (
    <div className={styles.upgradeBanner}>
      <div className={styles.upgradeInner}>
        <div className={styles.upgradeLock}>🔒</div>
        <div className={styles.upgradeText}>
          <strong>Unlock the full report</strong>
          <span>See all 8 scores, every strength and blocker, the complete action checklist, curated expert resources, and a downloadable PDF.</span>
        </div>
        <Link href="/pricing" className={styles.upgradeBtn}>Upgrade — from $35 USD/mo</Link>
      </div>
    </div>
  )
}

function ResourceLinks({ category, tier }: { category: string; tier: string }) {
  const resources = RUBRIC_RESOURCES[category]
  if (!resources) return null
  const isPremium = tier === 'premium'
  const youtubeLinks = isPremium ? resources.youtube : resources.youtube.slice(0, 1)
  const blogLinks = isPremium ? resources.blog : resources.blog.slice(0, 1)

  return (
    <div className={styles.resourceLinks}>
      <span className={styles.resourceLabel}>
        🧠 LEARN LIKE A PRO — CLICK BELOW
      </span>
      <div className={styles.resourceList}>
        {youtubeLinks.map((link, i) => (
          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
            <span className={styles.resourceYtIcon}>▶</span>
            <span>{link.title}</span>
            <span className={styles.resourceAuthor}>— {link.author}</span>
          </a>
        ))}
        {blogLinks.map((link, i) => (
          <a key={i} href={`/blog/${link.slug}`} className={`${styles.resourceLink} ${styles.resourceLinkBlog}`}>
            <span className={styles.resourceBlogIcon}>📄</span>
            <span>{link.title}</span>
            <span className={styles.resourceComingSoon}>Coming soon</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function ReportClient({ report }: Props) {
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    const fetchUsage = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('analyses_count, plan, status')
        .single()
      if (data) {
        setUsageCount(data.analyses_count ?? 0)
        setUserPlan(data.status === 'active' && data.plan !== 'free' ? data.plan : 'free')
      }
    }
    fetchUsage()
  }, [])

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const reportEl = document.getElementById('report-content')
      if (!reportEl) {
        alert('Could not find report content. Please try again.')
        setPdfLoading(false)
        return
      }
      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0F1E',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPos = 0
      while (yPos < pdfHeight) {
        if (yPos > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -yPos, pdfWidth, pdfHeight)
        yPos += pageHeight
      }
      pdf.save(`VidConverts-Report-${report.id.slice(0, 8)}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('PDF download failed. Try right-clicking the page and selecting Print → Save as PDF, then open with Adobe Acrobat.')
    }
    setPdfLoading(false)
  }

  const limit = PLAN_LIMITS[userPlan] ?? 2
  const isAtLimit = limit !== Infinity && usageCount !== null && usageCount >= limit

  const data = {
    ...report.report_data,
    missingEvidence: Array.isArray(report.report_data.missingEvidence)
      ? report.report_data.missingEvidence
      : report.report_data.missingEvidence
      ? [report.report_data.missingEvidence]
      : []
  }
  const isPaid = report.tier === 'complete' || report.tier === 'premium'
  const date = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  const rubricToShow = isPaid ? data.rubricScores : data.rubricScores?.slice(0, FREE_RUBRIC_LIMIT) || []
  const hiddenRubric = isPaid ? [] : data.rubricScores?.slice(FREE_RUBRIC_LIMIT) || []
  const strengths = isPaid ? data.strengths : data.strengths?.slice(0, FREE_STRENGTHS_LIMIT) || []
  const blockers = isPaid ? data.blockers : data.blockers?.slice(0, FREE_BLOCKERS_LIMIT) || []
  const checklist = isPaid ? data.actionChecklist : data.actionChecklist?.slice(0, FREE_CHECKLIST_LIMIT) || []
  const measurement = isPaid ? data.measurementGuidance : data.measurementGuidance?.slice(0, FREE_MEASUREMENT_LIMIT) || []
  const transcriptHighlights = isPaid ? data.transcriptHighlights : data.transcriptHighlights?.slice(0, FREE_TRANSCRIPT_LIMIT) || []

  const scoreColor = (s: number) => s >= 7 ? '#2dd4bf' : s >= 4 ? '#f59e0b' : '#f87171'
  const scoreLabel = (s: number) => s >= 7 ? 'Strong' : s >= 4 ? 'Needs work' : 'Weak'

  return (
    <div className={styles.page}>
      {/* Floating CTA */}
      {isAtLimit ? (
        <Link href={`/pricing?limit=reached&plan=${userPlan}`} className={styles.floatingCta} style={{
          background: 'rgba(245,166,35,0.15)',
          border: '1px solid rgba(245,166,35,0.4)',
          color: '#F5A623',
        }}>
          <span className={styles.floatingCtaIcon}>🔒</span>
          Monthly limit reached — Upgrade Now
        </Link>
      ) : (
        <Link href="/dashboard" className={styles.floatingCta}>
          <span className={styles.floatingCtaIcon}>＋</span>
          Analyze Another Video
        </Link>
      )}

      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.logo}>
          <BrandLogo />
        </Link>
        <div className={styles.navRight}>
          <Link href="/dashboard" className={styles.backLink}>← Dashboard</Link>
          {!isPaid && (
            <Link href="/pricing" className={styles.upgradeNavBtn}>Upgrade for full report</Link>
          )}
        </div>
      </nav>

      <main className={styles.main} id="report-content">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.metaTag}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px', flexShrink: 0 }}>
                <path d="M1 3.5h5l1.5 2H13v6.5H1V3.5z" stroke="#FFE9A2" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              {report.video_name}
            </span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.metaTag}>{date}</span>
            <TierBadge tier={report.tier} />
          </div>
          <h1 className={styles.title}>Conversion Audit Report</h1>
          <div className={styles.context}>
            <span><strong>Niche:</strong> {report.niche}</span>
            <span><strong>Audience:</strong> {report.audience}</span>
            <span><strong>Goal:</strong> {report.goal}</span>
          </div>
        </div>

        {/* Opening celebration */}
        {data.openingCelebration && (
          <div className={styles.celebrationCard}>
            <span className={styles.celebrationIcon}>🎯</span>
            <p>{data.openingCelebration}</p>
          </div>
        )}

        {/* Overall score */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreLeft}>
            <OverallScoreRing score={data.overallScore || 0} />
            <div className={styles.scoreInfo}>
              <h2>Overall conversion score</h2>
              <p>{data.evidenceSummary}</p>
            </div>
          </div>
        </div>

        {/* Rubric scores */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Rubric scores
            {!isPaid && (
              <span className={styles.sectionNote}>
                Showing {rubricToShow.length} of {(data.rubricScores || []).length}
              </span>
            )}
          </h2>
          <div className={styles.rubricGrid}>
            {rubricToShow.map((item, i) => (
              <div key={i} className={styles.rubricCard}>
                <div className={styles.rubricTop}>
                  <ScoreRing score={item.score} size={72} />
                  <div className={styles.rubricMeta}>
                    <h3>
                      {item.category}
                      {RUBRIC_TOOLTIPS[item.category] && (
                        <Tooltip text={RUBRIC_TOOLTIPS[item.category]} />
                      )}
                    </h3>
                    <span className={styles.scoreLabel} style={{ color: scoreColor(item.score) }}>
                      {scoreLabel(item.score)}
                    </span>
                  </div>
                </div>

                {item.celebration && (
                  <div className={styles.celebrationMini}>
                    <span>✦</span>
                    <p>{item.celebration}</p>
                  </div>
                )}

                <div className={styles.rubricBody}>
                  {item.evidence && item.evidence !== 'INSUFFICIENT_EVIDENCE' && (
                    <div className={styles.evidence}>
                      <span className={styles.evidenceLabel}>Evidence</span>
                      <p>"{item.evidence}"</p>
                    </div>
                  )}
                  <div className={styles.finding}>
                    <span className={styles.findingLabel}>Finding</span>
                    <p>{item.finding}</p>
                  </div>
                  <div className={styles.recommendation}>
                    <span className={styles.recLabel}>→ Recommendation</span>
                    <p>{item.recommendation}</p>
                  </div>
                  {item.pleasureAngle && (
                    <div className={styles.pleasureAngle}>
                      <span className={styles.pleasureLabel}>✨ The opportunity</span>
                      <p>{item.pleasureAngle}</p>
                    </div>
                  )}
                </div>

                {isPaid && (
                  <ResourceLinks category={item.category} tier={report.tier} />
                )}
              </div>
            ))}

            {hiddenRubric.map((item, i) => (
              <div key={`locked-${i}`} className={`${styles.rubricCard} ${styles.rubricCardLocked}`}>
                <div className={styles.rubricTop}>
                  <div className={styles.lockedScore}>?</div>
                  <div className={styles.rubricMeta}>
                    <h3>{item.category}</h3>
                    <span className={styles.lockedLabel}>Locked</span>
                  </div>
                </div>
                <div className={styles.lockOverlay}>🔒 Upgrade to unlock</div>
              </div>
            ))}
          </div>
        </section>

        {!isPaid && <UpgradeBanner />}

        {/* Strengths */}
        {strengths.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              🏆 What you&apos;re doing GREAT!
              {!isPaid && data.strengths?.length > FREE_STRENGTHS_LIMIT && (
                <span className={styles.sectionNote}>
                  Showing {FREE_STRENGTHS_LIMIT} of {data.strengths.length}
                </span>
              )}
            </h2>
            <div className={styles.itemList}>
              {strengths.map((s, i) => (
                <div key={i} className={`${styles.listItem} ${styles.listItemGreen}`}>
                  <span className={styles.listIcon}>✓</span>
                  <p>{s}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Blockers */}
        {blockers.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              🚧 Conversion Blockers
              {!isPaid && data.blockers?.length > FREE_BLOCKERS_LIMIT && (
                <span className={styles.sectionNote}>
                  Showing {FREE_BLOCKERS_LIMIT} of {data.blockers.length}
                </span>
              )}
            </h2>
            <div className={styles.itemList}>
              {blockers.map((b, i) => (
                <div key={i} className={`${styles.listItem} ${styles.listItemRed}`}>
                  <span className={styles.listIcon}>→</span>
                  <p>{b}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action checklist */}
        {checklist.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              🚀 Time to TAKE ACTION!
              {!isPaid && data.actionChecklist?.length > FREE_CHECKLIST_LIMIT && (
                <span className={styles.sectionNote}>
                  Showing {FREE_CHECKLIST_LIMIT} of {data.actionChecklist.length}
                </span>
              )}
            </h2>
            <div className={styles.itemList}>
              {checklist.map((item, i) => (
                <div key={i} className={styles.listItem}>
                  <span className={styles.checkNumber}>{i + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Transcript highlights */}
        {transcriptHighlights.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>💬 Transcript Highlights</h2>
            <div className={styles.quoteList}>
              {transcriptHighlights.map((q, i) => (
                <blockquote key={i} className={styles.quote}>"{q}"</blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Tracking Guidance (formerly Measurement Guidance) */}
        {measurement.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 Tracking Guidance</h2>
            <div className={styles.itemList}>
              {measurement.map((m, i) => (
                <div key={i} className={styles.listItem}>
                  <span className={styles.listIcon}>📈</span>
                  <p>{m}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PDF download for paid plans */}
        {isPaid && (
          <div className={styles.pdfBanner}>
            <span>📄</span>
            <div>
              <strong>Download your report</strong>
              <span>Save a PDF copy of this full audit to share with your team or reference later.</span>
            </div>
            <button
              className={styles.pdfBtn}
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Generating…' : 'Download PDF'}
            </button>
          </div>
        )}

        {/* Bottom upgrade CTA for free users */}
        {!isPaid && (
          <div className={styles.bottomUpgrade}>
            <div className={styles.bottomUpgradeGlow} />
            <h2>You&apos;ve seen the surface. Here&apos;s what&apos;s underneath.</h2>
            <p>
              Unlock all 8 rubric scores, every strength and blocker, your full action plan,
              curated expert resources for each finding, and a downloadable PDF — everything
              you need to turn this audit into real results.
            </p>
            <Link href="/pricing" className={styles.bigUpgradeBtn}>
              See pricing →
            </Link>
            <p className={styles.bottomUpgradeNote}>Cancel anytime.</p>
          </div>
        )}
      </main>
    </div>
  )
}
