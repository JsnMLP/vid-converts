import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_TOPUP_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Top-up price not configured.' }, { status: 500 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?topup=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        type: 'topup',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Top-up checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
