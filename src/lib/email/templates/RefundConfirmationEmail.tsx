import * as React from 'react'

export function RefundConfirmationEmail({
  userName,
  dashboardUrl,
  pricingUrl,
}: {
  userName: string
  dashboardUrl: string
  pricingUrl: string
}) {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto', color: '#111' }}>
      <div style={{ background: '#0f172a', padding: '32px 40px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#2DD4BF', fontSize: 22, margin: 0, fontWeight: 900 }}>
          Vid Converts
        </h1>
      </div>
      <div style={{ background: '#fff', padding: '40px 40px 32px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 16, marginTop: 0 }}>Hi {userName},</p>
        <p style={{ fontSize: 16 }}>
          Your refund has been processed and will appear on your original payment method within
          5–10 business days, depending on your bank.
        </p>
        <p style={{ fontSize: 16 }}>
          Your account has been moved back to the <strong>Free plan</strong>. You still have
          access to all your existing reports on your dashboard.
        </p>
        <p style={{ fontSize: 16 }}>
          If you have any questions or if something wasn't right about your experience, please
          reply to this email — we'd love to make it right.
        </p>
        <div style={{ margin: '32px 0', textAlign: 'center' }}>
          <a
            href={pricingUrl}
            style={{
              background: '#2DD4BF',
              color: '#0f172a',
              padding: '12px 28px',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
              display: 'inline-block',
            }}
          >
            View Plans
          </a>
        </div>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 0 }}>
          — The Vid Converts Team<br />
          <a href="mailto:support@vidconverts.com" style={{ color: '#2DD4BF' }}>
            support@vidconverts.com
          </a>
        </p>
      </div>
    </div>
  )
}
