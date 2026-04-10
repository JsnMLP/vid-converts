import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/resend'
import { PaymentSuccessEmail } from '@/lib/email/templates/PaymentSuccessEmail'
import { RefundConfirmationEmail } from '@/lib/email/templates/RefundConfirmationEmail'

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
          await supabaseAdmin
            .from('reports')
            .update({ tier: plan })
            .eq('user_id', userId)

          // Reset analyses_count to 0 on upgrade so user starts fresh on new plan
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              status: 'active',
              analyses_count: 0,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })

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
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string

        if (!customerId) {
          console.warn('[Refund] charge.refunded fired with no customer ID — skipping')
          break
        }

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

        await supabaseAdmin
          .from('reports')
          .update({ tier: 'free' })
          .eq('user_id', userId)

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
