import OpenAI from 'openai'

interface AnalyzeInput {
  transcript: string | null
  frameDescriptions: string[]
  niche: string
  audience: string
  goal: string
  hasTranscript: boolean
  hasFrames: boolean
}

export interface RubricScore {
  category: string
  score: number
  evidence: string
  finding: string
  recommendation: string
  celebration: string  // what they did well in this category
  pleasureAngle: string // positive motivation / reward framing
}

export interface VideoReport {
  overallScore: number
  evidenceSummary: string
  openingCelebration: string  // lead with genuine praise
  rubricScores: RubricScore[]
  strengths: string[]
  blockers: string[]
  actionChecklist: string[]
  measurementGuidance: string[]
  transcriptHighlights: string[]
  frameObservations: string[]
  missingEvidence: string[]
  generatedAt: string
}

// Rubric category tooltip definitions — shown in the UI on hover
export const RUBRIC_TOOLTIPS: Record<string, string> = {
  'Hook': 'The hook is the first 3–5 seconds of your video. Its job is to stop someone mid-scroll and make them want to keep watching. A strong hook speaks directly to your viewer\'s curiosity, pain, or desire.',
  'Problem Clarity': 'Problem clarity measures how clearly you articulate the specific pain, struggle, or challenge your target audience faces. Viewers need to feel "that\'s exactly my problem" within the first 15 seconds.',
  'Offer Clarity': 'Offer clarity is how clearly your product, service, or solution is explained. Viewers should instantly understand what you\'re offering, who it\'s for, and why it\'s different.',
  'Trust & Proof': 'Trust and proof covers any social proof, credentials, testimonials, case studies, or demonstrations that build credibility. People buy from those they trust — this score measures how well you earn that trust.',
  'CTA': 'CTA stands for Call To Action — the specific instruction you give viewers about what to do next (book a call, visit a link, comment below, etc.). A weak CTA is one of the most common reasons good videos fail to convert.',
  'Visual Communication': 'Visual communication scores how professional, clear, and engaging your visuals are — including lighting, captions, graphics, and how well the video looks on a small mobile screen.',
  'Platform Fit': 'Platform fit measures how well your video format, length, aspect ratio, and pacing match the expectations of the platform it\'s posted on (YouTube, Instagram, TikTok, LinkedIn, etc.).',
  'Measurement Readiness': 'Measurement readiness assesses whether your video has trackable goals — UTM links, specific landing pages, comment prompts, or other mechanisms that let you measure whether the video is actually working.',
}

// Curated expert resources per rubric category
// Complete plan: 1 YouTube link per category
// Premium plan: 1 YouTube link + 1 blog placeholder per category
export const RUBRIC_RESOURCES: Record<string, {
  youtube: { title: string; url: string; author: string }[]
  blog: { title: string; slug: string }[]
}> = {
  'Hook': {
    youtube: [
      { title: 'How to Write a Hook That Stops the Scroll', url: 'https://www.youtube.com/watch?v=m2CDXN_CQJQ', author: 'Alex Hormozi' },
      { title: 'The Perfect YouTube Hook Formula', url: 'https://www.youtube.com/watch?v=6ZZn0MNQkZk', author: 'VidIQ' },
    ],
    blog: [
      { title: 'How to Write a Hook That Stops the Scroll in 3 Seconds', slug: 'how-to-write-a-scroll-stopping-hook' },
    ],
  },
  'Problem Clarity': {
    youtube: [
      { title: 'How to Identify and Speak to Your Customer\'s Core Pain', url: 'https://www.youtube.com/watch?v=iMHIlKwILiQ', author: 'Alex Hormozi' },
      { title: 'Understanding Your Audience\'s Pain Points', url: 'https://www.youtube.com/watch?v=5MH3pnFDyiI', author: 'GaryVee' },
    ],
    blog: [
      { title: 'The Pain + Pleasure Framework: How to Speak to What Your Audience Really Wants', slug: 'pain-pleasure-framework-video-marketing' },
    ],
  },
  'Offer Clarity': {
    youtube: [
      { title: 'How to Make an Irresistible Offer', url: 'https://www.youtube.com/watch?v=UC5KEAKdMUM', author: 'Alex Hormozi' },
      { title: 'How to Clearly Explain Your Product in 60 Seconds', url: 'https://www.youtube.com/watch?v=Ye4qPtXoF-8', author: 'Donald Miller' },
    ],
    blog: [
      { title: 'How to Explain Your Offer So Clearly That Viewers Say "I Need That"', slug: 'how-to-explain-your-offer-clearly' },
    ],
  },
  'Trust & Proof': {
    youtube: [
      { title: 'How to Build Trust Fast With Social Proof', url: 'https://www.youtube.com/watch?v=7SRpFdBiHyk', author: 'Neil Patel' },
      { title: 'Using Testimonials & Case Studies in Video Marketing', url: 'https://www.youtube.com/watch?v=GK4e4GiRqo4', author: 'HubSpot' },
    ],
    blog: [
      { title: 'The 5 Types of Social Proof That Convert Viewers Into Buyers', slug: 'types-of-social-proof-that-convert' },
    ],
  },
  'CTA': {
    youtube: [
      { title: 'How to Write a CTA That Actually Gets Clicks', url: 'https://www.youtube.com/watch?v=gCDFPXQpQsM', author: 'Sunny Lenarduzzi' },
      { title: 'The Perfect Call to Action for Video', url: 'https://www.youtube.com/watch?v=7_OfR4EFhQI', author: 'VidIQ' },
    ],
    blog: [
      { title: 'How to Write a CTA That Converts: 7 Proven Formulas for Video', slug: 'how-to-write-cta-that-converts' },
    ],
  },
  'Visual Communication': {
    youtube: [
      { title: 'How to Make Professional Videos on a Budget', url: 'https://www.youtube.com/watch?v=FiMBmzajpyU', author: 'Think Media' },
      { title: 'Mobile Video Production Tips for Social Media', url: 'https://www.youtube.com/watch?v=WPfi4DP0_DQ', author: 'Sean Cannell' },
    ],
    blog: [
      { title: 'Visual Communication in Video: What Separates Amateur from Professional', slug: 'visual-communication-video-guide' },
    ],
  },
  'Platform Fit': {
    youtube: [
      { title: 'Video Format Guide: What Works on Each Platform', url: 'https://www.youtube.com/watch?v=K1ZnZGpYm-k', author: 'GaryVee' },
      { title: 'YouTube vs TikTok vs Instagram: Which Platform Is Right for You?', url: 'https://www.youtube.com/watch?v=vRKABqWbRmY', author: 'Think Media' },
    ],
    blog: [
      { title: 'Platform Fit 101: How to Format Your Video for Maximum Reach on Every Platform', slug: 'video-platform-fit-guide' },
    ],
  },
  'Measurement Readiness': {
    youtube: [
      { title: 'How to Track Your Video Marketing ROI', url: 'https://www.youtube.com/watch?v=h8RYCKtPOsU', author: 'Neil Patel' },
      { title: 'YouTube Analytics Explained for Beginners', url: 'https://www.youtube.com/watch?v=TNLFkOQZHR4', author: 'VidIQ' },
    ],
    blog: [
      { title: 'How to Know If Your Video Is Actually Working: A Measurement Guide for Creators', slug: 'how-to-measure-video-marketing-results' },
    ],
  },
}

export async function analyzeVideo(input: AnalyzeInput): Promise<VideoReport> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o'

  const evidenceBlock = buildEvidenceBlock(input)

  const prompt = `You are a world-class video marketing coach — part conversion strategist, part encouraging mentor. Your role is to give creators an honest, evidence-based audit that genuinely builds them up while identifying clear paths to improvement.

CORE PHILOSOPHY:
You believe great marketing speaks to both PAIN and PLEASURE. Pain = the problem the viewer wants to escape. Pleasure = the outcome they're excited to reach. The best videos address both. Your analysis must reflect this balance.

Your tone is that of a trusted expert who has reviewed thousands of videos. You celebrate genuine wins enthusiastically, you're honest about what needs work, and you always leave the creator feeling more capable and motivated than before they read your report — never deflated.

CRITICAL EVIDENCE RULE: Every finding must be grounded in the actual evidence provided. Do not invent or fabricate. If you cannot find evidence for something, say so clearly. Never produce generic advice that could apply to any video.

VIDEO CONTEXT:
- Industry/Niche: ${input.niche}
- Target Customer: ${input.audience}  
- Goal of Video: ${input.goal}

EVIDENCE:
${evidenceBlock}

YOUR TASK — produce a JSON report with this exact structure:

1. openingCelebration: Start with 2-3 sentences of genuine, specific praise based on what the evidence shows this creator did well. Be specific — reference actual content. This sets an encouraging tone before any critique.

2. evidenceSummary: 2-3 sentences on what evidence was available and the overall conversion potential you see.

3. rubricScores: Score each of the 8 categories below on a scale of 1-10 based ONLY on evidence:

   For EACH category provide:
   - score (1-10)
   - evidence: direct quote from transcript OR specific frame observation (or "INSUFFICIENT_EVIDENCE")
   - finding: what you found — written in a coaching voice, acknowledge what's working first
   - recommendation: specific, actionable improvement — frame it as an exciting opportunity, not just a fix. Include both the PAIN angle (problem to solve) AND the PLEASURE angle (positive outcome to amplify)
   - celebration: 1 sentence specifically celebrating something genuine in this category, even if the score is low. Find the positive. If truly nothing positive, celebrate their courage in creating content at all.
   - pleasureAngle: 1 sentence describing the positive outcome or reward the viewer could gain — the "towards" motivation, not just "away from pain"

   CATEGORIES:
   1. Hook — Does the opening stop the scroll?
   2. Problem Clarity — Is "${input.audience}"'s specific pain addressed?
   3. Offer Clarity — Is the solution clearly explained?
   4. Trust & Proof — Are credentials, results, or social proof present?
   5. CTA — Is there a specific call to action?
   6. Visual Communication — Are visuals clear and professional?
   7. Platform Fit — Does format/length/pacing match the platform?
   8. Measurement Readiness — Are tracking mechanisms present?

4. strengths: Array of 4-6 genuine strengths backed by evidence. Lead each with an enthusiastic but authentic opener. Mix pain-relief AND pleasure/aspiration framing across the list.

5. blockers: Array of 4-6 conversion blockers. Write each as a coachable opportunity, not a harsh criticism. Format: identify the gap, then immediately pivot to what fixing it could unlock.

6. actionChecklist: 6-8 specific, prioritised action items. Start each with a verb. Order from highest-impact to lowest. Frame as "your path to [positive outcome]" not just "fix this."

7. measurementGuidance: 4-5 specific measurement suggestions tied to the goal.

8. transcriptHighlights: 3-5 most significant direct quotes from the transcript.

9. frameObservations: 3-5 most significant visual observations.

10. missingEvidence: What could not be assessed and why.

11. overallScore: A number 1-100 reflecting overall conversion potential.

Respond ONLY with a valid JSON object matching this structure exactly:
{
  "overallScore": <number>,
  "openingCelebration": "<string>",
  "evidenceSummary": "<string>",
  "rubricScores": [
    {
      "category": "<string>",
      "score": <number>,
      "evidence": "<string>",
      "finding": "<string>",
      "recommendation": "<string>",
      "celebration": "<string>",
      "pleasureAngle": "<string>"
    }
  ],
  "strengths": ["<string>"],
  "blockers": ["<string>"],
  "actionChecklist": ["<string>"],
  "measurementGuidance": ["<string>"],
  "transcriptHighlights": ["<string>"],
  "frameObservations": ["<string>"],
  "missingEvidence": ["<string>"]
}`

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content || '{}'

  try {
    const parsed = JSON.parse(raw)
    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    throw new Error('Failed to parse analysis response from AI')
  }
}

function buildEvidenceBlock(input: AnalyzeInput): string {
  const parts: string[] = []

  if (input.hasTranscript && input.transcript) {
    const words = input.transcript.split(' ')
    const opening = words.slice(0, 60).join(' ')
    const closing = words.slice(-40).join(' ')
    parts.push(`TRANSCRIPT (${words.length} words total):
Opening (first 60 words): "${opening}"
Closing (last 40 words): "${closing}"
Full transcript: "${input.transcript}"`)
  } else {
    parts.push('TRANSCRIPT: Not available — video appears to have no speech or audio could not be extracted.')
  }

  if (input.hasFrames && input.frameDescriptions.length > 0) {
    parts.push(`FRAME OBSERVATIONS (${input.frameDescriptions.length} frames sampled):
${input.frameDescriptions.join('\n')}`)
  } else {
    parts.push('FRAME OBSERVATIONS: Not available — frames could not be extracted.')
  }

  return parts.join('\n\n')
}
