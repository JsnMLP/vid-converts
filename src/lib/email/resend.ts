import { Resend } from 'resend'
import * as React from 'react'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  // In dev/testing, Resend only allows sending to your own verified address.
  // Once you have a Vid Converts domain, remove this override.
  const recipient = process.env.EMAIL_DEV_OVERRIDE ?? to

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Vid Converts <onboarding@resend.dev>',
    to: recipient,
    subject,
    react,
  })

  if (error) {
    console.error('[Resend] Failed to send email:', error)
    throw new Error(error.message)
  }

  return data
}