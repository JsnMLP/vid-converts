import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/resend'
import { PaymentSuccessEmail } from '@/lib/email/templates/PaymentSuccessEmail'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
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
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
