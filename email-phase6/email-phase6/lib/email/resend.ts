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
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Vid Converts <noreply@vidconverts.com>',
    to,
    subject,
    react,
  })

  if (error) {
    console.error('[Resend] Failed to send email:', error)
    throw new Error(error.message)
  }

  return data
}
