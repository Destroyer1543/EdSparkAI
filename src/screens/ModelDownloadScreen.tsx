import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA } from '../theme'
import { ModelDownload } from '../native/ModelDownload'
import { AiRuntime } from '../native/AiRuntime'
import { useStore } from '../store/appStore'

const MODEL_URL = 'https://huggingface.co/DummyTesty/gemmaspark-model/resolve/main/model.litertlm'
const TOTAL_GB  = 2.4

type Phase = 'idle' | 'downloading' | 'warming' | 'done'

function fmt(bytes: number) {
  return (bytes / 1e9).toFixed(2) + ' GB'
}

export default function ModelDownloadScreen() {
  const nav = useNavigation<any>()
  const { setModelReady, setModelLoading } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [percent, setPercent] = useState(0)
  const [downloaded, setDownloaded] = useState(0)
  const [total, setTotal] = useState(TOTAL_GB * 1e9)
  const [speed, setSpeed] = useState(0)
  const subRef = useRef<any>(null)
  const lastRef = useRef({ bytes: 0, time: Date.now() })

  useEffect(() => () => { subRef.current?.remove() }, [])

  async function startDownload() {
    setPhase('downloading')
    setPercent(0)
    subRef.current?.remove()
    lastRef.current = { bytes: 0, time: Date.now() }
    subRef.current = ModelDownload.onProgress(e => {
      setPercent(e.percent)
      setDownloaded(e.bytesDownloaded)
      if (e.totalBytes > 0) setTotal(e.totalBytes)
      const now = Date.now()
      const dt = (now - lastRef.current.time) / 1000
      if (dt >= 1) {
        const mbps = (e.bytesDownloaded - lastRef.current.bytes) / dt / 1e6
        setSpeed(mbps)
        lastRef.current = { bytes: e.bytesDownloaded, time: now }
      }
    })
    try {
      await ModelDownload.downloadModel(MODEL_URL)
      subRef.current?.remove()
      await warmup()
    } catch (e: any) {
      subRef.current?.remove()
      setPhase('idle')
      Alert.alert('Download failed', e.message + '\n\nCheck WiFi and retry.')
    }
  }

  async function warmup() {
    setPhase('warming')
    setModelLoading(true)
    try {
      await AiRuntime.warmup()
      setModelReady(true)
    } catch {}
    finally { setModelLoading(false) }
    setPhase('done')
    nav.replace('Onboarding')
  }

  const barWidth = `${Math.min(percent, 100)}%` as any

  return (
    <View style={s.root}>
      <Image source={require('../assets/icons/gemmaspark_logo.png')} style={s.logo} resizeMode="contain" />

      <Text style={s.title}>
        {phase === 'warming' ? 'Loading Gemma 4…' : 'Download Gemma 4'}
      </Text>
      <Text style={s.sub}>
        {phase === 'idle'
          ? `One-time download · ~${TOTAL_GB} GB · Use WiFi`
          : phase === 'warming'
          ? 'Initialising engine, takes 1–2 min'
          : `${fmt(downloaded)} / ${fmt(total)}`}
      </Text>

      <View style={s.barTrack}>
        <View style={[s.barFill, { width: phase === 'warming' ? '100%' : barWidth }]} />
      </View>

      {phase !== 'idle' && (
        <Text style={s.pct}>
          {phase === 'warming'
            ? 'Starting up…'
            : `${percent.toFixed(1)}%${speed > 0 ? `  ·  ${speed.toFixed(1)} MB/s` : ''}`}
        </Text>
      )}

      {(phase === 'idle') && (
        <TouchableOpacity style={s.btn} onPress={startDownload} activeOpacity={0.85}>
          <Text style={s.btnText}>{'Download & Start'}</Text>
        </TouchableOpacity>
      )}

      {phase === 'downloading' && (
        <TouchableOpacity style={s.cancelBtn} onPress={() => {
          ModelDownload.cancelDownload()
          setPhase('idle')
        }}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SP.s6 },
  logo:      { width: 220, height: 50, marginBottom: SP.s6 },
  title:     { fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: SP.s2 },
  sub:       { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: SP.s5 },
  barTrack:  { width: '100%', height: 6, borderRadius: 3, backgroundColor: C.surface2, overflow: 'hidden', marginBottom: SP.s2 },
  barFill:   { height: 6, borderRadius: 3, backgroundColor: C.brand500 },
  pct:       { fontSize: 13, color: C.textTertiary, marginBottom: SP.s5 },
  btn:       { width: '100%', height: TOUCH_CTA, backgroundColor: C.brand500, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', marginTop: SP.s2 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { marginTop: SP.s3, height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText:{ fontSize: 14, color: C.textTertiary },
})
