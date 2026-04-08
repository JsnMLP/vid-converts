import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

interface ReportReadyEmailProps {
  userName: string
  videoTitle: string
  reportUrl: string
  topFinding: string
  isPaid: boolean
}

export function ReportReadyEmail({
  userName,
  videoTitle,
  reportUrl,
  topFinding,
  isPaid,
}: ReportReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your video conversion audit is ready — {videoTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your audit is ready 🎯</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            We've finished analyzing <strong>{videoTitle}</strong>. Here's your
            top finding:
          </Text>
          <Section style={findingBox}>
            <Text style={findingText}>"{topFinding}"</Text>
          </Section>
          <Button style={button} href={reportUrl}>
            View Full Report
          </Button>
          {!isPaid && (
            <Text style={upsell}>
              🔒 Unlock all findings, scripts, and A/B recommendations with a
              Complete plan.
            </Text>
          )}
          <Hr style={hr} />
          <Text style={footer}>Vid Converts · Evidence-based video audits</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }
const container = {
  backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 32px',
  borderRadius: '8px', maxWidth: '520px',
}
const h1 = { fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6' }
const findingBox = {
  backgroundColor: '#f0f4ff', borderLeft: '4px solid #4f46e5',
  padding: '16px', borderRadius: '4px', margin: '16px 0',
}
const findingText = { fontSize: '14px', color: '#3730a3', fontStyle: 'italic', margin: 0 }
const button = {
  backgroundColor: '#4f46e5', color: '#fff', padding: '12px 24px',
  borderRadius: '6px', fontWeight: '600', fontSize: '15px',
  textDecoration: 'none', display: 'inline-block', margin: '16px 0',
}
const upsell = {
  fontSize: '13px', color: '#666', backgroundColor: '#fffbeb',
  padding: '12px', borderRadius: '4px',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const }
