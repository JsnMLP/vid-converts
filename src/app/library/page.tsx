import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Library · Vid Converts™',
  description: 'The full collection of conversion-focused articles — psychology, neuroscience, and strategy behind video that actually converts.',
}

function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

const CATEGORIES = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'hook', label: 'Hook' },
  { id: 'problem_clarity', label: 'Problem Clarity' },
  { id: 'offer_clarity', label: 'Offer Clarity' },
  { id: 'trust_proof', label: 'Trust & Proof' },
  { id: 'cta', label: 'CTA' },
  { id: 'visual_communication', label: 'Visual Communication' },
  { id: 'platform_fit', label: 'Platform Fit' },
  { id: 'measurement_readiness', label: 'Measurement Readiness' },
]

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  tier: 'free' | 'member'
  rubric_category: string
  read_minutes: number | null
  published_at: string | null
}

export default async function LibraryPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userPlan: string | null = null
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    userPlan = sub?.plan ?? null
  }

  const isPremium = userPlan === 'premium'
  const isComplete = userPlan === 'complete'

  // Complete members have no library — redirect to dashboard
  if (isComplete) redirect('/dashboard')

  // Use a fresh client with no session cookies so RLS doesn't filter by tier
  // We control access in the UI — all published articles show, member ones are locked
  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: articles } = await anonSupabase
    .from('articles')
    .select('id, slug, title, excerpt, tier, rubric_category, read_minutes, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const allArticles = (articles || []) as Article[]

  const byCategory: Record<string, Article[]> = {}
  for (const cat of CATEGORIES) byCategory[cat.id] = []
  for (const article of allArticles) {
    if (byCategory[article.rubric_category]) byCategory[article.rubric_category].push(article)
  }
  // Sort free articles first within each category
  for (const cat of CATEGORIES) {
    byCategory[cat.id].sort((a, b) => {
      if (a.tier === 'free' && b.tier !== 'free') return -1
      if (a.tier !== 'free' && b.tier === 'free') return 1
      return 0
    })
  }

  // Placeholder articles for categories with no published content yet
  const PLACEHOLDERS: Record<string, {title: string, excerpt: string}[]> = {
    hook: [
      { title: "The 3-Second Decision: What Neuroscience Says About Hooks That Stop the Scroll", excerpt: "Your viewer's brain makes a stay-or-leave decision in under 400ms. Here's what it's scanning for." },
    ],
    problem_clarity: [
      { title: "The Pain Precision Framework: How to Name Your Viewer's Problem So Clearly They Feel Seen", excerpt: "Vague pain statements get ignored. Specific ones stop the scroll. Here's how to articulate your viewer's problem better than they can." },
    ],
    offer_clarity: [
      { title: "Why Your Offer Lands Flat on Video — And the One Reframe That Fixes It", excerpt: "The problem is not your offer. It is the sequence your brain presents it in. One structural shift changes everything." },
    ],
    cta: [
      { title: "The CTA Science: Why Most Calls to Action Fail and How to Write One That Converts", excerpt: "The exact structure of a CTA that triggers action — and the common mistakes that make viewers scroll past." },
    ],
    visual_communication: [
      { title: "Frame, Light, Distance: The Camera Setup That Makes You Look Confident Before You Feel It", excerpt: "Your environment is working for you or against you. Here is the exact setup that removes anxiety signals." },
    ],
    platform_fit: [
      { title: "Wrong Platform, Wrong Format: Why Great Videos Fail Before Anyone Watches Them", excerpt: "The best video in the world underperforms on the wrong platform. Here's how to match format to where your audience lives." },
    ],
    measurement_readiness: [
      { title: "Are You Measuring the Right Things? The Video Metrics That Actually Predict Revenue", excerpt: "Views and likes don't pay the bills. Here's the measurement framework that connects video performance to business outcomes." },
    ],
  }

  const totalFree = allArticles.filter(a => a.tier === 'free').length
  const totalMember = allArticles.filter(a => a.tier === 'member').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@400;700;800;900&family=Mulish:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body { background:#0a0e1a; color:#fff; font-family:'Mulish',sans-serif; font-size:15px; line-height:1.7; -webkit-font-smoothing:antialiased; }

        .vc-logo { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:#1a1a1a; flex-shrink:0; position:relative; }
        .vc-logo::before { content:''; position:absolute; inset:2px; border-radius:50%; background:#fff; }
        .vc-logo-inner { position:absolute; inset:4.5px; border-radius:50%; background:radial-gradient(circle at 38% 28%, #6ef5e4 0%, #2ec4b0 40%, #1a9688 100%); z-index:1; }
        .vc-logo-inner::before { content:''; position:absolute; top:15%; left:18%; width:35%; height:28%; border-radius:50%; background:rgba(255,255,255,0.38); filter:blur(0.5px); }
        .vc-logo-play { position:absolute; z-index:2; width:0; height:0; border-style:solid; border-width:4px 0 4px 6.5px; border-color:transparent transparent transparent #1a1a1a; margin-left:1px; }

        .node { display:inline-block; width:12px; height:12px; border-radius:50%; background:radial-gradient(circle at 38% 35%, #5ef0de 0%, #2ec4b0 45%, #1a8a7d 100%); border:2px solid #0a0e1a; box-shadow:0 0 0 1.5px #2ec4b0; flex-shrink:0; position:relative; }
        .node::after { content:''; position:absolute; top:1.5px; left:2px; width:3px; height:3px; border-radius:50%; background:rgba(255,255,255,0.6); }

        .topbar { background:#080c18; border-bottom:1px solid rgba(255,255,255,0.06); padding:14px 48px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
        .topbar-brand { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:15px; color:#fff; letter-spacing:0.04em; text-decoration:none; display:flex; align-items:center; gap:10px; }
        .topbar-brand .vid { color:#2ec4b0; }
        .topbar-brand .tm { font-size:0.5em; vertical-align:super; line-height:0; }
        .topbar-right { display:flex; align-items:center; gap:20px; }
        .topbar-link { font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.35); text-decoration:none; transition:color 0.2s; }
        .topbar-link:hover { color:#2ec4b0; }

        .plan-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:100px; font-size:10px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; }
        .plan-pill.premium { background:rgba(245,197,66,0.15); border:1px solid rgba(245,197,66,0.35); color:#f5c542; }
        .plan-pill.free { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.3); }

        .page-wrap { max-width:1200px; margin:0 auto; padding:0 48px; }

        .gate-banner { background:rgba(46,196,176,0.05); border-bottom:1px solid rgba(46,196,176,0.1); padding:14px 0; }
        .gate-banner-inner { max-width:1200px; margin:0 auto; padding:0 48px; display:flex; align-items:center; justify-content:space-between; gap:24px; }
        .gate-banner-text { font-size:13px; font-weight:700; color:rgba(255,255,255,0.35); }
        .gate-banner-text strong { color:#f5c542; }
        .gate-banner-btn { background:#2ec4b0; color:#0a0e1a; font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; padding:9px 18px; border-radius:6px; text-decoration:none; white-space:nowrap; flex-shrink:0; }

        .card-excerpt { font-size:11px; font-weight:600; color:rgba(255,255,255,0.22); line-height:1.6; margin:0; }
        .card-excerpt.blurred { filter:blur(3px); user-select:none; pointer-events:none; }

        .hero { padding:52px 0 44px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .hero-inner { max-width:1200px; margin:0 auto; padding:0 48px; display:grid; grid-template-columns:1fr auto; align-items:center; gap:48px; }
        .hero-kicker { display:inline-flex; align-items:center; gap:10px; font-size:10px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#2ec4b0; margin-bottom:22px; }
        .hero-title { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(28px,4vw,52px); line-height:1.05; color:#fff; margin-bottom:0; }
        .hero-title .line1 { display:block; color:#fff; }
        .hero-title .line2 { display:block; color:#2ec4b0; }
        .hero-title .line3 { display:block; color:rgba(255,255,255,0.2); font-size:0.6em; letter-spacing:0.04em; margin-top:8px; }
        .hero-stats { display:flex; align-items:center; gap:28px; flex-wrap:wrap; margin-top:28px; }
        .hero-stat-num { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:28px; color:#2ec4b0; line-height:1; margin-bottom:3px; }
        .hero-stat-label { font-size:9px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.18); }
        .stat-div { width:1px; height:30px; background:rgba(255,255,255,0.07); }

        .hero-brain { position:relative; width:260px; height:210px; flex-shrink:0; }
        .hero-brain::before, .hero-brain::after { content:''; position:absolute; inset:-18px; border-radius:55% 45% 50% 50% / 50% 55% 45% 50%; border:1px solid rgba(46,196,176,0.1); animation:brainRing 3.5s ease-in-out infinite; pointer-events:none; }
        .hero-brain::after { inset:-36px; border-color:rgba(0,170,255,0.06); animation-delay:1.8s; }
        .hero-brain svg { width:100%; height:100%; overflow:visible; filter:drop-shadow(0 0 16px rgba(46,196,176,0.55)) drop-shadow(0 0 36px rgba(0,170,255,0.22)); }

        @keyframes brainRing { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.9;transform:scale(1.04)} }
        @keyframes brainNP   { 0%,100%{opacity:.8;r:3.5} 50%{opacity:1;r:5.5} }
        @keyframes brainNS   { 0%,100%{opacity:.55;r:2} 50%{opacity:1;r:3.5} }
        @keyframes brainEF   { from{stroke-dashoffset:0} to{stroke-dashoffset:-55} }
        .bnp { animation:brainNP 2.4s ease-in-out infinite; }
        .bns { animation:brainNS 3.1s ease-in-out infinite; }
        .bef { stroke-dasharray:9 8; animation:brainEF 2s linear infinite; }

        .card-lock { font-size:18px; opacity:0.75; }
        .badge.member { background:rgba(245,197,66,0.1); color:#f5c542; border:1px solid rgba(245,197,66,0.25); }

        .cat-more { display:inline-flex; align-items:center; gap:2px; margin-top:10px; font-size:9px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#2ec4b0; opacity:0.6; }
        .cat-more-chevron:first-child { animation:chevPulse 1.2s ease-in-out infinite; }
        .cat-more-chevron:last-child  { animation:chevPulse 1.2s ease-in-out infinite 0.25s; }
        @keyframes chevPulse { 0%,100%{opacity:.3;transform:translateX(0)} 50%{opacity:1;transform:translateX(3px)} }

        .lib-layout { max-width:1200px; margin:0 auto; padding:0 48px; display:grid; grid-template-columns:200px 1fr; }

        .sidebar { border-right:1px solid rgba(255,255,255,0.05); padding:28px 0; position:sticky; top:57px; height:calc(100vh - 57px); overflow-y:auto; scrollbar-width:none; }
        .sidebar::-webkit-scrollbar { display:none; }
        .sidebar-label { font-size:9px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.15); padding:0 20px 10px; }
        .sidebar-item { display:flex; align-items:center; justify-content:space-between; padding:8px 20px; font-family:'Encode Sans Expanded',sans-serif; font-size:10px; font-weight:900; letter-spacing:0.07em; text-transform:uppercase; color:rgba(255,255,255,0.25); text-decoration:none; transition:color 0.2s, background 0.2s; }
        .sidebar-item:hover { color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.02); }
        .sidebar-count { font-size:9px; font-weight:800; padding:2px 6px; border-radius:100px; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.18); }

        .lib-main { padding:36px 44px 80px; }

        .cat-section { margin-bottom:56px; scroll-margin-top:72px; }
        .cat-header { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
        .cat-name { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.35); }
        .cat-num { font-size:9px; font-weight:800; padding:2px 7px; border-radius:100px; background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.18); }
        .cat-line { flex:1; height:1px; background:rgba(255,255,255,0.04); }
        .cat-empty { font-size:12px; color:rgba(255,255,255,0.1); font-style:italic; padding:16px 0; }

        .article-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }

        .article-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.055); border-radius:10px; padding:18px 16px; display:flex; flex-direction:column; gap:10px; text-decoration:none; transition:border-color 0.2s, transform 0.2s; }
        .article-card:not(.locked):hover { border-color:rgba(46,196,176,0.22); transform:translateY(-2px); }
        .article-card.locked { cursor:default; }

        .card-top { display:flex; align-items:center; justify-content:space-between; }
        .badge { font-size:9px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; padding:2px 8px; border-radius:100px; }
        .badge.free { background:rgba(46,196,176,0.1); color:#2ec4b0; border:1px solid rgba(46,196,176,0.18); }

        .card-title { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:12px; color:#fff; line-height:1.4; flex:1; }
        .article-card.locked .card-title { color:rgba(255,255,255,0.2); }

        .card-footer { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid rgba(255,255,255,0.04); }
        .card-meta { font-size:9px; font-weight:700; color:rgba(255,255,255,0.1); letter-spacing:0.04em; }
        .card-meta.coming-soon { color:rgba(255,255,255,0.18); font-style:italic; }
        .card-arrow { font-size:12px; color:#2ec4b0; opacity:0.3; transition:opacity 0.2s, transform 0.2s; }
        .article-card:not(.locked):hover .card-arrow { opacity:1; transform:translateX(3px); }

        .upgrade-cta { background:rgba(46,196,176,0.04); border:1px solid rgba(46,196,176,0.1); border-radius:14px; padding:32px; display:flex; align-items:center; justify-content:space-between; gap:28px; margin-top:48px; }
        .upgrade-cta h3 { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:17px; color:#fff; margin-bottom:8px; }
        .upgrade-cta p { font-size:13px; color:rgba(255,255,255,0.35); line-height:1.6; max-width:380px; }
        .upgrade-cta strong { color:#f5c542; }
        .upgrade-cta-btn { background:#2ec4b0; color:#0a0e1a; font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; padding:12px 22px; border-radius:8px; text-decoration:none; white-space:nowrap; flex-shrink:0; }

        .lib-footer { background:#080c18; border-top:1px solid rgba(255,255,255,0.05); text-align:center; padding:22px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.14); letter-spacing:0.06em; text-transform:uppercase; }
        .lib-footer a { text-decoration:none; }
        .lib-footer .vid { color:#2ec4b0; }
        .lib-footer .converts { color:#fff; }

        @media (max-width:960px) {
          .gate-banner-inner, .hero-inner, .lib-layout { padding-left:24px; padding-right:24px; }
          .hero-inner { grid-template-columns:1fr; }
          .hero-brain { width:180px; height:148px; margin:0 auto; }
          .lib-layout { grid-template-columns:1fr; }
          .sidebar { display:none; }
          .lib-main { padding:28px 0 60px; }
          .article-grid { grid-template-columns:1fr 1fr; }
          .upgrade-cta { flex-direction:column; align-items:flex-start; }
        }
        @media (max-width:600px) {
          .article-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <a href="/" className="topbar-brand">
          <div className="vc-logo"><div className="vc-logo-inner"></div><div className="vc-logo-play"></div></div>
          <span><span className="vid">Vid</span> Converts<span className="tm">™</span></span>
        </a>
        <div className="topbar-right">
          {isPremium && <div className="plan-pill premium">✦ Premium</div>}
          {!isPremium && <div className="plan-pill free">Free Plan</div>}
          <a href="/dashboard" className="topbar-link">Dashboard</a>
        </div>
      </div>

      {/* GATE BANNER — free users */}
      {!isPremium && (
        <div className="gate-banner">
          <div className="gate-banner-inner">
            <p className="gate-banner-text">
              <strong>Premium</strong> unlocks every article in the library — all categories, no limits, anytime.
            </p>
            <a href="/pricing" className="gate-banner-btn">Upgrade to Premium &rarr;</a>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-kicker">
              <div className="vc-logo"><div className="vc-logo-inner"></div><div className="vc-logo-play"></div></div>
              The Conversion Library
            </div>
            <h1 className="hero-title">
              <span className="line1">Smart Videos</span>
              <span className="line2">Have A Formula.</span>
              <span className="line3">Learn It. Own It. Make It Muscle Memory.</span>
            </h1>
            <div className="hero-stats">
              <div><div className="hero-stat-num">{allArticles.length}</div><div className="hero-stat-label">Published</div></div>
              <div className="stat-div"></div>
              <div><div className="hero-stat-num">{totalFree}</div><div className="hero-stat-label">Free to read</div></div>
              <div className="stat-div"></div>
              <div><div className="hero-stat-num">{totalMember}</div><div className="hero-stat-label">Premium exclusive</div></div>
              <div className="stat-div"></div>
              <div><div className="hero-stat-num">9</div><div className="hero-stat-label">Categories</div></div>
            </div>
          </div>
          <div className="hero-brain">
            <svg viewBox="0 0 260 210" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="libEg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2ec4b0"/>
                  <stop offset="40%" stopColor="#00aaff"/>
                  <stop offset="100%" stopColor="#a050ff"/>
                </linearGradient>
                <radialGradient id="libBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2ec4b0" stopOpacity="0.07"/>
                  <stop offset="100%" stopColor="#0a0e1a" stopOpacity="0"/>
                </radialGradient>
                <filter id="libGlow">
                  <feGaussianBlur stdDeviation="2.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="libGlowS">
                  <feGaussianBlur stdDeviation="5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <ellipse cx="130" cy="110" rx="110" ry="90" fill="url(#libBg)"/>
              <path d="M 104 182 C 96 182, 84 177, 78 169 C 66 153, 69 133, 64 119 C 58 102, 46 88, 52 67 C 57 48, 78 35, 98 32 C 109 29, 118 35, 127 29 C 138 22, 156 17, 170 23 C 187 30, 199 47, 201 64 C 204 78, 195 90, 198 105 C 201 120, 213 129, 211 145 C 208 162, 193 173, 178 176 C 170 178, 164 173, 158 176 C 152 179, 150 188, 141 191 C 132 194, 123 194, 115 191 C 110 189, 104 182, 104 182 Z" fill="none" stroke="url(#libEg)" strokeWidth="2" opacity="0.65" filter="url(#libGlow)"/>
              <path d="M 158 176 C 164 170, 176 164, 188 164 C 200 164, 211 170, 213 181 C 215 190, 207 198, 196 198 C 184 198, 173 192, 164 186 C 161 183, 158 179, 158 176 Z" fill="none" stroke="url(#libEg)" strokeWidth="1.8" opacity="0.5" filter="url(#libGlow)"/>
              <path d="M 127 188 C 127 197, 130 205, 132 209 C 134 205, 137 197, 137 188" fill="none" stroke="#2ec4b0" strokeWidth="1.8" opacity="0.45" filter="url(#libGlow)"/>
              <path d="M 129 32 C 123 52, 121 76, 127 96" fill="none" stroke="#00aaff" strokeWidth="1.2" opacity="0.35" strokeDasharray="3 4"/>
              <path d="M 78 116 C 98 107, 121 104, 144 107 C 165 110, 179 116, 191 124" fill="none" stroke="#2ec4b0" strokeWidth="1.2" opacity="0.35" strokeDasharray="3 4"/>
              <path d="M 181 64 C 190 79, 193 94, 188 111" fill="none" stroke="#a050ff" strokeWidth="1" opacity="0.3" strokeDasharray="3 4"/>
              <g stroke="url(#libEg)" strokeWidth="0.9" opacity="0.48" fill="none" filter="url(#libGlow)">
                <line x1="98" y1="46" x2="118" y2="64"/><line x1="118" y1="64" x2="104" y2="84"/><line x1="104" y1="84" x2="80" y2="96"/><line x1="118" y1="64" x2="136" y2="72"/>
                <line x1="136" y1="72" x2="156" y2="62"/><line x1="156" y1="62" x2="170" y2="76"/><line x1="170" y1="76" x2="184" y2="92"/><line x1="136" y1="72" x2="144" y2="90"/>
                <line x1="144" y1="90" x2="158" y2="96"/><line x1="158" y1="96" x2="184" y2="92"/><line x1="144" y1="90" x2="144" y2="112"/><line x1="144" y1="112" x2="158" y2="120"/>
                <line x1="158" y1="120" x2="184" y2="92"/><line x1="80" y1="96" x2="96" y2="116"/><line x1="96" y1="116" x2="120" y2="120"/><line x1="120" y1="120" x2="144" y2="112"/>
                <line x1="120" y1="120" x2="132" y2="140"/><line x1="132" y1="140" x2="158" y2="120"/><line x1="104" y1="84" x2="96" y2="116"/><line x1="136" y1="72" x2="120" y2="120"/>
                <line x1="132" y1="140" x2="118" y2="156"/><line x1="118" y1="156" x2="132" y2="168"/><line x1="132" y1="168" x2="158" y2="156"/><line x1="158" y1="156" x2="170" y2="140"/>
                <line x1="170" y1="140" x2="158" y2="120"/><line x1="132" y1="168" x2="128" y2="182"/><line x1="158" y1="156" x2="178" y2="160"/><line x1="178" y1="160" x2="188" y2="148"/>
                <line x1="188" y1="148" x2="184" y2="92"/>
              </g>
              <g fill="none" filter="url(#libGlow)">
                <line className="bef" x1="98" y1="46" x2="184" y2="92" stroke="#2ec4b0" strokeWidth="1.4" opacity="0.65"/>
                <line className="bef" x1="80" y1="96" x2="184" y2="92" stroke="#00aaff" strokeWidth="1.3" opacity="0.55" style={{animationDelay:'0.8s'}}/>
                <line className="bef" x1="96" y1="116" x2="188" y2="148" stroke="#a050ff" strokeWidth="1.1" opacity="0.5" style={{animationDelay:'1.4s'}}/>
                <line className="bef" x1="118" y1="156" x2="188" y2="148" stroke="#2ec4b0" strokeWidth="1.1" opacity="0.5" style={{animationDelay:'0.4s'}}/>
                <line className="bef" x1="132" y1="140" x2="170" y2="140" stroke="#00aaff" strokeWidth="1" opacity="0.45" style={{animationDelay:'1.0s'}}/>
              </g>
              <g filter="url(#libGlowS)">
                <circle className="bnp" cx="136" cy="72" r="4" fill="#2ec4b0" style={{animationDelay:'0s'}}/>
                <circle className="bnp" cx="144" cy="90" r="3.5" fill="#2ec4b0" style={{animationDelay:'0.5s'}}/>
                <circle className="bnp" cx="120" cy="120" r="4" fill="#2ec4b0" style={{animationDelay:'1s'}}/>
                <circle className="bnp" cx="132" cy="140" r="3.5" fill="#2ec4b0" style={{animationDelay:'1.5s'}}/>
                <circle className="bns" cx="98" cy="46" r="3" fill="#00aaff" style={{animationDelay:'0.2s'}}/>
                <circle className="bns" cx="118" cy="64" r="2.5" fill="#00ccee" style={{animationDelay:'0.7s'}}/>
                <circle className="bns" cx="156" cy="62" r="3" fill="#00aaff" style={{animationDelay:'1.1s'}}/>
                <circle className="bns" cx="170" cy="76" r="2.5" fill="#00ccee" style={{animationDelay:'0.4s'}}/>
                <circle className="bns" cx="184" cy="92" r="3" fill="#00aaff" style={{animationDelay:'0.9s'}}/>
                <circle className="bns" cx="158" cy="96" r="2.5" fill="#00aaff" style={{animationDelay:'1.3s'}}/>
                <circle className="bns" cx="80" cy="96" r="2.5" fill="#5090ff" style={{animationDelay:'0.6s'}}/>
                <circle className="bns" cx="104" cy="84" r="2.5" fill="#5090ff" style={{animationDelay:'1.6s'}}/>
                <circle className="bns" cx="96" cy="116" r="2.5" fill="#00aaff" style={{animationDelay:'0.3s'}}/>
                <circle className="bns" cx="144" cy="112" r="2.5" fill="#00aaff" style={{animationDelay:'1.8s'}}/>
                <circle className="bns" cx="158" cy="120" r="2.5" fill="#00ccee" style={{animationDelay:'0.8s'}}/>
                <circle className="bns" cx="188" cy="148" r="2.5" fill="#00aaff" style={{animationDelay:'1.2s'}}/>
                <circle className="bns" cx="118" cy="156" r="2.5" fill="#a050ff" style={{animationDelay:'0.5s'}}/>
                <circle className="bns" cx="158" cy="156" r="2.5" fill="#a050ff" style={{animationDelay:'1.0s'}}/>
                <circle className="bns" cx="170" cy="140" r="2.5" fill="#a050ff" style={{animationDelay:'1.7s'}}/>
                <circle className="bns" cx="132" cy="168" r="2.5" fill="#a050ff" style={{animationDelay:'0.2s'}}/>
                <circle className="bns" cx="178" cy="160" r="2" fill="#00aaff" style={{animationDelay:'1.4s'}}/>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="lib-layout">
        <nav className="sidebar">
          <div className="sidebar-label">Jump to</div>
          {CATEGORIES.map(cat => (
            <a key={cat.id} href={`#${cat.id}`} className="sidebar-item">
              {cat.label}
              <span className="sidebar-count">{byCategory[cat.id]?.length ?? 0}</span>
            </a>
          ))}
        </nav>

        <main className="lib-main">
          {CATEGORIES.map(cat => {
            const catArticles = byCategory[cat.id] || []
            return (
              <section key={cat.id} id={cat.id} className="cat-section">
                <div className="cat-header">
                  <span className="cat-name">{cat.label}</span>
                  <span className="cat-num">{catArticles.length}</span>
                  <div className="cat-line"></div>
                </div>

                {catArticles.length === 0 ? (
                  <div className="article-grid">
                    {(PLACEHOLDERS[cat.id] || []).map((ph, i) => (
                      <div key={i} className="article-card locked">
                        <div className="card-top">
                          <span className="badge member">⭐ Premium</span>
                          <span className="card-lock">🔒</span>
                        </div>
                        <div className="card-title">{ph.title}</div>
                        <p className="card-excerpt blurred">{ph.excerpt}</p>
                        <div className="card-footer">
                          <span className="card-meta coming-soon">Coming soon</span>
                        </div>
                      </div>
                    ))}
                    {(!PLACEHOLDERS[cat.id] || PLACEHOLDERS[cat.id].length === 0) && (
                      <p className="cat-empty">Articles coming soon.</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="article-grid">
                      {catArticles.map(article => {
                        const isAccessible = article.tier === 'free' || isPremium
                        const publishDate = article.published_at
                          ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : ''
                        const meta = [article.read_minutes ? `${article.read_minutes} min` : '', publishDate].filter(Boolean).join(' · ')

                        return isAccessible ? (
                          <a key={article.id} href={`/blog/${article.slug}`} className="article-card">
                            <div className="card-top">
                              <span className={`badge ${article.tier}`}>{article.tier === 'free' ? 'Free' : 'Premium'}</span>
                            </div>
                            <div className="card-title">{article.title}</div>
                            {article.excerpt && <p className="card-excerpt">{article.excerpt}</p>}
                            <div className="card-footer">
                              <span className="card-meta">{meta}</span>
                              <span className="card-arrow">&rarr;</span>
                            </div>
                          </a>
                        ) : (
                          <div key={article.id} className="article-card locked">
                            <div className="card-top">
                              <span className="badge member">⭐ Premium</span>
                              <span className="card-lock">🔒</span>
                            </div>
                            <div className="card-title">{article.title}</div>
                            {article.excerpt && <p className="card-excerpt blurred">{article.excerpt}</p>}
                            <div className="card-footer"><span className="card-meta">{meta}</span></div>
                          </div>
                        )
                      })}
                    </div>
                    {catArticles.length >= 3 && (
                      <div className="cat-more">
                        more
                        <span className="cat-more-chevron">›</span>
                        <span className="cat-more-chevron">›</span>
                      </div>
                    )}
                  </>
                )}
              </section>
            )
          })}

          {!isPremium && (
            <div className="upgrade-cta">
              <div>
                <h3>Unlock the Full Library</h3>
                <p><strong>Premium</strong> members get unrestricted access to every article — all 9 categories, all depths, anytime. Plus 2 articles per rubric finding in every report.</p>
              </div>
              <a href="/pricing" className="upgrade-cta-btn">Upgrade to Premium &rarr;</a>
            </div>
          )}
        </main>
      </div>

      <div className="lib-footer">
        &copy; 2026 <a href="https://www.vidconverts.com"><span className="vid">Vid</span><span className="converts"> Converts</span>&trade;</a> by Digital Nuclei &nbsp;&middot;&nbsp; All rights reserved
      </div>
    </>
  )
}
