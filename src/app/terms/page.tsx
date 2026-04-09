import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './legal.module.css'
import BrandLogo from '@/components/BrandLogo'

export const metadata: Metadata = {
  title: 'Terms of Service — Vid Converts',
  description: 'Terms of Service for Vid Converts, a product of Digital Nuclei.',
}

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <BrandLogo />
        </Link>
        <Link href="/pricing" className={styles.navLink}>Pricing</Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <p className={styles.lastUpdated}>Last updated: April 7, 2026</p>
          <h1>Terms of Service</h1>
          <p className={styles.intro}>
            These Terms of Service govern your use of Vid Converts, operated by Digital Nuclei.
            By using our service, you agree to these terms. Please read them carefully.
          </p>
        </div>

        <div className={styles.content}>

          <section>
            <h2>1. Service Description</h2>
            <p>Vid Converts is an AI-powered video conversion audit service. We analyze video content using artificial intelligence and provide evidence-based reports to help improve marketing video performance. Reports are generated automatically and are intended for informational and educational purposes.</p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>You must be at least 18 years of age to use this service. By creating an account, you confirm that the information you provide is accurate and that you have the authority to accept these terms on behalf of any organisation you represent.</p>
          </section>

          <section>
            <h2>3. Subscriptions and Billing</h2>
            <h3>3.1 Monthly Plans</h3>
            <p>Monthly subscriptions are billed on a recurring basis. You may cancel at any time. Upon cancellation, you retain access to your plan until the end of your current billing period. No partial refunds are issued for unused days on monthly plans.</p>

            <h3>3.2 Annual Plans</h3>
            <p>Annual subscriptions are billed upfront for a 12-month term at a discounted rate. If you cancel an annual subscription before the end of the 12-month term, an early termination fee equal to 50% of the remaining months will be charged. For example, if you cancel after 4 months of a 12-month plan, you will be charged 50% of the remaining 8 months.</p>

            <h3>3.3 Price Changes</h3>
            <p>We reserve the right to adjust pricing with at least 30 days' advance notice to active subscribers. Price changes will not affect your current billing period.</p>
          </section>

          <section>
            <h2>4. Refund Policy</h2>
            <p>We offer a <strong>14-day refund</strong> for first-time subscribers on any paid plan. To request a refund within this window, contact us at support@vidconverts.com with your account email and reason for the request.</p>
            <p>Refunds are not available after 14 days, for renewals, or for accounts that have generated more than 3 reports during the refund window. The Social Media Video Add-on is non-refundable once production has commenced.</p>
          </section>

          <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree not to use Vid Converts to:</p>
            <ul>
              <li>Upload video content that is illegal, defamatory, or infringes third-party intellectual property rights</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the service in bulk</li>
              <li>Share account credentials or allow access by multiple users on a single-user plan</li>
              <li>Use the service to train competing AI models</li>
            </ul>
            <p>Violation of these terms may result in immediate account suspension without refund.</p>
          </section>

          <section>
            <h2>6. Intellectual Property</h2>
            <p>You retain full ownership of any video content you upload. By uploading content, you grant Vid Converts a limited, temporary licence to process that content for the purpose of generating your audit report. We do not store, sell, or share your video content with third parties. Generated reports are owned by you once produced.</p>
            <p>The Vid Converts platform, including its design, code, and AI systems, is the intellectual property of Digital Nuclei. Nothing in these terms transfers ownership of our platform to you.</p>
          </section>

          <section>
            <h2>7. AI-Generated Content Disclaimer</h2>
            <p>Reports are generated using artificial intelligence and are provided for informational purposes only. While we strive for accuracy and evidence-based analysis, we do not guarantee specific conversion outcomes or business results. AI analysis is a tool to inform your decisions — not a substitute for professional marketing advice.</p>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, Digital Nuclei shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of Vid Converts. Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2>9. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or use the service in ways that harm other users or the platform. Where possible, we will provide notice before termination.</p>
          </section>

          <section>
            <h2>10. Governing Law</h2>
            <p>These terms are governed by the laws of the Province of Ontario, Canada, and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of Ontario.</p>
          </section>

          <section>
            <h2>11. Changes to These Terms</h2>
            <p>We may update these terms from time to time. We will notify active subscribers by email at least 14 days before material changes take effect. Continued use of the service after that date constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:support@vidconverts.com" className={styles.link}>support@vidconverts.com</a>.</p>
          </section>

        </div>

        <div className={styles.footer}>
          <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          <span>·</span>
          <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
          <span>·</span>
          <Link href="/" className={styles.footerLink}>Home</Link>
        </div>
      </main>
    </div>
  )
}
