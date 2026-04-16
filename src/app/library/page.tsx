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

  const { data: articles } = await supabase
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
        .plan-pill.premium { background:rgba(46,196,176,0.12); border:1px solid rgba(46,196,176,0.25); color:#2ec4b0; }
        .plan-pill.free { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.3); }

        .page-wrap { max-width:1200px; margin:0 auto; padding:0 48px; }

        .gate-banner { background:rgba(46,196,176,0.05); border-bottom:1px solid rgba(46,196,176,0.1); padding:14px 0; }
        .gate-banner-inner { max-width:1200px; margin:0 auto; padding:0 48px; display:flex; align-items:center; justify-content:space-between; gap:24px; }
        .gate-banner-text { font-size:13px; font-weight:700; color:rgba(255,255,255,0.35); }
        .gate-banner-text strong { color:#2ec4b0; }
        .gate-banner-btn { background:#2ec4b0; color:#0a0e1a; font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; padding:9px 18px; border-radius:6px; text-decoration:none; white-space:nowrap; flex-shrink:0; }

        .hero { padding:52px 0 44px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .hero-inner { max-width:1200px; margin:0 auto; padding:0 48px; }
        .hero-kicker { display:inline-flex; align-items:center; gap:8px; font-size:10px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#2ec4b0; margin-bottom:14px; }
        .hero-title { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(34px,5vw,58px); line-height:1.0; color:#fff; margin-bottom:14px; }
        .hero-title span { color:#2ec4b0; }
        .hero-desc { font-size:15px; font-weight:600; color:rgba(255,255,255,0.38); max-width:500px; line-height:1.7; margin-bottom:32px; }
        .hero-stats { display:flex; align-items:center; gap:36px; flex-wrap:wrap; }
        .hero-stat-num { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:30px; color:#2ec4b0; line-height:1; margin-bottom:4px; }
        .hero-stat-label { font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.18); }
        .stat-div { width:1px; height:32px; background:rgba(255,255,255,0.06); }

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
        .badge.member { background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.07); }
        .card-lock { font-size:11px; opacity:0.18; }

        .card-title { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:12px; color:#fff; line-height:1.4; flex:1; }
        .article-card.locked .card-title { color:rgba(255,255,255,0.2); }

        .card-excerpt { font-size:11px; font-weight:600; color:rgba(255,255,255,0.22); line-height:1.6; margin:0; }
        .article-card.locked .card-excerpt { filter:blur(3px); user-select:none; pointer-events:none; }

        .card-footer { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid rgba(255,255,255,0.04); }
        .card-meta { font-size:9px; font-weight:700; color:rgba(255,255,255,0.1); letter-spacing:0.04em; }
        .card-arrow { font-size:12px; color:#2ec4b0; opacity:0.3; transition:opacity 0.2s, transform 0.2s; }
        .article-card:not(.locked):hover .card-arrow { opacity:1; transform:translateX(3px); }

        .upgrade-cta { background:rgba(46,196,176,0.04); border:1px solid rgba(46,196,176,0.1); border-radius:14px; padding:32px; display:flex; align-items:center; justify-content:space-between; gap:28px; margin-top:48px; }
        .upgrade-cta h3 { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:17px; color:#fff; margin-bottom:8px; }
        .upgrade-cta p { font-size:13px; color:rgba(255,255,255,0.35); line-height:1.6; max-width:380px; }
        .upgrade-cta strong { color:#2ec4b0; }
        .upgrade-cta-btn { background:#2ec4b0; color:#0a0e1a; font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; padding:12px 22px; border-radius:8px; text-decoration:none; white-space:nowrap; flex-shrink:0; }

        .lib-footer { background:#080c18; border-top:1px solid rgba(255,255,255,0.05); text-align:center; padding:22px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.14); letter-spacing:0.06em; text-transform:uppercase; }
        .lib-footer a { text-decoration:none; }
        .lib-footer .vid { color:#2ec4b0; }
        .lib-footer .converts { color:#fff; }

        @media (max-width:960px) {
          .gate-banner-inner, .hero-inner, .lib-layout { padding-left:24px; padding-right:24px; }
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
          <div className="hero-kicker"><div className="node"></div> The Conversion Library</div>
          <h1 className="hero-title">Every Article.<br /><span>One Place.</span></h1>
          <p className="hero-desc">Psychology, neuroscience, and field-tested strategy — organised by the 8 rubric categories that determine whether your video converts.</p>
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
                  <p className="cat-empty">Articles coming soon.</p>
                ) : (
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
                            <span className="badge member">Premium</span>
                            <span className="card-lock">🔒</span>
                          </div>
                          <div className="card-title">{article.title}</div>
                          {article.excerpt && <p className="card-excerpt">{article.excerpt}</p>}
                          <div className="card-footer"><span className="card-meta">{meta}</span></div>
                        </div>
                      )
                    })}
                  </div>
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
