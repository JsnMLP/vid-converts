'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import styles from './faq.module.css'
import Link from 'next/link'

const faqs = [
  {
    q: 'What is a conversion audit?',
    a: 'A conversion audit scores your video against 8 proven factors that determine whether viewers take action — things like your hook, how clearly your offer is explained, whether your CTA is specific enough, and whether your visuals communicate clearly on mobile. Unlike generic advice, every point in your report is tied to something we actually found in your video.',
  },
  {
    q: 'What does "evidence-based" mean?',
    a: 'It means every claim in your report is grounded in your actual video. We extract the real transcript using Whisper AI and sample real frames from your video. If your hook appears weak, the report will quote what your opening actually says. If a CTA is missing, we\'ll reference the specific moment where it should have appeared. We never produce generic templates — if we can\'t extract enough evidence, we say so plainly.',
  },
  {
    q: 'What is a CTA?',
    a: 'CTA stands for Call to Action — it\'s the moment in your video where you tell the viewer exactly what to do next. Examples include "Book a call", "Click the link below", or "DM me the word READY". A weak or missing CTA is one of the most common reasons marketing videos fail to convert.',
  },
  {
    q: 'What is "Platform Fit"?',
    a: 'Platform fit measures whether your video is formatted and paced correctly for the channel it lives on. A 10-minute YouTube video behaves very differently from a 60-second Instagram Reel or a LinkedIn post. We look at length, aspect ratio, caption use, and whether the video would hold attention on the intended platform.',
  },
  {
    q: 'What video formats do you support?',
    a: 'You can upload MP4 or MOV files up to 500MB, or paste a URL from YouTube, Vimeo, or Instagram. If you paste a URL, we fetch and analyse the video directly — no download needed on your end.',
  },
  {
    q: 'What is the difference between Free and paid tiers?',
    a: 'The free report gives you a real, evidence-based preview: your overall score, 4 of 8 rubric scores, your top 2 strengths, 3 blockers, and a short action checklist. The paid tiers unlock the full breakdown across all 8 categories, every strength and blocker, all transcript highlights and frame observations, and additional tools like Rewrite My Script, before/after comparison, and competitor benchmarking.',
  },
  {
    q: 'Will the free report actually be useful?',
    a: 'Yes. The free report will tell you your biggest conversion problem and give you concrete steps to fix it. It\'s not a teaser full of blurred-out content — it\'s a real diagnosis. We just go much deeper in the paid tiers.',
  },
  {
    q: 'What is "Rewrite My Script"?',
    a: 'Rewrite My Script is a paid-tier feature that takes your full report and generates a revised version of your video script — with a stronger hook, clearer offer language, and a more specific CTA — all written in your voice and grounded in what your original video was trying to say.',
  },
  {
    q: 'What is before/after comparison?',
    a: 'Once you\'ve made changes to your video based on your report, you can upload the revised version and we\'ll score it against the same rubric. The comparison view shows you exactly which scores improved, which stayed flat, and what still needs work.',
  },
  {
    q: 'Is my video stored securely?',
    a: 'Yes. Videos are stored in a private Supabase storage bucket tied to your account. They are never shared or used to train any model. You can delete your videos and reports at any time from your dashboard.',
  },
  {
    q: 'Can I cancel my subscription?',
    // FIX: Removed "No contracts" — annual subscribers are on a contract.
    // Kept "cancel anytime" which is true for all plans.
    a: 'Yes, you can cancel at any time. Monthly subscribers retain access until the end of their billing month. Annual subscribers can cancel to stop renewal and retain access until their year ends.',
  },
  {
    q: 'What is your refund policy?',
    // FIX: Added dedicated refund policy FAQ
    a: 'Monthly subscribers are eligible for a full refund within 7 days of their initial payment if they are not satisfied. Annual subscribers are eligible for a prorated refund within 14 days of purchase. To request a refund, contact us at support@vidconverts.com and we\'ll take care of it promptly.',
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <Navbar user={null} onSignIn={() => window.location.href = '/'} />

      <main className={styles.main}>
        <div className={styles.gridBg} aria-hidden />
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Frequently asked questions</h1>
            <p className={styles.subtitle}>
              Everything you need to know about Vid Converts.
            </p>
          </div>

          <div className={styles.list}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`${styles.item} ${open === i ? styles.itemOpen : ''}`}
              >
                <button
                  className={styles.question}
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <span>{faq.q}</span>
                  <span className={styles.chevron}>{open === i ? '−' : '+'}</span>
                </button>
                {open === i && (
                  <div className={styles.answer}>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.cta}>
            <p>Still have questions?</p>
            <Link href="/pricing" className={styles.ctaLink}>View pricing →</Link>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>Vid Converts</span>
        <span className={styles.by}>by <a href="https://digitalnuclei.com" target="_blank" rel="noopener noreferrer">Digital Nuclei</a></span>
      </footer>
    </>
  )
}
