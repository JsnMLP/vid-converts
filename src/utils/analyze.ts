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
  score: number // 1-10
  evidence: string // direct quote or frame observation
  finding: string // what we found
  recommendation: string // what to change
}

export interface VideoReport {
  overallScore: number
  evidenceSummary: string
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

export async function analyzeVideo(input: AnalyzeInput): Promise<VideoReport> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o'

  const evidenceBlock = buildEvidenceBlock(input)

  const prompt = `You are a video conversion specialist auditing a marketing video. Your job is to produce an evidence-based conversion audit report.

CRITICAL RULE: Every finding must be grounded in the actual evidence provided below. Do not invent, assume, or fabricate anything. If you cannot find evidence for a rubric category, say so explicitly. Never produce generic advice that could apply to any video.

VIDEO CONTEXT:
- Industry/Niche: ${input.niche}
- Target Customer: ${input.audience}
- Goal of Video: ${input.goal}

EVIDENCE AVAILABLE:
${evidenceBlock}

CONVERSION RUBRIC — score each category 1-10 based ONLY on the evidence above:
1. Hook — Does the opening stop the scroll? Quote the actual opening words.
2. Problem Clarity — Is the specific pain of "${input.audience}" addressed? What was said?
3. Offer Clarity — Is the solution/offer clearly explained? What was stated?
4. Trust & Proof — Are credentials, results, or social proof shown or mentioned?
5. CTA — Is there a specific call to action? What exactly does it say?
6. Visual Communication — Are visuals clear, professional, and readable on mobile?
7. Platform Fit — Does the format, length, and pacing match the likely platform?
8. Measurement Readiness — Are tracking mechanisms or measurable goals present?

Respond ONLY with a valid JSON object in this exact structure:
{
  "overallScore": <number 1-100>,
  "evidenceSummary": "<2-3 sentences describing what evidence was available and what could/could not be assessed>",
  "rubricScores": [
    {
      "category": "<category name>",
      "score": <1-10>,
      "evidence": "<direct quote from transcript OR frame description — if none available write INSUFFICIENT_EVIDENCE>",
      "finding": "<what you found based on the evidence>",
      "recommendation": "<specific, actionable improvement based on the finding>"
    }
  ],
  "strengths": ["<strength backed by specific evidence>"],
  "blockers": ["<blocker backed by specific evidence>"],
  "actionChecklist": ["<specific action item>"],
  "measurementGuidance": ["<specific measurement suggestion>"],
  "transcriptHighlights": ["<direct quote from transcript that is significant>"],
  "frameObservations": ["<observation from a specific frame>"],
  "missingEvidence": ["<what could not be assessed and why>"]
}`

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
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
