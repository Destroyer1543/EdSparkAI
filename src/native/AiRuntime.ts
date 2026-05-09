import { NativeModules } from 'react-native'
import type { ExplainResult, TeacherPackResult } from '../store/appStore'

const { AiRuntimeModule } = NativeModules

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
    const raw: string = await AiRuntimeModule.explainPage(ocrText, lang, ragContext, difficulty)
    return JSON.parse(raw) as ExplainResult
  },

  async generateTeacherPack(
    ocrText: string,
    classGrade: string,
    lang: string,
  ): Promise<TeacherPackResult> {
    const raw: string = await AiRuntimeModule.generateTeacherPack(ocrText, classGrade, lang)
    return JSON.parse(raw) as TeacherPackResult
  },

  startChat(ocrText: string, explainSummary: string, lang: string): Promise<void> {
    return AiRuntimeModule.startChat(ocrText, explainSummary, lang)
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
