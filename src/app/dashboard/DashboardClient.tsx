'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import UploadZone from '@/components/UploadZone'
import styles from './dashboard.module.css'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

interface Report {
  id: string
  video_name: string
  niche: string
  overall_score: number
  tier: string
  created_at: string
  report_data: { overallScore: number }
}

interface Props {
  user: User
}

export default function DashboardClient({ user }: Props) {
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded')
  const plan = searchParams.get('plan')
  const [reports, setReports] = useState<Report[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, video_name, niche, tier, created_at, report_data')
      .order('created_at', { ascending: false })
      .limit(20)
    setReports(data || [])
    setLoadingReports(false)
  }

  const handleDeleteClick = (e: React.MouseEvent, reportId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDeleteId(reportId)
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)
    setConfirmDeleteId(null)
    try {
      const res = await fetch('/api/reports/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: confirmDeleteId }),
      })
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== confirmDeleteId))
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'var(--teal)'
    if (score >= 45) return '#f59e0b'
    return '#f87171'
  }

  const getTierLabel = (tier: string) => {
    if (tier === 'premium') return '⭐ Premium'
    if (tier === 'complete') return '✦ Complete'
    return 'Free'
  }

  const getTierClass = (tier: string) => {
    if (tier === 'premium') return styles.reportTierPremium
    if (tier === 'complete') return styles.reportTierComplete
    return ''
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span style={{ color: 'var(--teal)' }}>Vid</span> Converts
        </Link>
        <div className={styles.navRight}>
          <Link href="/pricing" className={styles.pricingLink}>Pricing</Link>
          <span className={styles.userEmail}>{user.email}</span>
          <button onClick={handleSignOut} className={styles.signout}>Sign out</button>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Upgrade success banner */}
        {upgraded && plan && (
          <div className={styles.upgradeBanner}>
            <span>🎉</span>
            <div>
              <strong>You're now on the {plan.charAt(0).toUpperCase() + plan.slice(1)} plan!</strong>
              <span>All your reports have been upgraded. Enjoy the full breakdown.</span>
            </div>
            <button className={styles.bannerClose} onClick={() => router.replace('/dashboard')}>✕</button>
          </div>
        )}

        <div className={styles.header}>
          <h1>Hey {firstName} 👋</h1>
          <p>Upload a video or paste a URL to get your evidence-based conversion audit.</p>
        </div>

        <UploadZone userId={user.id} />

        {/* Past reports */}
        <div className={styles.reportsSection}>
          <div className={styles.reportsSectionHeader}>
            <h3>Your reports</h3>
            {reports.length > 0 && (
              <span className={styles.reportsCount}>
                {reports.length} report{reports.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loadingReports ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
            </div>
          ) : reports.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎬</div>
              <h4>No reports yet</h4>
              <p>Upload your first video above to get your evidence-based conversion audit.</p>
            </div>
          ) : (
            <div className={styles.reportsList}>
              {reports.map((report) => {
                const score = report.report_data?.overallScore || 0
                const isDeleting = deletingId === report.id
                return (
                  <div key={report.id} className={`${styles.reportCardWrap} ${isDeleting ? styles.reportCardDeleting : ''}`}>
                    <Link href={`/report/${report.id}`} className={styles.reportCard}>
                      <div className={styles.reportScore} style={{ color: getScoreColor(score) }}>
                        {score}
                        <span>/100</span>
                      </div>
                      <div className={styles.reportInfo}>
                        <strong>{report.video_name}</strong>
                        <span>{report.niche}</span>
                      </div>
                      <div className={styles.reportMeta}>
                        <span className={`${styles.reportTier} ${getTierClass(report.tier)}`}>
                          {getTierLabel(report.tier)}
                        </span>
                        <span className={styles.reportDate}>{formatDate(report.created_at)}</span>
                      </div>
                      <div className={styles.reportArrow}>→</div>
                    </Link>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDeleteClick(e, report.id)}
                      aria-label="Delete report"
                      title="Delete report">
                      {isDeleting ? (
                        <span className={styles.deletingSpinner} />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDeleteId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑</div>
            <h3>Delete this report?</h3>
            <p>This action cannot be undone. The report and all its data will be permanently removed.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button className={styles.modalConfirm} onClick={handleDeleteConfirm}>
                Yes, delete it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
