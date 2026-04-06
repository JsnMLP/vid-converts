'use client'

import styles from './Navbar.module.css'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user: User | null
  onSignIn: () => void
}

export default function Navbar({ user, onSignIn }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoVid}>Vid</span>
          <span className={styles.logoConverts}> Converts</span>
        </Link>

        <div className={styles.links}>
          <Link href="/pricing" className={styles.link}>Pricing</Link>
          <Link href="/faq" className={styles.link}>FAQ</Link>
        </div>

        <div className={styles.actions}>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.btnPrimary}>
                Dashboard
              </Link>
              <button onClick={handleSignOut} className={styles.btnGhost}>
                Sign out
              </button>
            </>
          ) : (
            <button onClick={onSignIn} className={styles.btnPrimary}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
