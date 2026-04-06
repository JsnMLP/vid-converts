import { createReadStream } from 'fs'
import OpenAI from 'openai'

export async function transcribeAudio(audioPath: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1'

  try {
    const response = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model,
      response_format: 'text',
    })

    return typeof response === 'string' ? response : (response as any).text || ''
  } catch (error: any) {
    if (error?.status === 400) {
      throw new Error('NO_SPEECH_DETECTED')
    }
    throw new Error(`Transcription failed: ${error.message}`)
  }
}
