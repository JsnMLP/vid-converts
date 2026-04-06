'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import UploadZone from '@/components/UploadZone'
import styles from './dashboard.module.css'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  user: User
}

export default function DashboardClient({ user }: Props) {
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span style={{ color: 'var(--teal)' }}>Vid</span> Converts
        </Link>
        <div className={styles.navRight}>
          <span className={styles.userEmail}>{user.email}</span>
          <button onClick={handleSignOut} className={styles.signout}>Sign out</button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Hey {firstName} 👋</h1>
          <p>Upload your video to get your evidence-based conversion audit.</p>
        </div>

        <UploadZone userId={user.id} />

        <div className={styles.reportsSection}>
          <h3>Your reports</h3>
          <div className={styles.emptyState}>
            <p>No reports yet. Upload your first video above to get started.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
