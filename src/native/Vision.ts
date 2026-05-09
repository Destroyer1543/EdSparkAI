import { NativeModules } from 'react-native'
import type { OcrBlock } from '../store/appStore'

const { VisionModule } = NativeModules

export const Vision = {
  recognizeText(imagePath: string): Promise<OcrBlock[]> {
    return VisionModule.recognizeText(imagePath)
  },
  getLastCameraPhoto(): Promise<string> {
    return VisionModule.getLastCameraPhoto()
  },
}
