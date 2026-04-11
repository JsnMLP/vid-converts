import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const reportedLinks = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resourceId, url, category, reportId } = body

    if (!resourceId || !url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (reportedLinks.has(resourceId)) {
      return NextResponse.json({ ok: true, deduped: true })
    }

    reportedLinks.add(resourceId)

    await resend.emails.send({
      from: 'Vid Converts System <reports@vidconverts.com>',
      to: 'info@mylandscapingproject.ca',
      subject: `Dead link detected — ${resourceId}`,
      html: `
        <div style="font-family: monospace; background: #0A0F1E; color: #E5E7EB; padding: 24px; border-radius: 8px;">
          <h2 style="color: #F87171; margin-top: 0;">Dead Resource Link Detected</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="color: #9CA3AF; padding: 4px 12px 4px 0; white-space: nowrap;">Resource ID</td>
              <td style="color: #2DD4BF;">${resourceId}</td>
            </tr>
            <tr>
              <td style="color: #9CA3AF; padding: 4px 12px 4px 0;">Category</td>
              <td style="color: #E5E7EB;">${category || 'unknown'}</td>
            </tr>
            <tr>
              <td style="color: #9CA3AF; padding: 4px 12px 4px 0;">Dead URL</td>
              <td style="color: #F87171; word-break: break-all;">${url}</td>
            </tr>
            <tr>
              <td style="color: #9CA3AF; padding: 4px 12px 4px 0;">Found on report</td>
              <td style="color: #E5E7EB;">${reportId || 'unknown'}</td>
            </tr>
          </table>
          <br/>
          <p style="color: #9CA3AF; margin: 0;">To fix automatically, run:</p>
          <pre style="background: #111827; padding: 12px; border-radius: 6px; color: #2DD4BF;">npm run heal-links</pre>
          <p style="color: #6B7280; font-size: 12px; margin-top: 16px;">
            This link was silently hidden from the subscriber. No urgent action needed.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Dead link alert failed:', err)
    return NextResponse.json({ ok: true })
  }
}
