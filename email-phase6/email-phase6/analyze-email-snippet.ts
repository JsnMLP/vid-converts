// ============================================================
// ADD THIS to your /app/api/analyze/route.ts
// Place this block AFTER you save the report to Supabase
// ============================================================

import { sendEmail } from '@/lib/email/resend'
import { ReportReadyEmail } from '@/lib/email/templates/ReportReadyEmail'

// --- Inside your POST handler, after report is saved: ---

try {
  await sendEmail({
    to: userEmail,                          // the authenticated user's email
    subject: 'Your video audit is ready',
    react: ReportReadyEmail({
      userName: userName ?? 'there',
      videoTitle: videoTitle ?? 'your video',
      reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/report/${reportId}`,
      topFinding: report.findings?.[0] ?? 'See your full report for insights.',
      isPaid: userPlan === 'complete',
    }),
  })
} catch (e) {
  // Non-blocking — never fail the analysis if email fails
  console.error('[Email] Report ready email failed:', e)
}
