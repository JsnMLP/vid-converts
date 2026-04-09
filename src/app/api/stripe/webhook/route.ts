import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/resend'
import { PaymentSuccessEmail } from '@/lib/email/templates/PaymentSuccessEmail'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Use service role for webhook updates (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ─── NEW SUBSCRIPTION / UPGRADE ───────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan

        if (userId && plan) {
          // Update all user's reports to the new tier
          await supabaseAdmin
            .from('reports')
            .update({ tier: plan })
            .eq('user_id', userId)

          // Upsert user subscription record
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              status: 'active',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })

          // Send payment success email (non-blocking)
          try {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
            const userEmail = userData?.user?.email
            const userName =
              userData?.user?.user_metadata?.full_name ??
              userData?.user?.email?.split('@')[0] ??
              'there'

            if (userEmail) {
              await sendEmail({
                to: userEmail,
                subject: `You're on the ${plan} plan — full access unlocked`,
                react: PaymentSuccessEmail({
                  userName,
                  plan,
                  dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                }),
              })
            }
          } catch (emailErr) {
            console.error('[Email] Payment success email failed:', emailErr)
          }
        }
        break
      }

      // ─── SUBSCRIPTION CANCELLED OR CHANGED ────────────────────────────────
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        const status = subscription.status

        if (userId) {
          const isActive = status === 'active' || status === 'trialing'
          const plan = isActive ? subscription.metadata?.plan : 'free'

          await supabaseAdmin
            .from('subscriptions')
            .update({
              status,
              plan: plan || 'free',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

          // If cancelled, downgrade future reports to free
          if (!isActive) {
            await supabaseAdmin
              .from('reports')
              .update({ tier: 'free' })
              .eq('user_id', userId)
          }
        }
        break
      }

      // ─── REFUND ISSUED ────────────────────────────────────────────────────
      // Fires when you issue a refund from the Stripe dashboard.
      // Looks up the user by stripe_customer_id, downgrades them to Free,
      // resets their report tiers and monthly usage counter.
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string

        if (!customerId) {
          console.warn('[Refund] charge.refunded fired with no customer ID — skipping')
          break
        }

        // Find the user in our subscriptions table by Stripe customer ID
        const { data: subscription, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id, plan')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (subError) {
          console.error('[Refund] Error looking up subscription:', subError)
          break
        }

        if (!subscription) {
          console.warn('[Refund] No subscription found for customer:', customerId)
          break
        }

        const { user_id: userId } = subscription

        console.log(`[Refund] Processing refund for user ${userId} — downgrading to free`)

        // 1. Downgrade subscription to free
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            analyses_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        // 2. Downgrade all their reports to free tier
        await supabaseAdmin
          .from('reports')
          .update({ tier: 'free' })
          .eq('user_id', userId)

        // 3. Send refund confirmation email (non-blocking)
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
          const userEmail = userData?.user?.email
          const userName =
            userData?.user?.user_metadata?.full_name ??
            userData?.user?.email?.split('@')[0] ??
            'there'

          if (userEmail) {
            await sendEmail({
              to: userEmail,
              subject: 'Your Vid Converts refund has been processed',
              react: RefundConfirmationEmail({
                userName,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                pricingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
              }),
            })
          }
        } catch (emailErr) {
          console.error('[Email] Refund confirmation email failed:', emailErr)
        }

        break
      }

    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


// ─── REFUND EMAIL TEMPLATE (inline — move to /lib/email/templates/ later) ────
// Keeping it here for now since Resend DNS is still propagating.
// Once DNS is live, extract to src/lib/email/templates/RefundConfirmationEmail.tsx
// and import it the same way PaymentSuccessEmail is imported above.

import * as React from 'react'

function RefundConfirmationEmail({
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
        <div style={{ margin: '32px 0', textAlign: 'center' as const }}>
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
