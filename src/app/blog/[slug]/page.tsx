import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'

// ─── Types ───────────────────────────────────────────────────
interface Article {
  id: string
  slug: string
  title: string
  subtitle: string | null
  tier: 'free' | 'member'
  rubric_category: string
  body_html: string | null
  excerpt: string | null
  read_minutes: number | null
  published_at: string | null
  series_id: string | null
  series_position: number | null
}

interface PageProps {
  params: { slug: string }
}

// ─── Metadata ────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies })

  const { data: article } = await supabase
    .from('articles')
    .select('title, subtitle, excerpt')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!article) {
    return { title: 'Article Not Found · Vid Converts™' }
  }

  return {
    title: `${article.title} · Vid Converts™`,
    description: article.excerpt ?? article.subtitle ?? undefined,
  }
}

// ─── Page ────────────────────────────────────────────────────
export default async function BlogArticlePage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  // 1. Get current user + subscription
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

  // 2. Fetch the article — RLS handles access control at DB level
  //    Free articles: returned for anyone
  //    Member articles: only returned if user has active complete/premium plan
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  // 3. Article not found
  if (error || !article) {
    // Check if it exists at all (regardless of tier) to show the right gate
    const { data: exists } = await supabase
      .from('articles')
      .select('tier, title, excerpt, rubric_category')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .maybeSingle()

    // If it exists but wasn't returned, it's a member article the user can't access
    if (exists) {
      return <ArticleGate article={exists} userPlan={userPlan} />
    }

    notFound()
  }

  // 4. Fetch paired series article if exists
  let pairedArticle: Partial<Article> | null = null
  if (article.series_id) {
    const { data: paired } = await supabase
      .from('articles')
      .select('slug, title, excerpt, tier, series_position, read_minutes')
      .eq('series_id', article.series_id)
      .neq('id', article.id)
      .eq('status', 'published')
      .single()
    pairedArticle = paired
  }

  return <ArticleLayout article={article} pairedArticle={pairedArticle} userPlan={userPlan} />
}

// ─── Gate Component (member article, user not subscribed) ────
function ArticleGate({
  article,
  userPlan,
}: {
  article: { tier: string; title: string; excerpt: string | null; rubric_category: string }
  userPlan: string | null
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'Mulish', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@700;900&family=Mulish:wght@400;600;700;800&display=swap');
      `}</style>

      <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        {/* Lock icon */}
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: 'rgba(46,196,176,0.1)',
          border: '1px solid rgba(46,196,176,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '28px',
        }}>🔒</div>

        {/* Category pill */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(46,196,176,0.1)',
          border: '1px solid rgba(46,196,176,0.2)',
          color: '#2ec4b0',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding: '4px 12px',
          borderRadius: '100px',
          marginBottom: '20px',
        }}>
          {article.rubric_category} · Complete + Premium
        </div>

        <h1 style={{
          fontFamily: "'Encode Sans Expanded', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(20px, 4vw, 28px)',
          color: '#ffffff',
          lineHeight: 1.2,
          marginBottom: '16px',
        }}>
          {article.title}
        </h1>

        {article.excerpt && (
          <p style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.7,
            marginBottom: '32px',
            filter: 'blur(3px)',
            userSelect: 'none',
          }}>
            {article.excerpt}
          </p>
        )}

        <p style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          marginBottom: '24px',
          lineHeight: 1.6,
        }}>
          This article is available to <strong style={{ color: '#2ec4b0' }}>Complete and Premium</strong> plan members.
          {!userPlan && ' Create a free account or upgrade to access the full library.'}
        </p>

        <a
          href="/pricing"
          style={{
            display: 'inline-block',
            background: '#2ec4b0',
            color: '#1a1a1a',
            fontFamily: "'Encode Sans Expanded', sans-serif",
            fontWeight: 900,
            fontSize: '13px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '14px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          See Plans →
        </a>

        <div style={{ marginTop: '20px' }}>
          <a
            href="/"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.2)',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Full Article Layout ─────────────────────────────────────
function ArticleLayout({
  article,
  pairedArticle,
  userPlan,
}: {
  article: Article
  pairedArticle: Partial<Article> | null
  userPlan: string | null
}) {
  const isPremium = userPlan === 'premium'
  const isComplete = userPlan === 'complete'
  const isPaid = isPremium || isComplete

  // Format date
  const publishDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'April 2026'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@400;700;800;900&family=Mulish:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #1a1a1a;
          --paper: #f5f5f5;
          --teal: #2ec4b0;
          --teal-dark: #1fa898;
          --teal-light: #e0f7f4;
          --rule: #e0e0e0;
          --muted: #666666;
          --font-display: 'Encode Sans Expanded', sans-serif;
          --font-body: 'Mulish', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 17px;
          line-height: 1.75;
          -webkit-font-smoothing: antialiased;
        }

        .node {
          display: inline-block;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 35%, #5ef0de 0%, #2ec4b0 45%, #1a8a7d 100%);
          border: 3px solid #1a1a1a;
          box-shadow: 0 0 0 2px var(--teal), inset 0 1px 3px rgba(255,255,255,0.4);
          vertical-align: middle;
          flex-shrink: 0;
          position: relative;
        }
        .node::after {
          content: '';
          position: absolute;
          top: 2px; left: 3px;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.55);
        }

        .topbar {
          background: var(--ink);
          padding: 14px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .topbar-brand {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 15px;
          color: #fff;
          letter-spacing: 0.04em;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .topbar-brand .vid { color: var(--teal); }
        .topbar-brand .tm { font-size: 0.55em; vertical-align: super; line-height: 0; }
        .topbar-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }

        /* VC Logo */
        .vc-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: #1a1a1a;
          flex-shrink: 0;
          position: relative;
        }
        .vc-logo::before {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: #fff;
        }
        .vc-logo-inner {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 28%, #6ef5e4 0%, #2ec4b0 40%, #1a9688 100%);
          z-index: 1;
        }
        .vc-logo-inner::before {
          content: '';
          position: absolute;
          top: 15%; left: 18%;
          width: 35%; height: 28%;
          border-radius: 50%;
          background: rgba(255,255,255,0.38);
          filter: blur(1px);
        }
        .vc-logo-play {
          position: absolute;
          z-index: 2;
          width: 0; height: 0;
          border-style: solid;
          border-width: 4.5px 0 4.5px 7.5px;
          border-color: transparent transparent transparent #1a1a1a;
          margin-left: 1.5px;
        }

        .hero {
          background: var(--ink);
          padding: 60px 32px 68px;
          text-align: center;
        }
        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--teal);
          margin-bottom: 24px;
        }
        .hero h1 {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(26px, 5vw, 50px);
          line-height: 1.1;
          color: #fff;
          max-width: 740px;
          margin: 0 auto 20px;
        }
        .hero h1 em { font-style: normal; color: var(--teal); }
        .hero-sub {
          font-size: 17px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          max-width: 560px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        .hero-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .hero-meta-item {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .hero-meta-dot { color: rgba(255,255,255,0.12); }

        .article-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 56px 32px 80px;
        }

        /* Article body styles — matches your existing article HTML */
        .article-body p { margin-bottom: 22px; color: #2a2a2a; line-height: 1.8; }
        .article-body p:last-child { margin-bottom: 0; }
        .article-body strong { font-weight: 800; color: var(--ink); }
        .article-body em { font-style: italic; }
        .article-body a { color: var(--teal-dark); font-weight: 800; text-decoration: underline; }

        .pull-quote {
          border-left: 4px solid var(--teal);
          background: var(--teal-light);
          padding: 22px 26px;
          margin: 32px 0;
          border-radius: 0 10px 10px 0;
        }
        .pull-quote p {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 19px;
          color: var(--ink);
          line-height: 1.4;
          margin: 0;
          font-style: italic;
        }

        .section-heading { margin: 48px 0 18px; }
        .section-heading h2 {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(19px, 2.8vw, 26px);
          color: var(--ink);
          line-height: 1.2;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin: 28px 0;
        }
        .stat-card {
          background: #fff;
          border: 1px solid var(--rule);
          border-top: 3px solid var(--teal);
          border-radius: 10px;
          padding: 22px 16px;
          text-align: center;
        }
        .stat-num {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 34px;
          color: var(--teal-dark);
          line-height: 1;
          margin-bottom: 8px;
        }
        .stat-label { font-size: 13px; font-weight: 700; color: var(--muted); line-height: 1.4; }

        .dark-box {
          background: var(--ink);
          border-radius: 14px;
          padding: 32px 28px;
          margin: 32px 0;
        }
        .dark-box p { color: rgba(255,255,255,0.7); font-size: 16px; margin-bottom: 14px; }
        .dark-box p:last-child { margin-bottom: 0; }
        .dark-box strong { color: #fff; }

        .strategy-list {
          list-style: none;
          margin: 20px 0 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .strategy-list li {
          background: #fff;
          border: 1px solid var(--rule);
          border-radius: 10px;
          padding: 18px 20px;
          font-size: 16px;
          line-height: 1.65;
        }
        .strategy-list li strong {
          display: block;
          margin-bottom: 4px;
          color: var(--teal-dark);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 44px 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--rule);
        }

        /* Member upgrade block */
        .member-block {
          border: 2px solid var(--teal);
          border-radius: 16px;
          overflow: hidden;
          margin: 48px 0;
        }
        .member-block-header {
          background: var(--teal);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .member-block-header span {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink);
        }
        .member-block-body {
          background: #fff;
          padding: 28px;
        }
        .member-block-body h3 {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 18px;
          color: var(--ink);
          margin-bottom: 10px;
        }
        .member-block-body p {
          font-size: 15px;
          color: var(--muted);
          margin-bottom: 20px;
          line-height: 1.65;
        }
        .member-block-cta {
          background: #fff;
          padding: 16px 28px 28px;
          text-align: center;
          border-top: 1px solid var(--rule);
        }
        .member-block-btn {
          display: inline-block;
          background: var(--teal);
          color: var(--ink);
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 13px;
          padding: 15px 28px;
          border-radius: 8px;
          text-decoration: none;
        }

        /* Paired article teaser */
        .teaser-wrap {
          border: 2px solid var(--teal);
          border-radius: 16px;
          overflow: hidden;
          margin: 48px 0;
        }
        .teaser-header {
          background: var(--teal);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .teaser-header span {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink);
        }
        .teaser-body { background: #fff; padding: 28px; }
        .teaser-title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(17px, 2.5vw, 22px);
          color: var(--ink);
          margin-bottom: 12px;
        }
        .teaser-excerpt { font-size: 15px; color: var(--muted); line-height: 1.65; margin-bottom: 20px; }
        .teaser-cta-wrap { background: #fff; padding: 16px 28px 28px; text-align: center; border-top: 1px solid var(--rule); }
        .teaser-btn {
          display: inline-block;
          background: var(--teal);
          color: var(--ink);
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 13px;
          padding: 15px 28px;
          border-radius: 8px;
          text-decoration: none;
        }

        /* Sources */
        .sources-section {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 32px 64px;
        }
        .sources-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 16px;
          padding-top: 40px;
          border-top: 1px solid var(--rule);
        }

        .page-footer {
          background: #111;
          text-align: center;
          padding: 24px 32px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .page-footer a { text-decoration: none; }
        .page-footer .vid { color: var(--teal); }
        .page-footer .converts { color: #fff; }

        @media (max-width: 600px) {
          .hero { padding: 44px 20px 52px; }
          .article-wrap { padding: 40px 20px 64px; }
          .topbar { padding: 12px 20px; }
        }
      `}</style>

      {/* TOP BAR */}
      <div className="topbar">
        <a href="/" className="topbar-brand">
          <div className="vc-logo">
            <div className="vc-logo-inner"></div>
            <div className="vc-logo-play"></div>
          </div>
          <span><span className="vid">Vid</span> Converts<span className="tm">™</span></span>
        </a>
        <div className="topbar-tag">The Conversion Blog</div>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-kicker">
          <div className="node"></div>
          {article.rubric_category.charAt(0).toUpperCase() + article.rubric_category.slice(1)}
          {article.tier === 'free' ? ' · Free to Read' : ' · Complete & Premium'}
        </div>
        <h1 dangerouslySetInnerHTML={{ __html: article.title.replace(/:/g, ':<br/>') }} />
        {article.subtitle && <p className="hero-sub">{article.subtitle}</p>}
        <div className="hero-meta">
          <span className="hero-meta-item">By Digital Nuclei</span>
          <span className="hero-meta-dot">·</span>
          <span className="hero-meta-item">{article.read_minutes ?? 4} min read</span>
          <span className="hero-meta-dot">·</span>
          <span className="hero-meta-item">{publishDate}</span>
        </div>
      </div>

      {/* ARTICLE BODY */}
      <div className="article-wrap">
        {article.body_html ? (
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.body_html }}
          />
        ) : (
          <p style={{ color: '#999', fontStyle: 'italic' }}>
            Article content coming soon.
          </p>
        )}

        {/* PAIRED ARTICLE — Teaser (free article → member article) */}
        {pairedArticle && article.tier === 'free' && (
          <div className="teaser-wrap">
            <div className="teaser-header">
              <span>Up Next — Complete &amp; Premium Exclusive</span>
              <span>🔒</span>
            </div>
            <div className="teaser-body">
              <div className="teaser-title">{pairedArticle.title}</div>
              {pairedArticle.excerpt && (
                <p className="teaser-excerpt">{pairedArticle.excerpt}</p>
              )}
            </div>
            <div className="teaser-cta-wrap">
              <a href="/pricing" className="teaser-btn">
                Unlock with Complete or Premium →
              </a>
            </div>
          </div>
        )}

        {/* PAIRED ARTICLE — Back link (member article → free article) */}
        {pairedArticle && article.tier === 'member' && (
          <div style={{ margin: '32px 0', padding: '16px 20px', background: '#f0faf9', borderRadius: '10px', border: '1px solid #c0ede8' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1fa898', margin: 0 }}>
              ← Start with the foundation:{' '}
              <a href={`/blog/${pairedArticle.slug}`} style={{ color: '#1fa898', textDecoration: 'underline' }}>
                {pairedArticle.title}
              </a>
            </p>
          </div>
        )}

        {/* UPGRADE BLOCK — shown to free users on member articles (shouldn't reach here via RLS, but safety net) */}
        {!isPaid && article.tier === 'member' && (
          <div className="member-block">
            <div className="member-block-header">
              <span>Complete &amp; Premium Plan</span>
            </div>
            <div className="member-block-body">
              <h3>Unlock the Full Library</h3>
              <p>This article and the full library of conversion-focused content is available to Complete and Premium plan members.</p>
            </div>
            <div className="member-block-cta">
              <a href="/pricing" className="member-block-btn">See Plans →</a>
            </div>
          </div>
        )}

        {/* MAIN CTA — shown on free articles */}
        {article.tier === 'free' && (
          <div style={{
            background: '#1a1a1a',
            borderRadius: '18px',
            padding: '48px 36px',
            textAlign: 'center',
            marginTop: '16px',
          }}>
            <h2 style={{
              fontFamily: "'Encode Sans Expanded', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(20px, 3.5vw, 32px)',
              color: '#fff',
              lineHeight: 1.15,
              marginBottom: '14px',
            }}>
              Stop Guessing.<br />
              <span style={{ color: '#2ec4b0' }}>Start Knowing</span> What's Costing You.
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '440px', margin: '0 auto 28px' }}>
              Vid Converts™ tells you exactly what's working and what's broken in every video.
            </p>
            <a href="/dashboard" style={{
              display: 'inline-block',
              background: '#2ec4b0',
              color: '#1a1a1a',
              fontFamily: "'Encode Sans Expanded', sans-serif",
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '15px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}>
              Analyze My Video — It's Free
            </a>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', marginTop: '14px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Your competitors are already doing this.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="page-footer">
        © 2026{' '}
        <a href="https://www.vidconverts.com">
          <span className="vid">Vid</span>
          <span className="converts"> Converts</span>™
        </a>{' '}
        by Digital Nuclei · All rights reserved
      </div>
    </>
  )
}
