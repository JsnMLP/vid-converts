'use client'

import styles from './Navbar.module.css'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import { useState, useEffect, useRef } from 'react'

interface NavbarProps {
  user: User | null
  onSignIn: () => void
}

export default function Navbar({ user, onSignIn }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleSignIn = () => {
    setMenuOpen(false)
    onSignIn()
  }

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [])

  return (
    <nav className={styles.nav} ref={menuRef}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <BrandLogo />
        </Link>

        {/* Desktop links */}
        <div className={styles.links}>
          <Link href="/pricing" className={styles.link}>Pricing</Link>
          <Link href="/faq" className={styles.link}>FAQ</Link>
        </div>

        {/* Desktop actions */}
        <div className={styles.actions}>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.btnPrimary}>Dashboard</Link>
              <button onClick={handleSignOut} className={styles.btnGhost}>Sign out</button>
            </>
          ) : (
            <button onClick={onSignIn} className={styles.btnPrimary}>Sign in</button>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
        <Link href="/pricing" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Pricing</Link>
        <Link href="/faq" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>FAQ</Link>
        <div className={styles.mobileDivider} />
        {user ? (
          <>
            <Link href="/dashboard" className={styles.mobileLinkPrimary} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <button onClick={handleSignOut} className={styles.mobileLinkGhost}>Sign out</button>
          </>
        ) : (
          <button onClick={handleSignIn} className={styles.mobileLinkPrimary}>Sign in</button>
        )}
      </div>
    </nav>
  )
}
