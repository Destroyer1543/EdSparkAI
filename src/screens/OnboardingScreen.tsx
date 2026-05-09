import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA, paperTheme, shadowBrand } from '../theme'
import { useStore, LANG_LABELS, Lang } from '../store/appStore'

const LANGS: Lang[] = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'ur']
const GRADES = ['5', '6', '7', '8', '9', '10', '11', '12', 'UG', 'General']

export default function OnboardingScreen() {
  const nav = useNavigation<any>()
  const { language, setLanguage, classGrade, setClassGrade, modelReady, modelLoading } = useStore()
  const [step, setStep] = useState<'lang' | 'grade'>('lang')

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Image source={require('../assets/icons/gemmaspark_logo.png')} style={s.logoImg} resizeMode="contain" />
        <Text style={s.tagline}>Igniting learning, even offline · {modelLoading ? 'Loading model…' : modelReady ? 'Ready' : 'Model not found'}</Text>
      </View>

      {step === 'lang' ? (
        <>
          <View style={s.iconRow}>
            <Image source={require('../assets/icons/ic_globe.png')} style={{ width: 40, height: 40 }} />
          </View>
          <Text style={s.sectionTitle}>Choose explanation language</Text>
          <Text style={s.sectionSub}>भाषा चुनें · மொழி தேர்வு</Text>
          <View style={s.grid}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l}
                style={[s.chip, language === l && s.chipActive]}
                onPress={() => setLanguage(l)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipLang, language === l && s.chipLangActive]}>{LANG_LABELS[l].native}</Text>
                <Text style={[s.chipEn, language === l && s.chipEnActive]}>{LANG_LABELS[l].en}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.cta} onPress={() => setStep('grade')} activeOpacity={0.85}>
            <Text style={s.ctaText}>Next</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={s.sectionTitle}>Select grade</Text>
          <Text style={s.sectionSub}>कक्षा चुनें</Text>
          <View style={s.grid}>
            {GRADES.map(g => (
              <TouchableOpacity
                key={g}
                style={[s.chip, classGrade === g && s.chipActive]}
                onPress={() => setClassGrade(g)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipLang, classGrade === g && s.chipLangActive]}>
                  {g === 'UG' || g === 'General' ? g : `Class ${g}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[s.cta, shadowBrand]}
            onPress={() => nav.replace('Main')}
            activeOpacity={0.85}
          >
            {modelLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.ctaText}>Start · शुरू करें</Text>
            }
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.surface1, paddingHorizontal: SP.s4, paddingTop: SP.s8 },
  header:       { marginBottom: SP.s8 },
  logoImg:      { width: 220, height: 56 },
  tagline:      { fontSize: 13, color: C.textTertiary, marginTop: SP.s1 },
  iconRow:      { alignItems: 'center', marginBottom: SP.s3 },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: C.textPrimary, marginBottom: SP.s1 },
  sectionSub:   { fontSize: 14, color: C.textSecondary, marginBottom: SP.s5 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s2, marginBottom: SP.s6 },
  chip:         { paddingHorizontal: SP.s4, paddingVertical: SP.s3, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.surface3, backgroundColor: C.surface0, minWidth: 80, alignItems: 'center' },
  chipActive:   { borderColor: C.brand500, backgroundColor: C.brand100 },
  chipLang:     { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  chipLangActive: { color: C.brand500 },
  chipEn:       { fontSize: 11, color: C.textTertiary, marginTop: 2 },
  chipEnActive: { color: C.brand600 },
  cta:          { backgroundColor: C.brand500, borderRadius: R.lg, height: TOUCH_CTA, alignItems: 'center', justifyContent: 'center', marginTop: SP.s4 },
  ctaText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
})
