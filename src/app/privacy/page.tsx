import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '../terms/legal.module.css'

export const metadata: Metadata = {
  title: 'Privacy Policy — Vid Converts',
  description: 'Privacy Policy for Vid Converts, a product of Digital Nuclei.',
}

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span style={{ color: 'var(--teal)' }}>Vid</span> Converts
        </Link>
        <Link href="/pricing" className={styles.navLink}>Pricing</Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <p className={styles.lastUpdated}>Last updated: April 7, 2026</p>
          <h1>Privacy Policy</h1>
          <p className={styles.intro}>
            Digital Nuclei ("we", "us", "our") operates Vid Converts. This Privacy Policy explains
            how we collect, use, and protect your personal information in compliance with the
            Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable
            Canadian privacy law.
          </p>
        </div>

        <div className={styles.content}>

          <section>
            <h2>1. Information We Collect</h2>
            <h3>1.1 Account Information</h3>
            <p>When you create an account, we collect your name and email address via Google OAuth. We do not collect or store passwords.</p>

            <h3>1.2 Video Content</h3>
            <p>When you submit a video for analysis (by upload or URL), we temporarily process the video to extract audio and visual frames. This content is deleted from our servers immediately after your report is generated. We do not permanently store your video files.</p>

            <h3>1.3 Report Data</h3>
            <p>We store the AI-generated audit reports associated with your account so you can access them later. This includes transcripts, frame observations, and scoring data derived from your videos.</p>

            <h3>1.4 Payment Information</h3>
            <p>Payments are processed by Stripe. We do not store credit card numbers or payment credentials. We receive limited transaction metadata (plan type, subscription status) to manage your account.</p>

            <h3>1.5 Usage Data</h3>
            <p>We may collect standard web analytics data (page views, feature usage) to improve the service. This data is aggregated and not linked to individual identities.</p>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, operate, and improve the Vid Converts service</li>
              <li>Generate and deliver your audit reports</li>
              <li>Send transactional emails (report ready notifications, payment confirmations)</li>
              <li>Manage your subscription and billing</li>
              <li>Respond to support requests</li>
            </ul>
            <p>We do not sell your personal information to third parties. We do not use your video content to train AI models.</p>
          </section>

          <section>
            <h2>3. Third-Party Services</h2>
            <p>We use the following third-party services to operate Vid Converts:</p>
            <ul>
              <li><strong>Supabase</strong> — database and authentication</li>
              <li><strong>OpenAI</strong> — AI analysis (audio transcription and report generation)</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Vercel</strong> — hosting and infrastructure</li>
            </ul>
            <p>Each of these providers has their own privacy policy and data processing terms. We have data processing agreements in place where required.</p>
          </section>

          <section>
            <h2>4. Data Retention</h2>
            <p>We retain your account information and reports for as long as your account is active. You may delete individual reports at any time from your dashboard. To request full account deletion, contact us at support@vidconverts.com. We will complete account deletion within 30 days of your request.</p>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <p>Under PIPEDA, you have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Withdraw consent and request deletion of your data</li>
              <li>File a complaint with the Office of the Privacy Commissioner of Canada</li>
            </ul>
            <p>To exercise these rights, contact us at support@vidconverts.com.</p>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>We use strictly necessary cookies for authentication and session management. We do not use tracking cookies or advertising cookies. If we add optional analytics cookies in the future, we will update this policy and request your consent.</p>
          </section>

          <section>
            <h2>7. Data Security</h2>
            <p>We use industry-standard security practices including encrypted connections (HTTPS), secure database access controls, and role-based permissions. No system is completely immune to security risks, and we encourage you to use a strong, unique password for your Google account.</p>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>Vid Converts is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from minors.</p>
          </section>

          <section>
            <h2>9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of material changes by email or by displaying a notice in the application. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>For privacy-related questions or requests, contact our Privacy Officer at <a href="mailto:privacy@vidconverts.com" className={styles.link}>privacy@vidconverts.com</a> or by mail at Digital Nuclei, Toronto, Ontario, Canada.</p>
          </section>

        </div>

        <div className={styles.footer}>
          <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
          <span>·</span>
          <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
          <span>·</span>
          <Link href="/" className={styles.footerLink}>Home</Link>
        </div>
      </main>
    </div>
  )
}
