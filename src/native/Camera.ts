import { NativeModules, PermissionsAndroid, Platform } from 'react-native'

const { CameraModule } = NativeModules

export const Camera = {
  async takePhoto(): Promise<string> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      )
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Camera permission denied')
      }
    }
    return CameraModule.takePhoto()
  },
}
