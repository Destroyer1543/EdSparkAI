import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, ActivityIndicator, Alert, PanResponder,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import BackButton from '../components/BackButton'
import { C, SP, R, TOUCH_CTA } from '../theme'
import { useStore } from '../store/appStore'
import { Vision } from '../native/Vision'
import { Camera } from '../native/Camera'

const { width: SW } = Dimensions.get('window')
const TOUCH = 48
const DOT   = 16
const MIN   = 80

interface Rect   { left: number; top: number; right: number; bottom: number }
interface Layout { ox: number; oy: number; dw: number; dh: number }

export default function ScanScreen() {
  const nav = useNavigation<any>()
  const [captured, setCaptured] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cSize, setCSize]       = useState({ w: SW, h: 1 })
  const [imgNat, setImgNat]     = useState({ w: 1, h: 1 })
  const [crop, setCrop]         = useState<Rect>({ left: 0, top: 0, right: 100, bottom: 100 })
  const cropR      = useRef<Rect>(crop)
  const layR       = useRef<Layout>({ ox: 0, oy: 0, dw: 0, dh: 0 })
  const containerRef = useRef<View>(null)
  const pageOffset   = useRef({ x: 0, y: 0 })
  const { setCurrentPage, setSelectedBlock, setExplainResult } = useStore()

  useEffect(() => {
    setExplainResult(null)
  }, [])

  useEffect(() => {
    if (!captured || imgNat.w <= 1 || cSize.h <= 1) return
    const scale = Math.min(cSize.w / imgNat.w, cSize.h / imgNat.h)
    const dw = imgNat.w * scale
    const dh = imgNat.h * scale
    const lay: Layout = { ox: (cSize.w - dw) / 2, oy: (cSize.h - dh) / 2, dw, dh }
    layR.current = lay
    const r: Rect = {
      left:   lay.ox + dw * 0.05,
      top:    lay.oy + dh * 0.05,
      right:  lay.ox + dw * 0.95,
      bottom: lay.oy + dh * 0.95,
    }
    cropR.current = r
    setCrop({ ...r })
  }, [cSize, imgNat, captured])

  function makePan(corner: 'TL' | 'TR' | 'BL' | 'BR') {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        // Subtract container's page offset so coords are relative to imgWrap
        const rx = gs.moveX - pageOffset.current.x
        const ry = gs.moveY - pageOffset.current.y
        const r = { ...cropR.current }
        const { ox, oy, dw, dh } = layR.current
        if (corner === 'TL' || corner === 'BL')
          r.left   = Math.max(ox,      Math.min(r.right  - MIN, rx))
        if (corner === 'TR' || corner === 'BR')
          r.right  = Math.min(ox + dw, Math.max(r.left   + MIN, rx))
        if (corner === 'TL' || corner === 'TR')
          r.top    = Math.max(oy,      Math.min(r.bottom - MIN, ry))
        if (corner === 'BL' || corner === 'BR')
          r.bottom = Math.min(oy + dh, Math.max(r.top    + MIN, ry))
        cropR.current = r
        setCrop({ ...r })
      },
    })
  }

  const panTL = useRef(makePan('TL')).current
  const panTR = useRef(makePan('TR')).current
  const panBL = useRef(makePan('BL')).current
  const panBR = useRef(makePan('BR')).current

  async function openCamera() {
    try {
      const path = await Camera.takePhoto()
      setCaptured(path)
      Image.getSize(`file://${path}`, (w, h) => setImgNat({ w, h }))
    } catch (e: any) {
      if (e?.message !== 'Cancelled') Alert.alert('Camera error', e.message ?? 'Could not open camera.')
    }
  }

  async function scanPhoto() {
    if (!captured) return
    setScanning(true)
    try {
      let photoPath = captured
      const { ox, oy, dw, dh } = layR.current
      if (dw > 0 && dh > 0) {
        const { left, top, right, bottom } = cropR.current
        const xr = Math.max(0, (left - ox) / dw)
        const yr = Math.max(0, (top  - oy) / dh)
        const wr = Math.min(1 - xr, (right - left)  / dw)
        const hr = Math.min(1 - yr, (bottom - top)  / dh)
        if (wr > 0.02 && hr > 0.02) {
          photoPath = await Vision.cropImage(captured, xr, yr, wr, hr)
        }
      }
      const blocks = await Vision.recognizeText(photoPath)
      if (blocks.length === 0) {
        Alert.alert('No text found', 'Try better lighting or a clearer angle.')
        return
      }
      setCurrentPage(photoPath, blocks)
      setSelectedBlock(blocks.map(b => b.text).join('\n'))
      nav.navigate('Explain')
    } catch (e: any) {
      Alert.alert('OCR Error', e.message)
    } finally {
      setScanning(false)
    }
  }

  const cw = crop.right - crop.left
  const ch = crop.bottom - crop.top

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <View style={s.header}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={s.headerTitle}>Scan Page</Text>
        <View style={{ width: 36 }} />
      </View>

      {!captured ? (
        <View style={s.empty}>
          <View style={s.iconRing}>
            <Image source={require('../assets/icons/ic_camera.png')} style={s.emptyIcon} />
          </View>
          <Text style={s.emptyTitle}>Scan a Textbook Page</Text>
          <Text style={s.emptyNative}>पाठ्यपुस्तक का पन्ना स्कैन करें</Text>
          <Text style={s.emptyHint}>
            Point the camera at any printed page.{'\n'}Hold steady for best results.
          </Text>
          <View style={s.tipRow}>
            {['Good lighting', 'Flat surface', 'Fill frame'].map(t => (
              <View key={t} style={s.tip}><Text style={s.tipTxt}>{t}</Text></View>
            ))}
          </View>
          <TouchableOpacity style={s.ctaBtn} onPress={openCamera} activeOpacity={0.85}>
            <Text style={s.ctaTxt}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            ref={containerRef}
            style={s.imgWrap}
            onLayout={e => {
              const { width: w, height: h } = e.nativeEvent.layout
              setCSize({ w, h })
              // Measure absolute page position after layout
              containerRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
                pageOffset.current = { x: pageX, y: pageY }
              })
            }}
          >
            <Image source={{ uri: `file://${captured}` }} style={s.preview} resizeMode="contain" />

            {cw > 0 && ch > 0 && (
              <>
                <View style={[s.dim, { top: 0,           left: 0, right: 0, height: crop.top }]} />
                <View style={[s.dim, { top: crop.bottom, left: 0, right: 0, bottom: 0 }]} />
                <View style={[s.dim, { top: crop.top, left: 0,          width: crop.left,  height: ch }]} />
                <View style={[s.dim, { top: crop.top, left: crop.right, right: 0,          height: ch }]} />

                <View style={[s.cropBox, { left: crop.left, top: crop.top, width: cw, height: ch }]} />

                {/* Rule-of-thirds grid */}
                <View style={[s.grid, { left: crop.left, top: crop.top + ch/3,   width: cw, height: 1 }]} />
                <View style={[s.grid, { left: crop.left, top: crop.top + ch*2/3, width: cw, height: 1 }]} />
                <View style={[s.grid, { left: crop.left + cw/3,   top: crop.top, width: 1, height: ch }]} />
                <View style={[s.grid, { left: crop.left + cw*2/3, top: crop.top, width: 1, height: ch }]} />

                {/* TL */}
                <View style={[s.handle, { left: crop.left  - TOUCH/2, top: crop.top    - TOUCH/2 }]} {...panTL.panHandlers}>
                  <View style={s.dot} />
                </View>
                {/* TR */}
                <View style={[s.handle, { left: crop.right - TOUCH/2, top: crop.top    - TOUCH/2 }]} {...panTR.panHandlers}>
                  <View style={s.dot} />
                </View>
                {/* BL */}
                <View style={[s.handle, { left: crop.left  - TOUCH/2, top: crop.bottom - TOUCH/2 }]} {...panBL.panHandlers}>
                  <View style={s.dot} />
                </View>
                {/* BR */}
                <View style={[s.handle, { left: crop.right - TOUCH/2, top: crop.bottom - TOUCH/2 }]} {...panBR.panHandlers}>
                  <View style={s.dot} />
                </View>
              </>
            )}
          </View>

          <View style={s.bottomBar}>
            <TouchableOpacity style={s.retakeBtn} onPress={openCamera} disabled={scanning} activeOpacity={0.75}>
              <Text style={s.retakeTxt}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.useBtn} onPress={scanPhoto} disabled={scanning} activeOpacity={0.85}>
              {scanning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.useBtnTxt}>Crop & Scan</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.surface1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s3, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface3 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SP.s5, paddingBottom: SP.s6 },
  iconRing:    { width: 110, height: 110, borderRadius: 55, backgroundColor: C.brand100, alignItems: 'center', justifyContent: 'center', marginBottom: SP.s5 },
  emptyIcon:   { width: 52, height: 52, tintColor: C.brand500 },
  emptyTitle:  { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: SP.s1, letterSpacing: -0.3 },
  emptyNative: { fontSize: 15, color: C.textSecondary, marginBottom: SP.s3 },
  emptyHint:   { fontSize: 14, color: C.textTertiary, textAlign: 'center', lineHeight: 22, marginBottom: SP.s4 },
  tipRow:      { flexDirection: 'row', gap: SP.s2, marginBottom: SP.s6 },
  tip:         { paddingHorizontal: SP.s3, paddingVertical: SP.s1, borderRadius: R.full, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.surface3 },
  tipTxt:      { fontSize: 12, color: C.textTertiary, fontWeight: '500' },
  ctaBtn:      { backgroundColor: C.brand500, borderRadius: R.lg, height: TOUCH_CTA, paddingHorizontal: SP.s6, alignItems: 'center', justifyContent: 'center', width: '100%' },
  ctaTxt:      { color: '#fff', fontSize: 16, fontWeight: '600' },

  imgWrap:     { flex: 1, backgroundColor: '#111' },
  preview:     { flex: 1, width: '100%' },
  dim:         { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.52)' },
  cropBox:     { position: 'absolute', borderWidth: 1.5, borderColor: '#fff' },
  grid:        { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.22)' },
  handle:      { position: 'absolute', width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  dot:         { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: '#fff', borderWidth: 2.5, borderColor: C.brand500 },

  bottomBar:   { flexDirection: 'row', gap: SP.s3, paddingHorizontal: SP.s4, paddingVertical: SP.s4, paddingBottom: SP.s6, backgroundColor: C.surface0, borderTopWidth: 1, borderTopColor: C.surface3 },
  retakeBtn:   { flex: 1, height: TOUCH_CTA, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.surface3, alignItems: 'center', justifyContent: 'center' },
  retakeTxt:   { color: C.textSecondary, fontSize: 15, fontWeight: '500' },
  useBtn:      { flex: 2, height: TOUCH_CTA, borderRadius: R.lg, backgroundColor: C.brand500, alignItems: 'center', justifyContent: 'center' },
  useBtnTxt:   { color: '#fff', fontSize: 15, fontWeight: '600' },
})
