import { NativeModules, PermissionsAndroid } from 'react-native'

const { SpeechInputModule } = NativeModules

export const SpeechInput = {
  async startListening(lang: string): Promise<string> {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
    return SpeechInputModule.startListening(lang)
  },
  stopListening(): Promise<void> {
    return SpeechInputModule.stopListening()
  },
}
