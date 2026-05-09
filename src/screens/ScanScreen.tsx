import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, ActivityIndicator, Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA } from '../theme'
import { useStore } from '../store/appStore'
import { Vision } from '../native/Vision'
import { Camera } from '../native/Camera'

const { width: W } = Dimensions.get('window')

export default function ScanScreen() {
  const nav = useNavigation<any>()
  const [captured, setCaptured] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const { setCurrentPage, setSelectedBlock } = useStore()

  async function openCamera() {
    try {
      const path = await Camera.takePhoto()
      setCaptured(path)
    } catch (e: any) {
      if (e?.message !== 'Cancelled') {
        Alert.alert('Camera error', e.message ?? 'Could not open camera.')
      }
    }
  }

  async function processPhoto() {
    if (!captured) return
    try {
      setScanning(true)
      const blocks = await Vision.recognizeText(captured)
      if (blocks.length === 0) {
        Alert.alert('No text found', 'Try better lighting or a clearer angle.')
        return
      }
      setCurrentPage(captured, blocks)
      const fullText = blocks.map(b => b.text).join('\n')
      setSelectedBlock(fullText)
      nav.navigate('Explain')
    } catch (e: any) {
      Alert.alert('OCR Error', e.message)
    } finally {
      setScanning(false)
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={{fontSize:22,color:C.textPrimary}}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Scan Page</Text>
        <View style={{ width: 24 }} />
      </View>

      {!captured ? (
        <View style={s.promptArea}>
          <View style={s.iconBox}>
            <Image source={require('../assets/icons/ic_scan.png')} style={{ width: 48, height: 48 }} />
          </View>
          <Text style={s.promptTitle}>Scan a textbook page</Text>
          <Text style={s.promptSub}>पाठ्यपुस्तक का पन्ना स्कैन करें</Text>
          <Text style={s.promptHint}>Point the camera at a printed page and hold steady.</Text>

          <TouchableOpacity style={s.ctaBtn} onPress={openCamera} activeOpacity={0.85}>
            <Image source={require('../assets/icons/ic_camera.png')} style={{ width: 22, height: 22, tintColor: '#fff' }} />
            <Text style={s.ctaBtnText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={s.previewWrap}>
            <Image source={{ uri: `file://${captured}` }} style={s.preview} resizeMode="contain" />
          </View>
          <View style={s.bottomBar}>
            <View style={s.row}>
              <TouchableOpacity style={s.retakeBtn} onPress={openCamera}>
                <Text style={s.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.useBtn} onPress={processPhoto} disabled={scanning}>
                {scanning
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={{fontSize:18,color:'#fff'}}>✓</Text>
                      <Text style={s.useBtnText}>Use This Page</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.surface1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s3, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface3 },
  headerTitle:    { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  promptArea:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SP.s5 },
  iconBox:        { width: 100, height: 100, borderRadius: R.xl, backgroundColor: C.brand100, alignItems: 'center', justifyContent: 'center', marginBottom: SP.s4 },
  promptTitle:    { fontSize: 22, fontWeight: '600', color: C.textPrimary, marginBottom: SP.s1 },
  promptSub:      { fontSize: 15, color: C.textSecondary, marginBottom: SP.s3 },
  promptHint:     { fontSize: 13, color: C.textTertiary, textAlign: 'center', lineHeight: 20, marginBottom: SP.s6 },
  ctaBtn:         { flexDirection: 'row', gap: SP.s2, backgroundColor: C.brand500, borderRadius: R.lg, height: TOUCH_CTA, paddingHorizontal: SP.s5, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: SP.s3 },
  ctaBtnText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  previewWrap:    { flex: 1, backgroundColor: C.surface0Dark },
  preview:        { flex: 1, width: W },
  bottomBar:      { paddingHorizontal: SP.s4, paddingVertical: SP.s4, paddingBottom: SP.s6, backgroundColor: C.surface0, borderTopWidth: 1, borderTopColor: C.surface3 },
  row:            { flexDirection: 'row', gap: SP.s3 },
  retakeBtn:      { flex: 1, height: TOUCH_CTA, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.surface3, alignItems: 'center', justifyContent: 'center' },
  retakeBtnText:  { color: C.textSecondary, fontSize: 15, fontWeight: '500' },
  useBtn:         { flex: 2, height: TOUCH_CTA, borderRadius: R.lg, backgroundColor: C.brand500, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.s2 },
  useBtnText:     { color: '#fff', fontSize: 15, fontWeight: '600' },
})
