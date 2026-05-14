import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface QuizQuestion {
  question: string
  options: string[]
  correct_index: number
}

export interface ExplainResult {
  simple_explanation: string
  local_language_explanation: string
  key_points: string[]
  daily_life_example: string
  grounding_source: string
  quiz: QuizQuestion[]
}

export interface TeacherPackResult {
  objective: string
  blackboard_summary: string
  recap_5_min: string
  worksheet: string
  homework: string
  slow_learner_version: string
  advanced_challenge: string
}

export interface OcrBlock {
  text: string
  bounds: { left: number; top: number; right: number; bottom: number }
}

export type Lang = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' | 'pa' | 'ur'

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

export interface ChatSession {
  id: string
  title: string
  preview: string
  ocrText: string
  explainSummary: string
  language: Lang
  messages: ChatMessage[]
  savedAt: number
}

export const LANG_LABELS: Record<Lang, { en: string; native: string }> = {
  en: { en: 'English',   native: 'English' },
  hi: { en: 'Hindi',     native: 'हिंदी' },
  ta: { en: 'Tamil',     native: 'தமிழ்' },
  te: { en: 'Telugu',    native: 'తెలుగు' },
  bn: { en: 'Bengali',   native: 'বাংলা' },
  mr: { en: 'Marathi',   native: 'मराठी' },
  gu: { en: 'Gujarati',  native: 'ગુજરાતી' },
  kn: { en: 'Kannada',   native: 'ಕನ್ನಡ' },
  ml: { en: 'Malayalam', native: 'മലയാളം' },
  or: { en: 'Odia',      native: 'ଓଡ଼ିଆ' },
  pa: { en: 'Punjabi',   native: 'ਪੰਜਾਬੀ' },
  ur: { en: 'Urdu',      native: 'اردو' },
}

interface AppState {
  _hydrated: boolean
  modelExists: boolean | null
  modelReady: boolean
  modelLoading: boolean
  hasOnboarded: boolean
  language: Lang
  classGrade: string
  subject: string

  currentImagePath: string
  currentOcrBlocks: OcrBlock[]
  selectedBlockText: string

  difficulty: 'simple' | 'grade' | 'advanced'
  explainResult: ExplainResult | null
  teacherPackResult: TeacherPackResult | null
  inferring: boolean
  explanationsGenerated: number
  weakTopics: { topic: string; wrongCount: number }[]
  chatSessions: ChatSession[]

  setModelExists: (v: boolean | null) => void
  setModelReady: (v: boolean) => void
  setModelLoading: (v: boolean) => void
  setHasOnboarded: (v: boolean) => void
  setLanguage: (l: Lang) => void
  setClassGrade: (g: string) => void
  setSubject: (s: string) => void
  setCurrentPage: (imagePath: string, blocks: OcrBlock[]) => void
  setSelectedBlock: (text: string) => void
  setDifficulty: (d: 'simple' | 'grade' | 'advanced') => void
  setExplainResult: (r: ExplainResult | null) => void
  setTeacherPackResult: (r: TeacherPackResult | null) => void
  setInferring: (v: boolean) => void
  incrementExplanations: () => void
  recordQuizResult: (topic: string, wrong: number, total: number) => void
  saveChatSession: (session: ChatSession) => void
  deleteChatSession: (id: string) => void
  reset: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      _hydrated: false,
      modelExists: null,
      modelReady: false,
      modelLoading: false,
      hasOnboarded: false,
      language: 'hi',
      classGrade: '7',
      subject: 'Science',

      currentImagePath: '',
      currentOcrBlocks: [],
      selectedBlockText: '',

      difficulty: 'grade',
      explainResult: null,
      teacherPackResult: null,
      inferring: false,
      explanationsGenerated: 0,
      weakTopics: [],
      chatSessions: [],

      setModelExists:     (v) => set({ modelExists: v }),
      setModelReady:      (v) => set({ modelReady: v }),
      setModelLoading:    (v) => set({ modelLoading: v }),
      setHasOnboarded:    (v) => set({ hasOnboarded: v }),
      setLanguage:        (l) => set({ language: l }),
      setClassGrade:      (g) => set({ classGrade: g }),
      setSubject:         (s) => set({ subject: s }),
      setCurrentPage:     (imagePath, blocks) => set({ currentImagePath: imagePath, currentOcrBlocks: blocks }),
      setSelectedBlock:   (text) => set({ selectedBlockText: text }),
      setDifficulty:      (d) => set({ difficulty: d }),
      setExplainResult:   (r) => set({ explainResult: r }),
      setTeacherPackResult: (r) => set({ teacherPackResult: r }),
      setInferring:       (v) => set({ inferring: v }),
      incrementExplanations: () => set((s) => ({ explanationsGenerated: s.explanationsGenerated + 1 })),
      saveChatSession: (session) => set((s) => {
        const exists = s.chatSessions.find(c => c.id === session.id)
        const updated = exists
          ? s.chatSessions.map(c => c.id === session.id ? session : c)
          : [session, ...s.chatSessions]
        return { chatSessions: updated.slice(0, 20) }
      }),
      deleteChatSession: (id) => set((s) => ({ chatSessions: s.chatSessions.filter(c => c.id !== id) })),
      recordQuizResult: (topic, wrong, total) => set((s) => {
        if (wrong === 0) return s
        const existing = s.weakTopics.find(t => t.topic === topic)
        const updated = existing
          ? s.weakTopics.map(t => t.topic === topic ? { ...t, wrongCount: t.wrongCount + wrong } : t)
          : [...s.weakTopics, { topic, wrongCount: wrong }]
        return { weakTopics: updated.sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 5) }
      }),
      reset: () => set({ currentImagePath: '', currentOcrBlocks: [], selectedBlockText: '', explainResult: null }),
    }),
    {
      name: 'gemmaspark-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state) => { useStore.setState({ _hydrated: true }) },
      partialize: (s) => ({
        hasOnboarded:          s.hasOnboarded,
        language:              s.language,
        classGrade:            s.classGrade,
        explanationsGenerated: s.explanationsGenerated,
        weakTopics:            s.weakTopics,
        chatSessions:          s.chatSessions,
      }),
    }
  )
)
