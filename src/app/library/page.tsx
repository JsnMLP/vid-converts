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

  // Get user + plan
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
  const isPaid = isPremium || isComplete

  // Fetch all published articles the user can access
  // Free articles: everyone
  // Member articles: only paid plans (RLS handles this)
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, tier, rubric_category, read_minutes, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // Group by category
  const byCategory: Record<string, Article[]> = {}
  for (const cat of CATEGORIES) {
    byCategory[cat.id] = []
  }
  for (const article of (articles || [])) {
    if (byCategory[article.rubric_category]) {
      byCategory[article.rubric_category].push(article as Article)
    }
  }

  // Count totals
  const totalArticles = articles?.length ?? 0
  const memberArticles = articles?.filter(a => a.tier === 'member').length ?? 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@400;700;800;900&family=Mulish:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #0d1117;
          color: #fff;
          font-family: 'Mulish', sans-serif;
          font-size: 16px;
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
        }

        /* ── VC Logo ── */
        .vc-logo {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 50%;
          background: #1a1a1a; flex-shrink: 0; position: relative;
        }
        .vc-logo::before {
          content: ''; position: absolute; inset: 2px;
          border-radius: 50%; background: #fff;
        }
        .vc-logo-inner {
          position: absolute; inset: 5px; border-radius: 50%;
          background: radial-gradient(circle at 38% 28%, #6ef5e4 0%, #2ec4b0 40%, #1a9688 100%);
          z-index: 1;
        }
        .vc-logo-inner::before {
          content: ''; position: absolute; top: 15%; left: 18%;
          width: 35%; height: 28%; border-radius: 50%;
          background: rgba(255,255,255,0.38); filter: blur(1px);
        }
        .vc-logo-play {
          position: absolute; z-index: 2; width: 0; height: 0;
          border-style: solid; border-width: 4.5px 0 4.5px 7.5px;
          border-color: transparent transparent transparent #1a1a1a;
          margin-left: 1.5px;
        }

        /* ── Node ── */
        .node {
          display: inline-block; width: 14px; height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 35%, #5ef0de 0%, #2ec4b0 45%, #1a8a7d 100%);
          border: 2px solid #1a1a1a;
          box-shadow: 0 0 0 2px #2ec4b0, inset 0 1px 3px rgba(255,255,255,0.35);
          flex-shrink: 0; position: relative;
        }
        .node::after {
          content: ''; position: absolute; top: 2px; left: 2px;
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(255,255,255,0.6);
        }

        /* ── Topbar ── */
        .topbar {
          background: #111;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 14px 48px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
        }
        .topbar-brand {
          font-family: 'Encode Sans Expanded', sans-serif;
          font-weight: 900; font-size: 15px; color: #fff;
          letter-spacing: 0.04em; text-decoration: none;
          display: flex; align-items: center; gap: 10px;
        }
        .topbar-brand .vid { color: #2ec4b0; }
        .topbar-brand .tm { font-size: 0.55em; vertical-align: super; line-height: 0; }
        .topbar-right {
          display: flex; align-items: center; gap: 24px;
        }
        .topbar-link {
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.4);
          text-decoration: none; transition: color 0.2s;
        }
        .topbar-link:hover { color: #2ec4b0; }
        .topbar-btn {
          background: #2ec4b0; color: #1a1a1a;
          font-family: 'Encode Sans Expanded', sans-serif;
          font-weight: 900; font-size: 12px; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 8px 18px;
          border-radius: 6px; text-decoration: none;
        }

        /* ── Hero ── */
        .library-hero {
          background: #111;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 56px 48px 48px;
        }
        .hero-kicker {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #2ec4b0; margin-bottom: 16px;
        }
        .hero-title {
          font-family: 'Encode Sans Expanded', sans-serif;
          font-weight: 900; font-size: clamp(32px, 4vw, 52px);
          color: #fff; line-height: 1.05; margin-bottom: 16px;
        }
        .hero-title span { color: #2ec4b0; }
        .hero-desc {
          font-size: 16px; font-weight: 600;
          color: rgba(255,255,255,0.45); max-width: 560px; line-height: 1.7;
          margin-bottom: 32px;
        }
        .hero-stats {
          display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
        }
        .hero-stat {
          display: flex; flex-direction: column; gap: 2px;
        }
        .hero-stat-num {
          font-family: 'Encode Sans Expanded', sans-serif;
          font-weight: 900; font-size: 28px; color: #2ec4b0; line-height: 1;
        }
        .hero-stat-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
        }
        .hero-stat-divider {
          width: 1px; height: 40px; background: rgba(255,255,255,0.08);
        }

        /* ── Plan badge ── */
        .plan-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 800; letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .plan-badge.premium {
          background: rgba(46,196,176,0.12);
          border: 1px solid rgba(46,196,176,0.25);
          color: #2ec4b0;
        }
        .plan-badge.complete {
          background: rgba(46,196,176,0.08);
          border: 1px solid rgba(46,196,176,0.15);
          color: rgba(46,196,176,0.8);
        }
        .plan-badge.free {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.35);
        }

        /* ── Upgrade banner (Complete members) ── */
        .upgrade-banner {
          background: rgba(46,196,176,0.06);
          border-bottom: 1px solid rgba(46,196,176,0.12);
          padding: 14px 48px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
        }
        .upgrade-banner p {
          font-size: 13px; font-weight: 700;
          color: rgba(255,255,255,0.4); margin: 0;
        }
        .upgrade-banner strong { color: #2ec4b0; }
        .upgrade-banner-btn {
          display: inline-block; background: #2ec4b0; color: #1a1a1a;
          font-family: 'Encode Sans Expanded', sans-serif; font-weight: 900;
          font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 9px 18px; border-radius: 6px; text-decoration: none;
          white-space: nowrap; flex-shrink: 0;
        }

        /* ── Gate banner (free users) ── */
        .gate-banner {
          background: #111;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 20px 48px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
        }
        .gate-banner p {
          font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.35); margin: 0;
        }
        .gate-banner strong { color: #2ec4b0; }
        .gate-banner-btn {
          display: inline-block; background: #2ec4b0; color: #1a1a1a;
          font-family: 'Encode Sans Expanded', sans-serif; font-weight: 900;
          font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 10px 20px; border-radius: 6px; text-decoration: none;
          white-space: nowrap; flex-shrink: 0;
        }

        /* ── Main layout ── */
        .library-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 48px 80px;
        }

        /* ── Category section ── */
        .cat-section {
          margin-bottom: 56px;
        }
        .cat-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 20px; padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cat-label {
          font-family: 'Encode Sans Expanded', sans-serif;
          font-weight: 900; font-size: 13px; letter-spacing: 0.1em;
          text-transform: uppercase; color: #fff;
        }
        .cat-count {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.25);
          font-size: 10px; font-weight: 800;
          padding: 3px 8px; border-radius: 100px; line-height: 1.4;
        }
        .cat-empty {
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.15); font-style: italic;
          padding: 20px 0;
        }

        /* ── Article grid ── */
        .article-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        /* ── Article card ── */
        .article-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 22px 20px;
          display: flex; flex-direction: column; gap: 12px;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.2s;
        }
        .article-card:hover {
          border-color: rgba(46,196,176,0.3);
          transform: translateY(-2px);
        }
        .article-card.locked { cursor: default; }
        .article-card.locked:hover { transform: none; border-color: rgba(255,255,255,0.07); }

        .card-top {
          display: flex; align-items: center; justify-content: space-between;
        }
        .card-badge {
          font-size: 9px; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 3px 9px; border-radius: 100px;
        }
        .card-badge.free {
          background: rgba(46,196,176,0.12); color: #2ec4b0;
          border: 1px solid rgba(46,196,176,0.22);
        }
        .card-badge.member {
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.25);
          border: 1px solid rgba(255,255,255,0.09);
        }
        .card-lock { font-size: 13px; opacity: 0.25; }

        .card-title {
          font-family: 'Encode Sans Expanded', sans-serif;
          font-weight: 900; font-size: 13px; color: #fff;
          line-height: 1.35; flex: 1;
        }
        .article-card.locked .card-title { color: rgba(255,255,255,0.28); }

        .card-excerpt {
          font-size: 12px; font-weight: 600;
          color: rgba(255,255,255,0.3); line-height: 1.65; margin: 0;
        }
        .article-card.locked .card-excerpt {
          filter: blur(3.5px); user-select: none; pointer-events: none;
        }

        .card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);
        }
        .card-meta {
          font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,0.16); letter-spacing: 0.04em;
        }
        .card-arrow {
          font-size: 13px; color: #2ec4b0; opacity: 0.45;
          transition: opacity 0.2s, transform 0.2s;
        }
        .article-card:not(.locked):hover .card-arrow {
          opacity: 1; transform: translateX(3px);
        }

        /* ── Footer ── */
        .lib-footer {
          background: #111;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center; padding: 24px 32px;
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .lib-footer a { text-decoration: none; }
        .lib-footer .vid { color: #2ec4b0; }
        .lib-footer .converts { color: #fff; }

        @media (max-width: 960px) {
          .topbar { padding: 14px 24px; }
          .library-hero { padding: 40px 24px 36px; }
          .upgrade-banner, .gate-banner { padding: 14px 24px; }
          .library-body { padding: 36px 24px 64px; }
          .article-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .article-grid { grid-template-columns: 1fr; }
          .hero-stats { gap: 20px; }
        }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <a href="/" className="topbar-brand">
          <div className="vc-logo">
            <div className="vc-logo-inner"></div>
            <div className="vc-logo-play"></div>
          </div>
          <span><span className="vid">Vid</span> Converts<span className="tm">™</span></span>
        </a>
        <div className="topbar-right">
          <a href="/dashboard" className="topbar-link">Dashboard</a>
          <a href="/pricing" className="topbar-link">Pricing</a>
          {!user && <a href="/" className="topbar-btn">Sign In</a>}
        </div>
      </div>

      {/* UPGRADE BANNER — Complete members only */}
      {isComplete && (
        <div className="upgrade-banner">
          <p>
            You&apos;re on the <strong>Complete Plan</strong>. Upgrade to <strong>Premium</strong> for full library access — every article, every category, anytime.
          </p>
          <a href="/pricing" className="upgrade-banner-btn">Upgrade to Premium →</a>
        </div>
      )}

      {/* GATE BANNER — Free users */}
      {!isPaid && (
        <div className="gate-banner">
          <p>
            <strong>Complete and Premium</strong> plan members get access to the full article library. You&apos;re currently on the free plan.
          </p>
          <a href="/pricing" className="gate-banner-btn">See Plans →</a>
        </div>
      )}

      {/* HERO */}
      <div className="library-hero">
        <div className="hero-kicker">
          <div className="node"></div>
          The Conversion Library
        </div>
        <h1 className="hero-title">
          Every Article.<br />
          <span>One Place.</span>
        </h1>
        <p className="hero-desc">
          Psychology, neuroscience, and field-tested strategy — organised by the 8 rubric categories that determine whether your video converts.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">{totalArticles}</div>
            <div className="hero-stat-label">Articles published</div>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat">
            <div className="hero-stat-num">9</div>
            <div className="hero-stat-label">Categories covered</div>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat">
            <div className="hero-stat-num">100%</div>
            <div className="hero-stat-label">Research-backed</div>
          </div>
          {isPremium && (
            <>
              <div className="hero-stat-divider"></div>
              <div className="plan-badge premium">✦ Premium — Full Access</div>
            </>
          )}
          {isComplete && (
            <>
              <div className="hero-stat-divider"></div>
              <div className="plan-badge complete">Complete Plan</div>
            </>
          )}
          {!isPaid && (
            <>
              <div className="hero-stat-divider"></div>
              <div className="plan-badge free">Free Plan</div>
            </>
          )}
        </div>
      </div>

      {/* LIBRARY BODY */}
      <div className="library-body">
        {CATEGORIES.map(cat => {
          const catArticles = byCategory[cat.id] || []

          return (
            <div key={cat.id} className="cat-section">
              <div className="cat-header">
                <span className="cat-label">{cat.label}</span>
                <span className="cat-count">{catArticles.length}</span>
              </div>

              {catArticles.length === 0 ? (
                <p className="cat-empty">Articles coming soon.</p>
              ) : (
                <div className="article-grid">
                  {catArticles.map(article => {
                    const isAccessible = article.tier === 'free' || isPremium
                    const publishDate = article.published_at
                      ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'Coming soon'

                    return isAccessible ? (
                      <a
                        key={article.id}
                        href={`/blog/${article.slug}`}
                        className="article-card"
                      >
                        <div className="card-top">
                          <span className={`card-badge ${article.tier}`}>
                            {article.tier === 'free' ? 'Free' : 'Member'}
                          </span>
                        </div>
                        <div className="card-title">{article.title}</div>
                        {article.excerpt && (
                          <p className="card-excerpt">{article.excerpt}</p>
                        )}
                        <div className="card-footer">
                          <span className="card-meta">{article.read_minutes ? `${article.read_minutes} min` : ''}{article.read_minutes && ' · '}{publishDate}</span>
                          <span className="card-arrow">→</span>
                        </div>
                      </a>
                    ) : (
                      <div key={article.id} className="article-card locked">
                        <div className="card-top">
                          <span className="card-badge member">
                            {isComplete ? 'Complete · See in Reports' : 'Premium'}
                          </span>
                          <span className="card-lock">🔒</span>
                        </div>
                        <div className="card-title">{article.title}</div>
                        {article.excerpt && (
                          <p className="card-excerpt">{article.excerpt}</p>
                        )}
                        <div className="card-footer">
                          <span className="card-meta">{article.read_minutes ? `${article.read_minutes} min` : ''}{article.read_minutes && ' · '}{publishDate}</span>
                          <span className="card-arrow">→</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* FOOTER */}
      <div className="lib-footer">
        © 2026{' '}
        <a href="https://www.vidconverts.com">
          <span className="vid">Vid</span>
          <span className="converts"> Converts</span>™
        </a>
        {' '}by Digital Nuclei &nbsp;·&nbsp; All rights reserved
      </div>
    </>
  )
}
