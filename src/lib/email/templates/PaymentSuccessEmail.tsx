import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

interface PaymentSuccessEmailProps {
  userName: string
  plan: string
  dashboardUrl: string
}

export function PaymentSuccessEmail({ userName, plan, dashboardUrl }: PaymentSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You're on the {plan} plan — full access unlocked</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're all set! 🚀</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Your <strong>{plan}</strong> plan is now active. All your reports
            are fully unlocked — including scripts, hooks, and A/B test
            suggestions.
          </Text>
          <Section style={featureBox}>
            <Text style={featureText}>✅ Full AI audit report</Text>
            <Text style={featureText}>✅ Conversion scripts &amp; hooks</Text>
            <Text style={featureText}>✅ A/B test recommendations</Text>
            <Text style={featureText}>✅ Priority processing</Text>
          </Section>
          <Button style={button} href={dashboardUrl}>
            Go to Dashboard
          </Button>
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
const featureBox = { backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '6px', margin: '16px 0' }
const featureText = { fontSize: '14px', color: '#166534', margin: '4px 0' }
const button = {
  backgroundColor: '#4f46e5', color: '#fff', padding: '12px 24px',
  borderRadius: '6px', fontWeight: '600', fontSize: '15px',
  textDecoration: 'none', display: 'inline-block', margin: '16px 0',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const }
