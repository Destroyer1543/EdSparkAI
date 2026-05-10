import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Animated, Easing,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA, shadowBrand } from '../theme'
import { useStore, LANG_LABELS, Lang } from '../store/appStore'

const LANGS: Lang[] = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'ur']
const GRADES = ['5', '6', '7', '8', '9', '10', '11', '12', 'UG', 'General']

function LoadingScreen() {
  const slide = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-90, 270] })

  return (
    <View style={ls.root}>
      <Image source={require('../assets/icons/gemmaspark_logo.png')} style={ls.logo} resizeMode="contain" />
      <Text style={ls.title}>Preparing your AI tutor</Text>
      <Text style={ls.hint}>Might take a minute or two</Text>
      <View style={ls.barTrack}>
        <Animated.View style={[ls.barFill, { transform: [{ translateX }] }]} />
      </View>
    </View>
  )
}

export default function OnboardingScreen() {
  const nav = useNavigation<any>()
  const { language, setLanguage, classGrade, setClassGrade, modelLoading, setHasOnboarded } = useStore()
  const [step, setStep] = useState<'lang' | 'grade'>('lang')

  if (modelLoading) return <LoadingScreen />

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Image source={require('../assets/icons/gemmaspark_logo.png')} style={s.logo} resizeMode="contain" />
      </View>

      {step === 'lang' ? (
        <View style={s.stepWrap}>
          <Text style={s.stepTitle}>Choose your language</Text>
          <Text style={s.stepSub}>How should EdSparkAI explain things to you?</Text>
          <ScrollView style={s.listWrap} showsVerticalScrollIndicator={false}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l}
                style={[s.langRow, language === l && s.langRowActive]}
                onPress={() => setLanguage(l)}
                activeOpacity={0.7}
              >
                <Text style={[s.langNative, language === l && s.langNativeActive]}>{LANG_LABELS[l].native}</Text>
                <Text style={[s.langEn, language === l && s.langEnActive]}>{LANG_LABELS[l].en}</Text>
                {language === l && <Text style={s.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[s.cta, shadowBrand]} onPress={() => setStep('grade')} activeOpacity={0.85}>
            <Text style={s.ctaText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.stepWrap}>
          <TouchableOpacity onPress={() => setStep('lang')} style={s.backBtn} activeOpacity={0.7}>
            <View style={s.backChip}>
              <Text style={s.backChipText}>‹</Text>
            </View>
            <Text style={s.backText}>Language</Text>
          </TouchableOpacity>
          <Text style={s.stepTitle}>Select your grade</Text>
          <Text style={s.stepSub}>EdSparkAI adapts explanations to your level.</Text>
          <View style={s.gradeGrid}>
            {GRADES.map(g => (
              <TouchableOpacity
                key={g}
                style={[s.gradeChip, classGrade === g && s.gradeChipActive]}
                onPress={() => setClassGrade(g)}
                activeOpacity={0.75}
              >
                <Text style={[s.gradeText, classGrade === g && s.gradeTextActive]}>
                  {g === 'UG' || g === 'General' ? g : `Class ${g}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[s.cta, shadowBrand]} onPress={() => { setHasOnboarded(true); nav.replace('Main') }} activeOpacity={0.85}>
            <Text style={s.ctaText}>Start Learning →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const ls = StyleSheet.create({
  root:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: SP.s6 },
  logo:     { width: 220, height: 50, marginBottom: SP.s5 },
  title:    { fontSize: 17, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
  hint:     { fontSize: 13, color: C.textTertiary, marginTop: SP.s1, textAlign: 'center', marginBottom: SP.s6 },
  barTrack: { width: 240, height: 3, borderRadius: 2, backgroundColor: C.surface2, overflow: 'hidden' },
  barFill:  { width: 90, height: 3, borderRadius: 2, backgroundColor: C.brand500 },
})

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.surface0 },
  header:       { alignItems: 'center', justifyContent: 'center', paddingTop: SP.s6, paddingBottom: SP.s5, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  logo:         { width: 220, height: 50 },

  stepWrap:     { flex: 1, paddingHorizontal: SP.s4, paddingTop: SP.s5 },
  stepTitle:    { fontSize: 26, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.4, marginBottom: SP.s1 },
  stepSub:      { fontSize: 15, color: C.textSecondary, marginBottom: SP.s4, lineHeight: 22 },

  listWrap:     { flex: 1, marginBottom: SP.s4 },
  langRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: SP.s3, paddingHorizontal: SP.s3, borderRadius: R.lg, marginBottom: 2 },
  langRowActive:{ backgroundColor: C.brand50 },
  langNative:   { fontSize: 18, fontWeight: '600', color: C.textPrimary, flex: 1 },
  langNativeActive: { color: C.brand500 },
  langEn:       { fontSize: 13, color: C.textTertiary, marginRight: SP.s2 },
  langEnActive: { color: C.brand500 },
  langCheck:    { fontSize: 16, color: C.brand500, fontWeight: '700' },

  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SP.s3 },
  backChip:     { width: 28, height: 28, borderRadius: 8, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  backChipText: { fontSize: 20, color: C.textPrimary, fontWeight: '600', lineHeight: 22, marginLeft: -1 },
  backText:     { fontSize: 14, color: C.textSecondary, fontWeight: '500' },
  gradeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s2, marginBottom: SP.s5 },
  gradeChip:    { paddingHorizontal: SP.s4, paddingVertical: SP.s3, borderRadius: R.lg, backgroundColor: C.surface1, borderWidth: 1.5, borderColor: C.surface3 },
  gradeChipActive: { borderColor: C.brand500, backgroundColor: C.brand50 },
  gradeText:    { fontSize: 15, fontWeight: '500', color: C.textSecondary },
  gradeTextActive: { color: C.brand500, fontWeight: '600' },

  cta:          { backgroundColor: C.brand500, borderRadius: R.lg, height: TOUCH_CTA, alignItems: 'center', justifyContent: 'center', marginBottom: SP.s5 },
  ctaText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
})
