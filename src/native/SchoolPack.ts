import { NativeModules } from 'react-native'

const { SchoolPackModule } = NativeModules

export const SchoolPack = {
  importPack(jsonPath: string): Promise<void> {
    return SchoolPackModule.importPack(jsonPath)
  },
  retrieve(query: string, grade: string, subject: string): Promise<string> {
    return SchoolPackModule.retrieve(query, grade, subject)
  },
  recordAttempt(studentId: string, chunkId: string, isCorrect: boolean): Promise<void> {
    return SchoolPackModule.recordAttempt(studentId, chunkId, isCorrect)
  },
  getWeakTopics(studentId: string): Promise<{ topic: string; score: number }[]> {
    return SchoolPackModule.getWeakTopics(studentId)
  },
}
