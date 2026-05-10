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
  cropImage(imagePath: string, xRatio: number, yRatio: number, wRatio: number, hRatio: number): Promise<string> {
    return VisionModule.cropImage(imagePath, xRatio, yRatio, wRatio, hRatio)
  },
}
