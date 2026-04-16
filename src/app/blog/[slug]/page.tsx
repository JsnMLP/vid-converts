import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('articles')
    .select('title, subtitle, excerpt, published_at, rubric_category')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!data) return { title: 'Article Not Found · Vid Converts™' }

  const url = `https://www.vidconverts.com/blog/${params.slug}`
  const description = data.excerpt ?? data.subtitle ?? 'Psychology, neuroscience, and strategy behind video that actually converts.'

  return {
    title: `${data.title} · Vid Converts™`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: data.title,
      description,
      url,
      siteName: 'Vid Converts',
      type: 'article',
      publishedTime: data.published_at ?? undefined,
      authors: ['Digital Nuclei'],
      tags: ['video marketing', 'conversion optimization', data.rubric_category],
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const supabase = createClient()

  // Get user plan
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

  // Fetch article — RLS controls access at database level
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, slug, title, subtitle, tier, rubric_category, body_html, excerpt, read_minutes, published_at')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  // Not returned — show gate or 404
  if (error || !article) {
    const { data: meta } = await supabase
      .from('articles')
      .select('tier, title, excerpt, rubric_category')
      .eq('slug', params.slug)
      .maybeSingle()

    if (meta) return <ArticleGate article={meta} userPlan={userPlan} />
    notFound()
  }

  const publishDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'April 2026'

  const categoryLabel = article.rubric_category.charAt(0).toUpperCase() + article.rubric_category.slice(1)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@400;700;800;900&family=Mulish:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #f5f5f5; color: #1a1a1a; font-family: 'Mulish', sans-serif; font-size: 17px; line-height: 1.75; -webkit-font-smoothing: antialiased; }

        /* ── Node ── */
        .node { display:inline-block; width:20px; height:20px; border-radius:50%; background:radial-gradient(circle at 38% 35%, #5ef0de 0%, #2ec4b0 45%, #1a8a7d 100%); border:3px solid #1a1a1a; box-shadow:0 0 0 2px #2ec4b0, inset 0 1px 3px rgba(255,255,255,0.4); vertical-align:middle; flex-shrink:0; position:relative; }
        .node::after { content:''; position:absolute; top:2px; left:3px; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,0.55); }

        /* ── VC Logo ── */
        .vc-logo { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; background:#1a1a1a; flex-shrink:0; position:relative; }
        .vc-logo::before { content:''; position:absolute; inset:2px; border-radius:50%; background:#fff; }
        .vc-logo-inner { position:absolute; inset:5px; border-radius:50%; background:radial-gradient(circle at 38% 28%, #6ef5e4 0%, #2ec4b0 40%, #1a9688 100%); z-index:1; }
        .vc-logo-inner::before { content:''; position:absolute; top:15%; left:18%; width:35%; height:28%; border-radius:50%; background:rgba(255,255,255,0.38); filter:blur(1px); }
        .vc-logo-play { position:absolute; z-index:2; width:0; height:0; border-style:solid; border-width:4.5px 0 4.5px 7.5px; border-color:transparent transparent transparent #1a1a1a; margin-left:1.5px; }

        /* ── Topbar ── */
        .topbar { background:#1a1a1a; padding:14px 32px; display:flex; align-items:center; justify-content:space-between; }
        .topbar-brand { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:15px; color:#fff; letter-spacing:0.04em; text-decoration:none; display:flex; align-items:center; gap:10px; }
        .topbar-brand .vid { color:#2ec4b0; }
        .topbar-brand .tm { font-size:0.55em; vertical-align:super; line-height:0; }
        .topbar-tag { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.3); }

        /* ── Hero ── */
        .hero { background:#1a1a1a; padding:60px 32px 68px; text-align:center; }
        .hero-kicker { display:inline-flex; align-items:center; gap:9px; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#2ec4b0; margin-bottom:24px; }
        .hero h1 { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(26px,5vw,50px); line-height:1.1; color:#fff; max-width:760px; margin:0 auto 20px; }
        .hero h1 em { font-style:normal; color:#2ec4b0; }
        .hero-sub { font-size:17px; font-weight:600; color:rgba(255,255,255,0.5); max-width:560px; margin:0 auto 32px; line-height:1.6; }
        .hero-meta { display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; }
        .hero-meta-item { font-size:12px; font-weight:700; color:rgba(255,255,255,0.28); letter-spacing:0.06em; text-transform:uppercase; }
        .hero-meta-dot { color:rgba(255,255,255,0.12); }

        /* ── Article wrap ── */
        .article-wrap { max-width:720px; margin:0 auto; padding:56px 32px 80px; }

        /* ── Body typography ── */
        p { margin-bottom:22px; color:#2a2a2a; line-height:1.8; }
        p:last-child { margin-bottom:0; }
        strong { font-weight:800; color:#1a1a1a; }
        em { font-style:italic; }
        a { color:#1fa898; font-weight:800; text-decoration:underline; }

        /* ── Pull quote ── */
        .pull-quote { border-left:4px solid #2ec4b0; background:#e0f7f4; padding:22px 26px; margin:32px 0; border-radius:0 10px 10px 0; }
        .pull-quote p { font-family:'Encode Sans Expanded',sans-serif; font-weight:700; font-size:19px; color:#1a1a1a; line-height:1.4; margin:0; font-style:italic; }

        /* ── Section heading ── */
        .section-heading { margin:48px 0 18px; }
        .section-heading h2 { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(19px,2.8vw,26px); color:#1a1a1a; line-height:1.2; }

        /* ── Stat grid ── */
        .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; margin:28px 0; }
        .stat-card { background:#fff; border:1px solid #e0e0e0; border-top:3px solid #2ec4b0; border-radius:10px; padding:22px 16px; text-align:center; }
        .stat-num { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:34px; color:#1fa898; line-height:1; margin-bottom:8px; }
        .stat-label { font-size:13px; font-weight:700; color:#666; line-height:1.4; }

        /* ── Dark box ── */
        .dark-box { background:#1a1a1a; border-radius:14px; padding:32px 28px; margin:32px 0; }
        .dark-box p { color:rgba(255,255,255,0.7); font-size:16px; margin-bottom:14px; }
        .dark-box p:last-child { margin-bottom:0; }
        .dark-box strong { color:#fff; }

        /* ── Strategy list ── */
        .strategy-list { list-style:none; margin:20px 0 28px; display:flex; flex-direction:column; gap:12px; }
        .strategy-list li { background:#fff; border:1px solid #e0e0e0; border-radius:10px; padding:18px 20px; font-size:16px; line-height:1.65; }
        .strategy-list li strong { display:block; margin-bottom:4px; color:#1fa898; }

        /* ── Excuse list ── */
        .excuse-list { list-style:none; margin:20px 0 28px; display:flex; flex-direction:column; gap:12px; }
        .excuse-list li { background:#fff; border:1px solid #e0e0e0; border-radius:10px; padding:18px 20px; font-size:16px; line-height:1.65; }
        .excuse-list li strong { display:block; margin-bottom:4px; color:#1fa898; }

        /* ── Divider ── */
        .divider { display:flex; align-items:center; gap:16px; margin:44px 0; }
        .divider::before, .divider::after { content:''; flex:1; height:1px; background:#e0e0e0; }

        /* ── Counter strip (Article 3) ── */
        .counter-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid #e0e0e0; border-radius:14px; overflow:hidden; margin:36px 0; }
        .counter-cell { background:#fff; padding:28px 16px; text-align:center; border-right:1px solid #e0e0e0; }
        .counter-cell:last-child { border-right:none; }
        .counter-num { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(28px,4vw,42px); color:#1fa898; line-height:1; margin-bottom:8px; }
        .counter-label { font-size:12px; font-weight:700; color:#666; line-height:1.5; }

        /* ── Verdict stack (Article 3) ── */
        .verdict-stack { display:flex; flex-direction:column; gap:0; border:1px solid #e0e0e0; border-radius:14px; overflow:hidden; margin:28px 0; }
        .verdict-row { display:flex; gap:0; border-bottom:1px solid #e0e0e0; }
        .verdict-row:last-child { border-bottom:none; }
        .verdict-num { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:28px; color:#2ec4b0; padding:24px 20px; background:#f9fffe; border-right:1px solid #e0e0e0; display:flex; align-items:center; justify-content:center; min-width:72px; flex-shrink:0; line-height:1; }
        .verdict-content { padding:22px 24px; }
        .verdict-stat { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:15px; color:#1a1a1a; line-height:1.3; margin-bottom:8px; }
        .verdict-desc { font-size:14px; color:#666; line-height:1.65; margin:0; }

        /* ── Contrast grid (Article 3) ── */
        .contrast-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin:28px 0; }
        .contrast-card { border-radius:12px; overflow:hidden; border:1px solid #e0e0e0; }
        .contrast-card.no-video { border-color:#f0d0d0; }
        .contrast-card.with-video { border-color:#c0ede8; }
        .contrast-label { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; padding:10px 16px; }
        .contrast-card.no-video .contrast-label { background:#fdf0f0; color:#c0392b; }
        .contrast-card.with-video .contrast-label { background:#f0faf9; color:#1fa898; }
        .contrast-list { list-style:none; padding:8px 0; }
        .contrast-list li { display:flex; align-items:center; gap:10px; padding:8px 16px; font-size:13px; font-weight:700; color:#1a1a1a; border-top:1px solid #f0f0f0; }
        .contrast-list li:first-child { border-top:none; }
        .contrast-list li .icon { color:#999; flex-shrink:0; }

        /* ── Tips list (Article 3) ── */
        .tips-list { list-style:none; margin:20px 0 28px; display:flex; flex-direction:column; gap:14px; }
        .tips-list li { background:#fff; border:1px solid #e0e0e0; border-radius:12px; padding:20px 22px; font-size:15px; line-height:1.65; display:flex; gap:16px; align-items:flex-start; }
        .tip-num { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:22px; color:#2ec4b0; line-height:1; flex-shrink:0; min-width:28px; }
        .tips-list li strong { display:block; margin-bottom:6px; color:#1a1a1a; font-size:15px; }
        .tips-label { font-size:10px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:#2ec4b0; margin-bottom:12px; }

        /* ── Teaser block ── */
        .teaser-wrap { border:2px solid #2ec4b0; border-radius:16px; overflow:hidden; margin:48px 0; }
        .teaser-header { background:#2ec4b0; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .teaser-header-left { display:flex; align-items:center; gap:10px; }
        .teaser-header-left span { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#1a1a1a; }
        .teaser-lock { font-size:18px; line-height:1; }
        .teaser-body { background:#fff; padding:28px 28px 0; }
        .teaser-label { font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#666; margin-bottom:8px; }
        .teaser-title { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(17px,2.5vw,22px); color:#1a1a1a; line-height:1.2; margin-bottom:12px; }
        .teaser-hook { font-size:15px; color:#666; line-height:1.65; margin-bottom:20px; }
        .teaser-toc-label { font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#1a1a1a; margin-bottom:12px; }
        .teaser-toc { list-style:none; display:flex; flex-direction:column; }
        .teaser-toc li { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-top:1px solid #e0e0e0; font-size:15px; font-weight:700; color:#1a1a1a; line-height:1.4; }
        .teaser-toc li .bullet { color:#2ec4b0; font-size:18px; line-height:1.1; flex-shrink:0; }
        .teaser-toc li:nth-child(4) { opacity:0.45; filter:blur(1.5px); }
        .teaser-toc li:nth-child(5) { opacity:0.15; filter:blur(3px); user-select:none; }
        .teaser-fade { height:56px; background:linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 85%); margin-top:-16px; }
        .teaser-cta-wrap { background:#fff; padding:16px 28px 28px; text-align:center; border-top:1px solid #e0e0e0; }
        .teaser-cta-btn { display:inline-block; background:#2ec4b0; color:#1a1a1a; font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:13px; letter-spacing:0.03em; padding:15px 28px; border-radius:8px; text-decoration:none; line-height:1.35; transition:background 0.2s; }
        .teaser-cta-btn:hover { background:#1fa898; }

        /* ── Gratitude block ── */
        .gratitude-wrap { border:2px solid #2ec4b0; border-radius:16px; overflow:hidden; margin:48px 0; }
        .gratitude-header { background:#2ec4b0; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .gratitude-header-left { display:flex; align-items:center; gap:10px; }
        .gratitude-header-left span { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#1a1a1a; }
        .gratitude-badge { font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; background:#1a1a1a; color:#2ec4b0; padding:4px 12px; border-radius:100px; }
        .gratitude-body { background:#fff; padding:28px; }
        .gratitude-body h3 { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:18px; color:#1a1a1a; margin-bottom:10px; line-height:1.25; }
        .gratitude-body > p { font-size:15px; color:#666; margin-bottom:20px; line-height:1.65; }
        .upgrade-label { font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#1a1a1a; margin-bottom:12px; }
        .upgrade-list { list-style:none; display:flex; flex-direction:column; }
        .upgrade-list li { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-top:1px solid #e0e0e0; font-size:15px; font-weight:700; color:#1a1a1a; line-height:1.4; }
        .upgrade-list li .bullet { color:#2ec4b0; font-size:18px; line-height:1.1; flex-shrink:0; }
        .upgrade-list li .sub { font-size:13px; font-weight:600; color:#666; display:block; margin-top:2px; }
        .gratitude-cta-wrap { background:#fff; padding:16px 28px 28px; text-align:center; border-top:1px solid #e0e0e0; }
        .gratitude-cta-btn { display:inline-block; background:#2ec4b0; color:#1a1a1a; font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:13px; letter-spacing:0.03em; padding:15px 28px; border-radius:8px; text-decoration:none; line-height:1.35; }

        /* ── Add-ons section ── */
        .addons-section { background:#1a1a1a; border-radius:18px; padding:36px 32px; margin-top:16px; }
        .addons-kicker { font-size:10px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:#2ec4b0; margin-bottom:8px; }
        .addons-section h2 { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(18px,3vw,26px); color:#fff; line-height:1.2; margin-bottom:10px; }
        .addons-section > p { font-size:14px; color:rgba(255,255,255,0.45); margin-bottom:28px; max-width:480px; }
        .addon-cards { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .addon-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:22px 20px; }
        .addon-card-icon { font-size:22px; margin-bottom:10px; display:block; }
        .addon-card-price { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:28px; color:#2ec4b0; line-height:1; margin-bottom:6px; }
        .addon-card-price span { font-size:14px; font-weight:700; color:rgba(255,255,255,0.4); }
        .addon-card-title { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:14px; color:#fff; margin-bottom:8px; line-height:1.3; }
        .addon-card-desc { font-size:13px; color:rgba(255,255,255,0.45); line-height:1.6; margin:0; }

        /* ── Main CTA (free articles) ── */
        .cta-section { background:#1a1a1a; border-radius:18px; padding:48px 36px; text-align:center; margin-top:16px; }
        .cta-section h2 { font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:clamp(20px,3.5vw,32px); color:#fff; line-height:1.15; margin-bottom:14px; }
        .cta-section h2 em { font-style:normal; color:#2ec4b0; }
        .cta-section p { font-size:15px; color:rgba(255,255,255,0.5); max-width:440px; margin:0 auto 28px; }
        .cta-btn { display:inline-block; background:#2ec4b0; color:#1a1a1a; font-family:'Encode Sans Expanded',sans-serif; font-weight:900; font-size:13px; letter-spacing:0.06em; text-transform:uppercase; padding:15px 32px; border-radius:8px; text-decoration:none; transition:background 0.2s; }
        .cta-btn:hover { background:#1fa898; }
        .cta-footnote { font-size:12px; color:rgba(255,255,255,0.18); margin-top:14px !important; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
        .brand-vid { color:#2ec4b0; font-weight:800; }

        /* ── Sources ── */
        .sources-section { max-width:720px; margin:0 auto; padding:0 32px 64px; }
        .sources-label { font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#666; margin-bottom:16px; padding-top:40px; border-top:1px solid #e0e0e0; }
        .sources-list { list-style:none; display:flex; flex-direction:column; gap:10px; counter-reset:source; }
        .sources-list li { display:flex; gap:12px; font-size:13px; color:#666; line-height:1.55; counter-increment:source; }
        .sources-list li::before { content:counter(source) "."; font-weight:800; color:#1fa898; min-width:18px; flex-shrink:0; }
        .sources-list li a { color:#1fa898; text-decoration:none; font-weight:700; }
        .sources-list li a:hover { text-decoration:underline; }
        .sources-list em { font-style:italic; }

        /* ── Footer ── */
        .page-footer { background:#111; text-align:center; padding:24px 32px; font-size:12px; font-weight:700; color:rgba(255,255,255,0.18); letter-spacing:0.06em; text-transform:uppercase; }
        .page-footer a { text-decoration:none; }
        .page-footer .vid { color:#2ec4b0; }
        .page-footer .converts { color:#fff; }
        .page-footer .tm { font-size:0.6em; vertical-align:super; line-height:0; color:#fff; }

        @media (max-width:600px) {
          .hero { padding:44px 20px 52px; }
          .article-wrap { padding:40px 20px 64px; }
          .topbar { padding:12px 20px; }
          .addon-cards { grid-template-columns:1fr; }
          .gratitude-body, .gratitude-cta-wrap { padding-left:20px; padding-right:20px; }
          .counter-strip { grid-template-columns:1fr; }
          .counter-cell { border-right:none; border-bottom:1px solid #e0e0e0; }
          .counter-cell:last-child { border-bottom:none; }
          .contrast-grid { grid-template-columns:1fr; }
          .verdict-num { min-width:52px; font-size:20px; padding:16px 12px; }
          .teaser-body, .teaser-cta-wrap { padding-left:20px; padding-right:20px; }
          .cta-section { padding:36px 20px; }
          .sources-section { padding-left:20px; padding-right:20px; }
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt ?? article.subtitle ?? '',
            author: { '@type': 'Organization', name: 'Digital Nuclei', url: 'https://digitalnuclei.com' },
            publisher: {
              '@type': 'Organization',
              name: 'Vid Converts',
              url: 'https://www.vidconverts.com',
              logo: { '@type': 'ImageObject', url: 'https://www.vidconverts.com/og-image.png' },
            },
            datePublished: article.published_at ?? new Date().toISOString(),
            dateModified: article.published_at ?? new Date().toISOString(),
            url: `https://www.vidconverts.com/blog/${article.slug}`,
            mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.vidconverts.com/blog/${article.slug}` },
            image: 'https://www.vidconverts.com/og-image.png',
          }),
        }}
      />

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
          {categoryLabel}{article.tier === 'free' ? ' · Free to Read' : ' · Complete & Premium'}
        </div>
        <h1>{article.title}</h1>
        {article.subtitle && <p className="hero-sub">{article.subtitle}</p>}
        <div className="hero-meta">
          <span className="hero-meta-item">By Digital Nuclei</span>
          <span className="hero-meta-dot">·</span>
          <span className="hero-meta-item">{article.read_minutes ?? 4} min read</span>
          <span className="hero-meta-dot">·</span>
          <span className="hero-meta-item">{publishDate}</span>
        </div>
      </div>

      {/* ARTICLE — renders exactly what's in the database, no overrides */}
      <div className="article-wrap">
        {article.body_html ? (
          <div dangerouslySetInnerHTML={{ __html: article.body_html }} />
        ) : (
          <p style={{ color:'#999', fontStyle:'italic' }}>Article content coming soon.</p>
        )}
      </div>

      {/* FOOTER */}
      <div className="page-footer">
        © 2026{' '}
        <a href="https://www.vidconverts.com">
          <span className="vid">Vid</span>
          <span className="converts"> Converts</span>
          <span className="tm">™</span>
        </a>
        {' '}by Digital Nuclei &nbsp;·&nbsp; All rights reserved
      </div>
    </>
  )
}

// ─── Gate — member article, user not subscribed ───────────────
function ArticleGate({ article, userPlan }: {
  article: { tier: string; title: string; excerpt: string | null; rubric_category: string }
  userPlan: string | null
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@700;900&family=Mulish:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1a1a; }
      `}</style>
      <div style={{ minHeight:'100vh', background:'#1a1a1a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:"'Mulish', sans-serif" }}>
        <div style={{ maxWidth:'520px', width:'100%', textAlign:'center' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'rgba(46,196,176,0.1)', border:'1px solid rgba(46,196,176,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:'28px' }}>🔒</div>
          <div style={{ display:'inline-block', background:'rgba(46,196,176,0.1)', border:'1px solid rgba(46,196,176,0.2)', color:'#2ec4b0', fontSize:'10px', fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase' as const, padding:'4px 12px', borderRadius:'100px', marginBottom:'20px' }}>
            {article.rubric_category} · Complete + Premium
          </div>
          <h1 style={{ fontFamily:"'Encode Sans Expanded', sans-serif", fontWeight:900, fontSize:'clamp(20px, 4vw, 28px)', color:'#ffffff', lineHeight:1.2, marginBottom:'16px' }}>{article.title}</h1>
          {article.excerpt && (
            <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:'32px', filter:'blur(3px)', userSelect:'none' as const }}>{article.excerpt}</p>
          )}
          <p style={{ fontSize:'14px', fontWeight:700, color:'rgba(255,255,255,0.35)', marginBottom:'24px', lineHeight:1.6 }}>
            This article is available to <strong style={{ color:'#2ec4b0' }}>Complete and Premium</strong> plan members.
          </p>
          <a href="/pricing" style={{ display:'inline-block', background:'#2ec4b0', color:'#1a1a1a', fontFamily:"'Encode Sans Expanded', sans-serif", fontWeight:900, fontSize:'13px', letterSpacing:'0.06em', textTransform:'uppercase' as const, padding:'14px 28px', borderRadius:'8px', textDecoration:'none' }}>See Plans →</a>
          <div style={{ marginTop:'20px' }}>
            <a href="/" style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.2)', textDecoration:'none', letterSpacing:'0.06em', textTransform:'uppercase' as const }}>← Back to Home</a>
          </div>
        </div>
      </div>
    </>
  )
}
