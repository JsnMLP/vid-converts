// ============================================================
// ADD THIS to your /app/api/webhooks/stripe/route.ts
// Place this block AFTER the supabaseAdmin.from('subscriptions').upsert(...)
// inside the 'checkout.session.completed' case
// ============================================================

import { sendEmail } from '@/lib/email/resend'
import { PaymentSuccessEmail } from '@/lib/email/templates/PaymentSuccessEmail'

// --- Inside checkout.session.completed, after the upsert: ---

const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
const userEmail = userData?.user?.email
const userName = userData?.user?.user_metadata?.full_name

if (userEmail) {
  try {
    await sendEmail({
      to: userEmail,
      subject: `You're on the ${plan} plan — full access unlocked`,
      react: PaymentSuccessEmail({
        userName: userName ?? 'there',
        plan: plan ?? 'Complete',
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    })
  } catch (e) {
    console.error('[Email] Payment success email failed:', e)
  }
}
