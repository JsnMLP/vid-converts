import * as React from 'react'

interface ReportCompleteEmailProps {
  firstName: string
  reportId: string
  overallScore: number
  reportUrl: string
}

const scoreColor = (score: number) =>
  score >= 70 ? '#2DD4BF' : score >= 45 ? '#F5A623' : '#EF4444'

const scoreLabel = (score: number) =>
  score >= 70 ? 'Strong' : score >= 45 ? 'Developing' : 'Needs Work'

export default function ReportCompleteEmail({
  firstName = 'there',
  reportId = '',
  overallScore = 0,
  reportUrl = 'https://www.vidconverts.com/dashboard',
}: ReportCompleteEmailProps) {
  const color = scoreColor(overallScore)
  const label = scoreLabel(overallScore)

  return (
    <div style={{ backgroundColor: '#0A0F1E', fontFamily: "'Mulish', 'Helvetica Neue', Arial, sans-serif", padding: '0', margin: '0' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#111827', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#0A0F1E', padding: '24px 32px', borderBottom: '1px solid #1F2937' }}>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>
            <span style={{ color: '#2DD4BF' }}>Vid</span>
            <span style={{ color: '#FFFFFF' }}> Converts™</span>
          </p>
        </div>
        <div style={{ padding: '32px' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 800, margin: '0 0 16px 0' }}>
            Hey {firstName} 👋 — your report is ready.
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            Your video conversion audit just finished. Here is your result:
          </p>
          <div style={{ backgroundColor: '#0A0F1E', border: '1px solid #1F2937', borderRadius: '12px', padding: '24px', textAlign: 'center', margin: '0 0 24px 0' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <span style={{ color: color, fontSize: '52px', fontWeight: 900 }}>{overallScore}</span>
              <span style={{ color: '#9CA3AF', fontSize: '24px' }}>/100</span>
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>
              Overall Conversion Score — <span style={{ color: color, fontWeight: 700 }}>{label}</span>
            </p>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px 0' }}>
            Your full evidence-based audit includes your rubric breakdown, what you are doing GREAT, and a step-by-step action plan to improve your conversions.
          </p>
          <div style={{ textAlign: 'center', margin: '0 0 28px 0' }}>
            <a href={reportUrl} style={{ backgroundColor: '#2DD4BF', color: '#0A0F1E', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>
              View My Full Report
            </a>
          </div>
          <hr style={{ borderColor: '#1F2937', margin: '24px 0' }} />
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>
            Questions? Visit our <a href="https://www.vidconverts.com/faq" style={{ color: '#2DD4BF', textDecoration: 'none' }}>FAQ</a> or reply to this email.
          </p>
        </div>
        <div style={{ backgroundColor: '#0A0F1E', padding: '20px 32px', borderTop: '1px solid #1F2937', textAlign: 'center' }}>
          <p style={{ color: '#4B5563', fontSize: '12px', margin: '0 0 4px 0' }}>2026 Digital Nuclei. All rights reserved.</p>
          <p style={{ color: '#4B5563', fontSize: '12px', margin: 0 }}>
            <a href="https://www.vidconverts.com/privacy" style={{ color: '#6B7280', textDecoration: 'none' }}>Privacy Policy</a>
            {' · '}
            <a href="https://www.vidconverts.com/terms" style={{ color: '#6B7280', textDecoration: 'none' }}>Terms of Service</a>
            {' · '}
            <a href="https://www.vidconverts.com/refund" style={{ color: '#6B7280', textDecoration: 'none' }}>Refund Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
