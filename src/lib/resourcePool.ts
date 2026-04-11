// ============================================================
// VID CONVERTS — LEARN LIKE A PRO RESOURCE POOL
// ============================================================
// Each resource has:
//   id         — unique, stable identifier (never change this)
//   category   — matches rubric category key from AI report
//   title      — shown to user
//   creator    — shown under title
//   platform   — 'youtube' | 'vimeo' | 'tiktok' | 'instagram'
//   url        — direct link to the video
//   searchQuery — used by self-healing script to find a replacement if dead
//
// To add a resource: copy any entry, give it a new unique id, fill fields.
// To remove a resource: delete its entry.
// The validator in ReportClient auto-hides dead links — users never see errors.
// ============================================================

export type Platform = 'youtube' | 'vimeo' | 'tiktok' | 'instagram';

export interface Resource {
  id: string;
  category: string;
  title: string;
  creator: string;
  platform: Platform;
  url: string;
  searchQuery: string; // used by heal-links.ts script to auto-replace dead URLs
}

// ============================================================
// CATEGORY KEYS — must match what your AI returns in report JSON
// ============================================================
// 'hook'             — Hook score category
// 'problem_clarity'  — Problem Clarity score category
// 'platform_fit'     — Platform Fit score category
// 'cta'              — Call to Action score category
// 'trust'            — Trust & Credibility score category
// 'retention'        — Retention & Engagement score category
// ============================================================

export const resourcePool: Resource[] = [

  // ══════════════════════════════════════════════════════════
  // HOOK
  // ══════════════════════════════════════════════════════════

  {
    id: 'hook-001',
    category: 'hook',
    title: 'The Hook Formula That Stops the Scroll',
    creator: 'Alex Hormozi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=O5rsbWTRWKM',
    searchQuery: 'Alex Hormozi hook formula stops scroll video',
  },
  {
    id: 'hook-002',
    category: 'hook',
    title: 'How to Write Hooks That Actually Work',
    creator: 'Alex Hormozi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=K4l7KgT0urs',
    searchQuery: 'Alex Hormozi write hooks that work',
  },
  {
    id: 'hook-003',
    category: 'hook',
    title: 'First 3 Seconds — Why Your Hook Is Failing',
    creator: 'VidIQ',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=I07XBdgLYa4',
    searchQuery: 'VidIQ first 3 seconds video hook failing',
  },
  {
    id: 'hook-004',
    category: 'hook',
    title: 'Hook Mastery: Stop Losing Viewers in 5 Seconds',
    creator: 'Think Media',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=GFQNKE7Hd5k',
    searchQuery: 'Think Media hook mastery stop losing viewers',
  },
  {
    id: 'hook-005',
    category: 'hook',
    title: '7 Hook Types That Convert Cold Traffic',
    creator: 'Justin Brooke',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    searchQuery: 'hook types convert cold traffic video marketing',
  },
  {
    id: 'hook-006',
    category: 'hook',
    title: 'The Curiosity Gap Hook Method',
    creator: 'Sunny Lenarduzzi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=rLSS7PKf7ZA',
    searchQuery: 'Sunny Lenarduzzi curiosity gap hook YouTube',
  },
  {
    id: 'hook-007',
    category: 'hook',
    title: 'How to Open a Video So No One Leaves',
    creator: 'Roberto Blake',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=QyFHDarX_Hg',
    searchQuery: 'Roberto Blake how to open video hook retention',
  },
  {
    id: 'hook-008',
    category: 'hook',
    title: 'Pain-Point Hook Strategy for Business Video',
    creator: 'Evan Carmichael',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=j_3dE3rCJis',
    searchQuery: 'pain point hook strategy business video Evan Carmichael',
  },
  {
    id: 'hook-009',
    category: 'hook',
    title: 'Hook Writing for Short-Form Video',
    creator: 'Natalie Bacon',
    platform: 'vimeo',
    url: 'https://vimeo.com/848234701',
    searchQuery: 'hook writing short form video reels tiktok tutorial',
  },
  {
    id: 'hook-010',
    category: 'hook',
    title: 'The 3-Second Rule: TikTok Hook Science',
    creator: 'Elise Darma',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=MjGCJnuBEtM',
    searchQuery: 'Elise Darma TikTok hook 3 second rule science',
  },
  {
    id: 'hook-011',
    category: 'hook',
    title: 'Pattern Interrupt Hooks That Go Viral',
    creator: 'Descript',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=sK8GXeHFiMo',
    searchQuery: 'pattern interrupt hooks viral video marketing',
  },
  {
    id: 'hook-012',
    category: 'hook',
    title: 'What Is a Hook? (The Full Breakdown)',
    creator: 'Alex Hormozi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=5Jqp2Q-7H_g',
    searchQuery: 'Alex Hormozi what is a hook full breakdown',
  },

  // ══════════════════════════════════════════════════════════
  // PROBLEM CLARITY
  // ══════════════════════════════════════════════════════════

  {
    id: 'prob-001',
    category: 'problem_clarity',
    title: 'How to Identify Your Customer\'s Core Pain',
    creator: 'Alex Hormozi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=jfFkJG9RMR4',
    searchQuery: 'Alex Hormozi identify customer core pain business',
  },
  {
    id: 'prob-002',
    category: 'problem_clarity',
    title: 'Agitate the Problem: The PAS Framework',
    creator: 'Copywriting Course',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=LoHHGMkCjz4',
    searchQuery: 'PAS framework problem agitate solution copywriting video',
  },
  {
    id: 'prob-003',
    category: 'problem_clarity',
    title: 'Video Messaging That Actually Connects With Buyers',
    creator: 'StoryBrand',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=aVqE8b_GKGE',
    searchQuery: 'StoryBrand video messaging connects buyers Donald Miller',
  },
  {
    id: 'prob-004',
    category: 'problem_clarity',
    title: 'Make Your Audience Feel Understood in 60 Seconds',
    creator: 'Hormozi Team',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=qp0HIF3SfI4',
    searchQuery: 'make audience feel understood 60 seconds video marketing',
  },
  {
    id: 'prob-005',
    category: 'problem_clarity',
    title: 'The Before-After-Bridge Method for Video Scripts',
    creator: 'Sean Cannell',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=tTIFnxs9xL4',
    searchQuery: 'Sean Cannell before after bridge video script method',
  },
  {
    id: 'prob-006',
    category: 'problem_clarity',
    title: 'How to Position Your Business Problem Clearly on Video',
    creator: 'Donald Miller',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=oBRDrAQHQdQ',
    searchQuery: 'Donald Miller position business problem clearly video StoryBrand',
  },
  {
    id: 'prob-007',
    category: 'problem_clarity',
    title: 'Problem-First Scripting for Business Owners',
    creator: 'Video Creators',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=cPWU5RRsGZ0',
    searchQuery: 'problem first scripting business owners video creators Tim Schmoyer',
  },
  {
    id: 'prob-008',
    category: 'problem_clarity',
    title: 'Speak to the Pain: Video Script Secrets',
    creator: 'Wistia',
    platform: 'vimeo',
    url: 'https://vimeo.com/312628326',
    searchQuery: 'speak to pain video script secrets conversion',
  },
  {
    id: 'prob-009',
    category: 'problem_clarity',
    title: 'Why Vague Videos Don\'t Convert',
    creator: 'Todd Brown',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=dJSNpPBbYck',
    searchQuery: 'vague videos don\'t convert specific problem clarity marketing',
  },
  {
    id: 'prob-010',
    category: 'problem_clarity',
    title: 'Customer Avatar: Know Their Problem Before You Speak',
    creator: 'Ryan Deiss',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=GHCEXnVIYJo',
    searchQuery: 'Ryan Deiss customer avatar know their problem video',
  },
  {
    id: 'prob-011',
    category: 'problem_clarity',
    title: 'Specificity Sells: How to Be More Precise in Video',
    creator: 'Frank Kern',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=zHLeP3RaGYs',
    searchQuery: 'specificity sells precise video marketing Frank Kern',
  },

  // ══════════════════════════════════════════════════════════
  // PLATFORM FIT
  // ══════════════════════════════════════════════════════════

  {
    id: 'plat-001',
    category: 'platform_fit',
    title: 'YouTube vs Instagram vs TikTok: What Works Where',
    creator: 'Jenna Kutcher',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=lMqxH49hZJo',
    searchQuery: 'YouTube vs Instagram vs TikTok what works where video strategy',
  },
  {
    id: 'plat-002',
    category: 'platform_fit',
    title: 'Aspect Ratio Guide for Every Social Platform 2025',
    creator: 'Later',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=yqsJ9BTYQ0U',
    searchQuery: 'aspect ratio guide social platform 2025 video dimensions',
  },
  {
    id: 'plat-003',
    category: 'platform_fit',
    title: 'How to Repurpose One Video for Every Platform',
    creator: 'Jade Beason',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=uVT3MSwt7Lw',
    searchQuery: 'repurpose one video every platform Jade Beason',
  },
  {
    id: 'plat-004',
    category: 'platform_fit',
    title: 'Why Sound-Off Optimization Matters on Instagram',
    creator: 'Social Media Examiner',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=GtKSgaTjXLw',
    searchQuery: 'sound off optimization Instagram video captions social media examiner',
  },
  {
    id: 'plat-005',
    category: 'platform_fit',
    title: 'TikTok vs YouTube Shorts: Format Deep Dive',
    creator: 'Matt Wolfe',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=VBQVS7PJbQ0',
    searchQuery: 'TikTok vs YouTube Shorts format comparison deep dive',
  },
  {
    id: 'plat-006',
    category: 'platform_fit',
    title: 'LinkedIn Video Strategy for B2B Businesses',
    creator: 'Goldie Chan',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=JKxwWF_GBPE',
    searchQuery: 'LinkedIn video strategy B2B businesses Goldie Chan',
  },
  {
    id: 'plat-007',
    category: 'platform_fit',
    title: 'Facebook Video in 2025: What Still Works',
    creator: 'Andrew Hubbard',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=_9RaGFBHQGA',
    searchQuery: 'Facebook video strategy 2025 what works ads',
  },
  {
    id: 'plat-008',
    category: 'platform_fit',
    title: 'Vertical Video Done Right: A Complete Guide',
    creator: 'Wistia',
    platform: 'vimeo',
    url: 'https://vimeo.com/355212696',
    searchQuery: 'vertical video guide complete tutorial mobile 9:16',
  },
  {
    id: 'plat-009',
    category: 'platform_fit',
    title: 'Caption Strategy: How to Win Sound-Off Views',
    creator: 'Elise Darma',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=8QMM5K2RTBY',
    searchQuery: 'Elise Darma caption strategy sound off video views',
  },
  {
    id: 'plat-010',
    category: 'platform_fit',
    title: 'Website Video Optimization: Boost Conversion Rate',
    creator: 'Unbounce',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=wHZ8T9MKI2s',
    searchQuery: 'website video optimization boost conversion rate landing page',
  },
  {
    id: 'plat-011',
    category: 'platform_fit',
    title: 'Pacing Your Video for Different Platforms',
    creator: 'Think Media',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=NFYQF9BFuJo',
    searchQuery: 'Think Media pacing video different platforms speed editing',
  },
  {
    id: 'plat-012',
    category: 'platform_fit',
    title: 'Instagram Reels for Business: The Real Strategy',
    creator: 'Vanessa Lau',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=v0oeFA9UJik',
    searchQuery: 'Vanessa Lau Instagram Reels business strategy 2024 2025',
  },

  // ══════════════════════════════════════════════════════════
  // CTA (CALL TO ACTION)
  // ══════════════════════════════════════════════════════════

  {
    id: 'cta-001',
    category: 'cta',
    title: 'How to End a Video So Viewers Take Action',
    creator: 'Alex Hormozi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=7Fh7I9a3FbA',
    searchQuery: 'Alex Hormozi end video viewers take action CTA',
  },
  {
    id: 'cta-002',
    category: 'cta',
    title: 'The 4 CTAs That Actually Convert in Video',
    creator: 'Neil Patel',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=K2mFBOXP-Xo',
    searchQuery: 'Neil Patel 4 CTAs that convert video marketing',
  },
  {
    id: 'cta-003',
    category: 'cta',
    title: 'Stop Saying "Like and Subscribe" — Do This Instead',
    creator: 'Roberto Blake',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=xWq6JBpUBp0',
    searchQuery: 'Roberto Blake stop saying like subscribe do this instead CTA',
  },
  {
    id: 'cta-004',
    category: 'cta',
    title: 'CTA Placement: When to Ask and When to Wait',
    creator: 'Wistia',
    platform: 'vimeo',
    url: 'https://vimeo.com/144287298',
    searchQuery: 'CTA placement video when to ask call to action timing',
  },
  {
    id: 'cta-005',
    category: 'cta',
    title: 'Soft CTA vs Hard CTA: Which Converts More?',
    creator: 'Ahrefs',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=E7BPh3bF2Wk',
    searchQuery: 'soft CTA vs hard CTA video marketing which converts more',
  },
  {
    id: 'cta-006',
    category: 'cta',
    title: 'How to Ask for the Phone Call in a Video',
    creator: 'Breakthrough Business',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=Q7Kj4Hfn-Xg',
    searchQuery: 'how to ask for phone call in business video CTA',
  },
  {
    id: 'cta-007',
    category: 'cta',
    title: 'The Urgency CTA: Create Action Without Pressure',
    creator: 'Jeremy Miner',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=zw_8v4vTcXk',
    searchQuery: 'Jeremy Miner urgency CTA create action without pressure sales',
  },
  {
    id: 'cta-008',
    category: 'cta',
    title: 'YouTube End Screen Strategy for Maximum Clicks',
    creator: 'VidIQ',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=jrGKbZz9vvo',
    searchQuery: 'VidIQ YouTube end screen strategy maximum clicks CTA',
  },
  {
    id: 'cta-009',
    category: 'cta',
    title: 'DM This: TikTok CTA That Gets Responses',
    creator: 'Elise Darma',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=3FhvsMHkxHY',
    searchQuery: 'Elise Darma TikTok CTA DM response call to action',
  },
  {
    id: 'cta-010',
    category: 'cta',
    title: 'Converting Viewers Into Leads With Video CTAs',
    creator: 'Marcus Sheridan',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=1e_5RPBE8So',
    searchQuery: 'Marcus Sheridan converting viewers into leads video CTA',
  },
  {
    id: 'cta-011',
    category: 'cta',
    title: 'Link in Bio Strategy: From Video to Sale',
    creator: 'Jade Beason',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=CGKRqhBGAKo',
    searchQuery: 'Jade Beason link in bio strategy video to sale Instagram',
  },
  {
    id: 'cta-012',
    category: 'cta',
    title: 'Video CTA Psychology: Why Most CTAs Fail',
    creator: 'Derek Halpern',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=JGDXi_bqMdU',
    searchQuery: 'video CTA psychology why most CTAs fail Derek Halpern',
  },

  // ══════════════════════════════════════════════════════════
  // TRUST & CREDIBILITY
  // ══════════════════════════════════════════════════════════

  {
    id: 'trust-001',
    category: 'trust',
    title: 'How to Build Trust on Camera Fast',
    creator: 'Alex Hormozi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=EIqD4UrFbKo',
    searchQuery: 'Alex Hormozi build trust on camera fast video',
  },
  {
    id: 'trust-002',
    category: 'trust',
    title: 'The Authority Blueprint for Video Marketing',
    creator: 'Russell Brunson',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=Zod5e8WBxzs',
    searchQuery: 'Russell Brunson authority blueprint video marketing',
  },
  {
    id: 'trust-003',
    category: 'trust',
    title: 'Social Proof in Video: What Works in 2025',
    creator: 'Neil Patel',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=R4KCFZP7KMQ',
    searchQuery: 'Neil Patel social proof video marketing 2025 testimonials',
  },
  {
    id: 'trust-004',
    category: 'trust',
    title: 'Show, Don\'t Tell: Demonstrating Your Value on Camera',
    creator: 'Marcus Sheridan',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=fvjMDnNkCB8',
    searchQuery: 'Marcus Sheridan show don\'t tell demonstrating value on camera',
  },
  {
    id: 'trust-005',
    category: 'trust',
    title: 'Why Authentic Video Outperforms Polished Production',
    creator: 'Gary Vaynerchuk',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=ZHhH-adPdcc',
    searchQuery: 'Gary Vaynerchuk authentic video outperforms polished production',
  },
  {
    id: 'trust-006',
    category: 'trust',
    title: 'Case Study Videos That Win Customers',
    creator: 'Wistia',
    platform: 'vimeo',
    url: 'https://vimeo.com/412073244',
    searchQuery: 'case study videos win customers B2B video marketing',
  },
  {
    id: 'trust-007',
    category: 'trust',
    title: 'On-Camera Confidence: Look Like You Know What You\'re Doing',
    creator: 'Amy Landino',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=eDvD4FSGB3c',
    searchQuery: 'Amy Landino on camera confidence look credible video',
  },
  {
    id: 'trust-008',
    category: 'trust',
    title: 'Credibility Signals: What Buyers Look for in Video',
    creator: 'Todd Brown',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=bKFsrBHjILE',
    searchQuery: 'credibility signals buyers look for video marketing Todd Brown',
  },
  {
    id: 'trust-009',
    category: 'trust',
    title: 'How to Use Testimonials in Your Marketing Video',
    creator: 'Donald Miller',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=gHGT7fDvGE4',
    searchQuery: 'Donald Miller testimonials marketing video how to use',
  },
  {
    id: 'trust-010',
    category: 'trust',
    title: 'Behind the Scenes Video: The Trust Multiplier',
    creator: 'Jasmine Star',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=6qUOTCfB1kA',
    searchQuery: 'Jasmine Star behind the scenes video trust multiplier business',
  },
  {
    id: 'trust-011',
    category: 'trust',
    title: 'Before & After Video: The Contractor\'s Secret Weapon',
    creator: 'Contractor Marketing Hub',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=PfgZxu7w3Ys',
    searchQuery: 'before after video contractor marketing secret weapon credibility',
  },
  {
    id: 'trust-012',
    category: 'trust',
    title: 'Eye Contact on Camera: The Science of Trust',
    creator: 'Vanessa Van Edwards',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=PjkKhGpLUiw',
    searchQuery: 'Vanessa Van Edwards eye contact camera science of trust video',
  },

  // ══════════════════════════════════════════════════════════
  // RETENTION & ENGAGEMENT
  // ══════════════════════════════════════════════════════════

  {
    id: 'ret-001',
    category: 'retention',
    title: 'Keep Viewers Watching: Retention Secrets',
    creator: 'Think Media',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=O86qsRBbzAQ',
    searchQuery: 'Think Media keep viewers watching retention secrets YouTube',
  },
  {
    id: 'ret-002',
    category: 'retention',
    title: 'Pattern Interrupt: How to Reset Attention Mid-Video',
    creator: 'VidIQ',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=3Y-oRHCJOtc',
    searchQuery: 'VidIQ pattern interrupt reset attention mid video',
  },
  {
    id: 'ret-003',
    category: 'retention',
    title: 'Open Loop Technique: The Cliffhanger That Holds Views',
    creator: 'Sean Cannell',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=Xmy-2fjAVek',
    searchQuery: 'Sean Cannell open loop technique cliffhanger holds views',
  },
  {
    id: 'ret-004',
    category: 'retention',
    title: 'Storytelling That Keeps Viewers Until the End',
    creator: 'Alex Hormozi',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=YClhkQfk9fY',
    searchQuery: 'Alex Hormozi storytelling keeps viewers end video retention',
  },
  {
    id: 'ret-005',
    category: 'retention',
    title: 'How to Edit Videos to Maximize Watch Time',
    creator: 'Justin Brown',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=V9s_2EU9Iu4',
    searchQuery: 'Justin Brown Primal Video edit maximize watch time',
  },
  {
    id: 'ret-006',
    category: 'retention',
    title: 'Pacing and Energy: Why Slow Videos Lose Viewers',
    creator: 'Roberto Blake',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=b2Y22xrN1uU',
    searchQuery: 'Roberto Blake pacing energy slow videos lose viewers',
  },
  {
    id: 'ret-007',
    category: 'retention',
    title: 'Short-Form Retention Hacks for Reels and TikTok',
    creator: 'Jade Beason',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=bE0JGqvqW64',
    searchQuery: 'Jade Beason short form retention hacks Reels TikTok',
  },
  {
    id: 'ret-008',
    category: 'retention',
    title: 'B-Roll Strategy: Keep Eyes Glued to the Screen',
    creator: 'Primal Video',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=5VUKuCMYNRs',
    searchQuery: 'Primal Video B-roll strategy keep eyes glued screen',
  },
  {
    id: 'ret-009',
    category: 'retention',
    title: 'Why People Drop Off Your Videos (and How to Fix It)',
    creator: 'Creator Fundamentals',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=zsmvFNJECaU',
    searchQuery: 'why people drop off video how to fix retention analytics',
  },
  {
    id: 'ret-010',
    category: 'retention',
    title: 'Subtitle Strategy to Keep Sound-Off Viewers',
    creator: 'Later',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=lH7T5ByA42s',
    searchQuery: 'Later subtitle strategy keep sound off viewers captions social media',
  },
  {
    id: 'ret-011',
    category: 'retention',
    title: 'The Re-Hook: Pull Viewers Back After the First Drop',
    creator: 'Video Creators',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=ADnrHAzUEpo',
    searchQuery: 'Video Creators re-hook pull viewers back drop off retention',
  },
  {
    id: 'ret-012',
    category: 'retention',
    title: 'Looping Short-Form Video: TikTok Retention Trick',
    creator: 'Elise Darma',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=kxR5J-Y8HdU',
    searchQuery: 'Elise Darma looping short form video TikTok retention trick',
  },
];

// ============================================================
// HELPER: Get resources for a given category, shuffled by report ID
// This ensures different reports see different link orders
// while being deterministic per report (same report = same order)
// ============================================================
export function getResourcesForCategory(
  category: string,
  reportId: string,
  limit: number = 3
): Resource[] {
  const pool = resourcePool.filter((r) => r.category === category);

  // Seeded shuffle using reportId so order varies per report
  const seed = reportId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const shuffled = [...pool].sort((a, b) => {
    const hashA = ((seed * a.id.charCodeAt(0)) % 97) - 48;
    const hashB = ((seed * b.id.charCodeAt(0)) % 97) - 48;
    return hashA - hashB;
  });

  return shuffled.slice(0, limit);
}
