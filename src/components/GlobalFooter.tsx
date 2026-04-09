'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function GlobalFooter() {
  const [showRefund, setShowRefund] = useState(false)

  return (
    <>
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px 24px',
        fontSize: '13px',
        color: '#6b7280',
        marginTop: 'auto',
      }}>
        <span>© {new Date().getFullYear()} Digital Nuclei. All rights reserved.</span>
        <Link href="/privacy" style={{ color: '#6b7280', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          Terms of Service
        </Link>
        <button
          onClick={() => setShowRefund(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', fontSize: '13px', padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          Refund Policy
        </button>
        <Link href="/faq" style={{ color: '#6b7280', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          FAQ
        </Link>
        <a href="mailto:support@vidconverts.com" style={{ color: '#6b7280', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          support@vidconverts.com
        </a>
      </footer>

      {/* Refund Policy Modal */}
      {showRefund && (
        <div
          onClick={() => setShowRefund(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#151b2d',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '560px',
              width: '100%',
              position: 'relative',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
            <button
              onClick={() => setShowRefund(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6b7280', fontSize: '20px', lineHeight: 1,
              }}>
              ✕
            </button>

            <h2 style={{
              fontSize: '22px', fontWeight: 800,
              color: '#f1f5f9', marginBottom: '8px',
              fontFamily: 'var(--font-encode)',
            }}>
              Refund Policy
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>
              Last updated: April 2026
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>

              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', marginBottom: '6px' }}>Free Plan</strong>
                The Free plan costs nothing and is not eligible for refunds as no payment is made.
              </div>

              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', marginBottom: '6px' }}>Monthly Subscriptions</strong>
                If you are unsatisfied with your first month on a paid plan (Complete or Premium), contact us within 7 days of your initial charge and we will issue a full refund — no questions asked. After the first 7 days, monthly charges are non-refundable as the service has been delivered and analyses may have been consumed.
              </div>

              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', marginBottom: '6px' }}>Annual Subscriptions</strong>
                Annual subscribers are eligible for a full refund within 14 days of their initial annual payment, provided they have used fewer than 3 analyses during that period. After 14 days or after 3 or more analyses have been used, annual payments are non-refundable. We recommend starting with a monthly plan if you are unsure.
              </div>

              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', marginBottom: '6px' }}>Cancellations</strong>
                You may cancel your subscription at any time. Cancellation stops future charges but does not entitle you to a refund for the current billing period. You will retain access to your plan until the end of the period you have paid for.
              </div>

              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', marginBottom: '6px' }}>How to Request a Refund</strong>
                Email us at{' '}
                <a href="mailto:support@vidconverts.com" style={{ color: '#2dd4bf' }}>
                  support@vidconverts.com
                </a>{' '}
                with the subject line "Refund Request" and your account email address. We respond within 1 business day.
              </div>

            </div>

            <button
              onClick={() => setShowRefund(false)}
              style={{
                marginTop: '32px', width: '100%',
                background: '#2dd4bf', border: 'none', borderRadius: '8px',
                padding: '12px', color: '#0f1117', fontWeight: 700,
                fontSize: '14px', cursor: 'pointer',
              }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
