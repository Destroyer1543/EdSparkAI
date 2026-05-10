import { NativeModules, NativeEventEmitter } from 'react-native'

const { ModelDownloadModule } = NativeModules
const emitter = new NativeEventEmitter(ModelDownloadModule)

export const ModelDownload = {
  checkModelExists: (): Promise<boolean> => ModelDownloadModule.checkModelExists(),
  getModelPath: (): Promise<string>  => ModelDownloadModule.getModelPath(),
  downloadModel: (url: string): Promise<string> => ModelDownloadModule.downloadModel(url),
  cancelDownload: (): Promise<void>  => ModelDownloadModule.cancelDownload(),
  onProgress: (cb: (e: { bytesDownloaded: number; totalBytes: number; percent: number }) => void) =>
    emitter.addListener('ModelDownloadProgress', cb),
}
