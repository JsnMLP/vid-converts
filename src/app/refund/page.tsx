'use client'

import Navbar from '@/components/Navbar'
import BrandLogo from '@/components/BrandLogo'
import Link from 'next/link'
import styles from './refund.module.css'

const sections = [
  {
    title: 'Free Plan',
    content:
      'The Free plan is completely free of charge. There is nothing to refund.',
  },
  {
    title: 'Monthly Subscriptions',
    content:
      'Monthly subscribers are eligible for a full refund within 7 days of their initial payment, provided they have used no more than 1 analysis during that period. After 7 days, or after more than 1 analysis has been used, no refund will be issued. Your subscription will remain active until the end of the current billing period.',
  },
  {
    title: 'Annual Subscriptions',
    content:
      'Annual subscribers are eligible for a full refund within 14 days of purchase, provided they have used no more than 3 analyses during that period. After 14 days, or after more than 3 analyses have been used, no refund will be issued. You will retain access until the end of your annual billing period.',
  },
  {
    title: 'Cancellations',
    content:
      'You may cancel your subscription at any time from your account settings. Cancellation stops future billing but does not trigger an automatic refund. Monthly subscribers retain access until the end of their current billing month. Annual subscribers retain access until the end of their current year.',
  },
  {
    title: 'How to Request a Refund',
    content:
      'To request a refund, email us at support@vidconverts.com with the subject line "Refund Request" and include the email address associated with your account. We will review your request and respond within 2 business days. Approved refunds are processed through Stripe and typically appear on your original payment method within 5–10 business days, depending on your bank.',
  },
]

export default function RefundPage() {
  return (
    <>
      <Navbar user={null} onSignIn={() => window.location.href = '/'} />

      <main className={styles.main}>
        <div className={styles.gridBg} aria-hidden />

        <div className="container">
          <div className={styles.header}>
            <p className={styles.eyebrow}>Legal</p>
            <h1 className={styles.title}>Refund Policy</h1>
            <p className={styles.updated}>Last updated: April 9, 2026</p>
          </div>

          <div className={styles.content}>
            <p className={styles.intro}>
              We want you to feel confident trying Vid Converts. If something isn't
              right, we'll make it right. Here's exactly how our refund policy works.
            </p>

            {sections.map((section) => (
              <div key={section.title} className={styles.section}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <p className={styles.sectionText}>{section.content}</p>
              </div>
            ))}

            <div className={styles.contact}>
              <p>
                Questions about this policy?{' '}
                <a href="mailto:support@vidconverts.com" className={styles.link}>
                  support@vidconverts.com
                </a>
              </p>
            </div>

            <div className={styles.backLinks}>
              <Link href="/pricing" className={styles.link}>← Back to Pricing</Link>
              <span className={styles.dot}>·</span>
              <Link href="/faq" className={styles.link}>FAQ</Link>
              <span className={styles.dot}>·</span>
              <Link href="/terms" className={styles.link}>Terms of Service</Link>
              <span className={styles.dot}>·</span>
              <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
            </div>
          </div>
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
