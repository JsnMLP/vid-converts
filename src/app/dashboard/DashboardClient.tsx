'use client'

import { useState, useEffect, useRef } from 'react'
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
  folder: string | null
  tags: string[]
}

interface Props {
  user: User
}

// ── Colour palette for tags ───────────────────────────────────────────────────
const TAG_COLORS = [
  { bg: 'rgba(124,92,252,0.18)', text: '#a78bfa', border: 'rgba(124,92,252,0.35)' },
  { bg: 'rgba(45,212,191,0.15)', text: '#2dd4bf', border: 'rgba(45,212,191,0.35)' },
  { bg: 'rgba(245,166,35,0.15)', text: '#fbbf24', border: 'rgba(245,166,35,0.35)' },
  { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.35)' },
  { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', border: 'rgba(96,165,250,0.35)' },
  { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.35)' },
]

function getTagColor(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

// ── Tag pill component ────────────────────────────────────────────────────────
function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const color = getTagColor(tag)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '999px', fontSize: '11px',
      fontWeight: 700, letterSpacing: '0.02em',
      background: color.bg, color: color.text, border: `1px solid ${color.border}`,
    }}>
      {tag}
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: color.text, padding: 0, lineHeight: 1, fontSize: '12px', opacity: 0.7 }}
        >×</button>
      )}
    </span>
  )
}

// ── Inline organise panel (shown below a report card) ────────────────────────
function OrganisePanel({
  report,
  allFolders,
  allTags,
  onSave,
  onClose,
}: {
  report: Report
  allFolders: string[]
  allTags: string[]
  onSave: (id: string, folder: string | null, tags: string[]) => void
  onClose: () => void
}) {
  const [folder, setFolder] = useState(report.folder || '')
  const [tags, setTags] = useState<string[]>(report.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase()
    if (clean && !tags.includes(clean)) setTags(prev => [...prev, clean])
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(report.id, folder || null, tags)
    setSaving(false)
    onClose()
  }

  // Suggestions: folders and tags not already selected
  const folderSuggestions = allFolders.filter(f => f !== folder && f.toLowerCase().includes(folder.toLowerCase()))
  const tagSuggestions = allTags.filter(t => !tags.includes(t) && t.includes(tagInput.toLowerCase()))

  return (
    <div style={{
      background: 'var(--card, #151b2d)', border: '1px solid var(--border, #1e2433)',
      borderRadius: '10px', padding: '16px', marginTop: '4px',
      display: 'flex', flexDirection: 'column', gap: '14px',
    }}
      onClick={e => e.stopPropagation()}
    >
      {/* Folder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #6b7280)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          📁 Folder
        </label>
        <input
          value={folder}
          onChange={e => setFolder(e.target.value)}
          placeholder="e.g. Client A, YouTube, Q1 2025"
          style={{
            background: 'var(--bg, #0f1117)', border: '1px solid var(--border, #1e2433)',
            borderRadius: '6px', padding: '8px 10px', color: 'var(--text, #f1f5f9)',
            fontSize: '13px', outline: 'none', width: '100%',
          }}
        />
        {/* Folder suggestions */}
        {folderSuggestions.length > 0 && folder && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {folderSuggestions.map(f => (
              <button key={f} onClick={() => setFolder(f)} style={{
                background: 'var(--bg, #0f1117)', border: '1px solid var(--border, #1e2433)',
                borderRadius: '6px', padding: '3px 10px', fontSize: '12px',
                color: 'var(--text-muted, #6b7280)', cursor: 'pointer',
              }}>
                {f}
              </button>
            ))}
          </div>
        )}
        {/* All existing folders as quick picks when input is empty */}
        {!folder && allFolders.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {allFolders.map(f => (
              <button key={f} onClick={() => setFolder(f)} style={{
                background: 'var(--bg, #0f1117)', border: '1px solid var(--border, #1e2433)',
                borderRadius: '6px', padding: '3px 10px', fontSize: '12px',
                color: 'var(--text-muted, #6b7280)', cursor: 'pointer',
              }}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #6b7280)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          🏷 Tags
        </label>
        {/* Tag input + existing tags */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            background: 'var(--bg, #0f1117)', border: '1px solid var(--border, #1e2433)',
            borderRadius: '6px', padding: '6px 10px', minHeight: '38px',
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', cursor: 'text',
          }}>
          {tags.map(t => <TagPill key={t} tag={t} onRemove={() => removeTag(t)} />)}
          <input
            ref={inputRef}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length ? '' : 'Type a tag, press Enter'}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text, #f1f5f9)', fontSize: '13px',
              flex: 1, minWidth: '120px',
            }}
          />
        </div>
        {/* Tag suggestions */}
        {tagSuggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {tagSuggestions.map(t => (
              <button key={t} onClick={() => addTag(t)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                <TagPill tag={t} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid var(--border, #1e2433)',
          borderRadius: '6px', padding: '7px 14px', color: 'var(--text-muted, #6b7280)',
          fontSize: '13px', cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{
          background: 'var(--teal, #2dd4bf)', border: 'none',
          borderRadius: '6px', padding: '7px 16px', color: '#0f1117',
          fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
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

  // Tags & folders state
  const [organisingId, setOrganisingId] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => { loadReports() }, [])

  const loadReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, video_name, niche, tier, created_at, report_data, overall_score, folder, tags')
      .order('created_at', { ascending: false })
      .limit(50)
    setReports(data || [])
    setLoadingReports(false)
  }

  // Derived: all unique folders and tags across reports
  const allFolders = Array.from(new Set(reports.map(r => r.folder).filter(Boolean) as string[])).sort()
  const allTags = Array.from(new Set(reports.flatMap(r => r.tags || []))).sort()

  // Filtered view
  const filteredReports = reports.filter(r => {
    if (activeFolder && r.folder !== activeFolder) return false
    if (activeTag && !(r.tags || []).includes(activeTag)) return false
    return true
  })

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

  const handleOrganiseSave = async (id: string, folder: string | null, tags: string[]) => {
    try {
      await fetch('/api/reports/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: id, folder, tags }),
      })
      // Optimistic update
      setReports(prev => prev.map(r => r.id === id ? { ...r, folder, tags } : r))
    } catch (err) {
      console.error('Save failed:', err)
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

          {/* ── Folder + Tag filter bar ── */}
          {(allFolders.length > 0 || allTags.length > 0) && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px',
              marginBottom: '16px', alignItems: 'center',
            }}>
              {/* All reports reset */}
              {(activeFolder || activeTag) && (
                <button
                  onClick={() => { setActiveFolder(null); setActiveTag(null) }}
                  style={{
                    background: 'none', border: '1px solid var(--border, #1e2433)',
                    borderRadius: '999px', padding: '4px 12px', fontSize: '12px',
                    color: 'var(--text-muted, #6b7280)', cursor: 'pointer',
                  }}>
                  ✕ All reports
                </button>
              )}

              {/* Folder pills */}
              {allFolders.map(folder => (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(activeFolder === folder ? null : folder)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: activeFolder === folder ? 'rgba(45,212,191,0.15)' : 'var(--card, #151b2d)',
                    border: activeFolder === folder ? '1px solid rgba(45,212,191,0.4)' : '1px solid var(--border, #1e2433)',
                    borderRadius: '999px', padding: '4px 12px', fontSize: '12px',
                    color: activeFolder === folder ? 'var(--teal, #2dd4bf)' : 'var(--text-muted, #6b7280)',
                    cursor: 'pointer', fontWeight: activeFolder === folder ? 700 : 400,
                  }}>
                  📁 {folder}
                  <span style={{ opacity: 0.6, fontSize: '11px' }}>
                    {reports.filter(r => r.folder === folder).length}
                  </span>
                </button>
              ))}

              {/* Tag pills */}
              {allTags.map(tag => {
                const color = getTagColor(tag)
                const isActive = activeTag === tag
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: isActive ? color.bg : 'var(--card, #151b2d)',
                      border: isActive ? `1px solid ${color.border}` : '1px solid var(--border, #1e2433)',
                      borderRadius: '999px', padding: '4px 12px', fontSize: '12px',
                      color: isActive ? color.text : 'var(--text-muted, #6b7280)',
                      cursor: 'pointer', fontWeight: isActive ? 700 : 400,
                    }}>
                    🏷 {tag}
                    <span style={{ opacity: 0.6, fontSize: '11px' }}>
                      {reports.filter(r => (r.tags || []).includes(tag)).length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {loadingReports ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
            </div>
          ) : filteredReports.length === 0 && reports.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎬</div>
              <h4>No reports yet</h4>
              <p>Upload your first video above to get your evidence-based conversion audit.</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h4>No reports in this {activeFolder ? 'folder' : 'tag'}</h4>
              <p>Try a different filter or <button onClick={() => { setActiveFolder(null); setActiveTag(null) }} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>view all reports</button>.</p>
            </div>
          ) : (
            <div className={styles.reportsList}>
              {filteredReports.map((report) => {
                const score = report.report_data?.overallScore || 0
                const isDeleting = deletingId === report.id
                const isOrganising = organisingId === report.id

                return (
                  <div key={report.id}>
                    <div className={`${styles.reportCardWrap} ${isDeleting ? styles.reportCardDeleting : ''}`}>
                      <Link href={`/report/${report.id}`} className={styles.reportCard}>
                        <div className={styles.reportScore} style={{ color: getScoreColor(score) }}>
                          {score}
                          <span>/100</span>
                        </div>
                        <div className={styles.reportInfo}>
                          <strong>{report.video_name}</strong>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {report.niche}
                            {/* Folder badge */}
                            {report.folder && (
                              <span style={{
                                fontSize: '11px', color: 'var(--teal, #2dd4bf)',
                                background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)',
                                borderRadius: '4px', padding: '1px 6px',
                              }}>
                                📁 {report.folder}
                              </span>
                            )}
                          </span>
                          {/* Tag pills on the card */}
                          {report.tags?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {report.tags.map(t => <TagPill key={t} tag={t} />)}
                            </div>
                          )}
                        </div>
                        <div className={styles.reportMeta}>
                          <span className={`${styles.reportTier} ${getTierClass(report.tier)}`}>
                            {getTierLabel(report.tier)}
                          </span>
                          <span className={styles.reportDate}>{formatDate(report.created_at)}</span>
                        </div>
                        <div className={styles.reportArrow}>→</div>
                      </Link>

                      {/* Organise button */}
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOrganisingId(isOrganising ? null : report.id)
                        }}
                        aria-label="Organise report"
                        title="Add to folder or tag"
                        style={{ marginRight: '2px' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 3.5h5l1.5 2H13v6.5H1V3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Delete button */}
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

                    {/* Organise panel — expands inline below the card */}
                    {isOrganising && (
                      <OrganisePanel
                        report={report}
                        allFolders={allFolders}
                        allTags={allTags}
                        onSave={handleOrganiseSave}
                        onClose={() => setOrganisingId(null)}
                      />
                    )}
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
