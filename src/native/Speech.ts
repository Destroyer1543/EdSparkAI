import { NativeModules } from 'react-native'

const { SpeechModule } = NativeModules

export const Speech = {
  speak(text: string, lang: string): Promise<void> {
    return SpeechModule.speak(text, lang)
  },
  stop(): Promise<void> {
    return SpeechModule.stop()
  },
}
