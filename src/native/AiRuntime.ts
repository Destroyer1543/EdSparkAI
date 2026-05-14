import { NativeModules } from 'react-native'
import type { ExplainResult, TeacherPackResult } from '../store/appStore'

const { AiRuntimeModule } = NativeModules

const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada',
  ml: 'Malayalam', or: 'Odia', pa: 'Punjabi', ur: 'Urdu',
}
const langName = (code: string) => LANG_NAMES[code] ?? code

export const AiRuntime = {
  warmup(): Promise<void> {
    return AiRuntimeModule.warmup()
  },

  async explainPage(
    ocrText: string,
    lang: string,
    ragContext: string,
    difficulty: string,
  ): Promise<ExplainResult> {
    const raw: string = await AiRuntimeModule.explainPage(ocrText, langName(lang), ragContext, difficulty)
    try {
      return JSON.parse(raw) as ExplainResult
    } catch {
      throw new Error(`Model output invalid. Raw: ${raw.slice(0, 200)}`)
    }
  },

  async generateTeacherPack(
    ocrText: string,
    classGrade: string,
    lang: string,
  ): Promise<TeacherPackResult> {
    const raw: string = await AiRuntimeModule.generateTeacherPack(ocrText, classGrade, langName(lang))
    try {
      return JSON.parse(raw) as TeacherPackResult
    } catch {
      throw new Error(`Model output invalid. Raw: ${raw.slice(0, 200)}`)
    }
  },

  startChat(ocrText: string, explainSummary: string, lang: string): Promise<void> {
    return AiRuntimeModule.startChat(ocrText, explainSummary, langName(lang))
  },

  chat(message: string): Promise<string> {
    return AiRuntimeModule.chat(message)
  },

  chatWithImage(message: string, imagePath: string): Promise<string> {
    return AiRuntimeModule.chatWithImage(message, imagePath)
  },

  endChat(): Promise<void> {
    return AiRuntimeModule.endChat()
  },
}
