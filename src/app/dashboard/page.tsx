import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import styles from './dashboard.module.css'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span style={{ color: 'var(--teal)' }}>Vid</span> Converts
        </Link>
        <Link href="/api/auth/signout" className={styles.signout}>Sign out</Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Hey {firstName} 👋</h1>
          <p>Upload a video to get your evidence-based conversion audit.</p>
        </div>

        {/* Upload zone — coming in Phase 2 */}
        <div className={styles.uploadPlaceholder}>
          <div className={styles.uploadIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 10v20M16 18l8-8 8 8" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 36v2a3 3 0 003 3h22a3 3 0 003-3v-2" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2>Upload your video</h2>
          <p>Full upload interface coming in the next build step.</p>
          <p className={styles.note}>Phase 1 complete ✓ — auth is working, you are signed in as <strong>{user.email}</strong></p>
        </div>

        {/* Past reports placeholder */}
        <div className={styles.reportsSection}>
          <h3>Your reports</h3>
          <div className={styles.emptyState}>
            <p>No reports yet. Upload your first video to get started.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
