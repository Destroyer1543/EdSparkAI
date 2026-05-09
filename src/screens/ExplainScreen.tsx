import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA, shadow1 } from '../theme'
import { useStore } from '../store/appStore'
import { AiRuntime } from '../native/AiRuntime'
import { Speech } from '../native/Speech'
import { SchoolPack } from '../native/SchoolPack'
import ActionBar from '../components/ActionBar'

export default function ExplainScreen() {
  const nav = useNavigation<any>()
  const {
    selectedBlockText, language, classGrade, subject,
    difficulty, setDifficulty,
    explainResult, setExplainResult, setInferring, inferring,
    modelReady, modelLoading, incrementExplanations,
  } = useStore()

  const [speaking, setSpeaking] = useState(false)
  const [waitingForModel, setWaitingForModel] = useState(false)

  useEffect(() => {
    if (!explainResult) {
      if (modelReady) runExplain()
      else setWaitingForModel(true)
    }
  }, [])

  useEffect(() => {
    if (waitingForModel && modelReady && !explainResult) {
      setWaitingForModel(false)
      runExplain()
    }
  }, [modelReady])

  async function runExplain(difficultyOverride?: string) {
    if (!selectedBlockText) return
    setInferring(true)
    try {
      const context = await SchoolPack.retrieve(selectedBlockText.slice(0, 100), classGrade, subject)
      const activeDifficulty = difficultyOverride ?? difficulty
      const result = await AiRuntime.explainPage(selectedBlockText, language, context, activeDifficulty)
      setExplainResult(result)
      incrementExplanations()
    } catch (e: any) {
      Alert.alert('Explanation failed', e.message)
    } finally {
      setInferring(false)
    }
  }

  async function readAloud() {
    if (!explainResult) return
    setSpeaking(true)
    try {
      await Speech.speak(explainResult.simple_explanation, 'en')
      if (explainResult.local_language_explanation) {
        await Speech.speak(explainResult.local_language_explanation, language)
      }
    } finally {
      setSpeaking(false)
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={{fontSize:22,color:C.textPrimary}}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Explanation</Text>
        <TouchableOpacity onPress={runExplain} hitSlop={12} disabled={inferring || waitingForModel || !modelReady}>
          <Text style={{fontSize:20,color:(inferring || waitingForModel || !modelReady) ? C.textDisabled : C.brand500}}>↺</Text>
        </TouchableOpacity>
      </View>

      {(inferring || waitingForModel) ? (
        <View style={s.loading}>
          <ActivityIndicator color={C.brand500} size="large" />
          <Text style={s.loadingText}>
            {waitingForModel ? 'Waiting for model…' : 'GemmaSpark is thinking…'}
          </Text>
          <Text style={s.loadingSubText}>
            {waitingForModel
              ? 'First load takes 2–3 minutes on CPU'
              : 'Generating explanation'}
          </Text>
        </View>
      ) : !explainResult ? null : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Difficulty tabs */}
          <View style={s.diffRow}>
            {(['simple', 'grade', 'advanced'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[s.diffChip, difficulty === d && s.diffChipActive]}
                onPress={() => {
                  setDifficulty(d)
                  setExplainResult(null)
                  runExplain(d)
                }}
              >
                <Text style={[s.diffChipText, difficulty === d && s.diffChipTextActive]}>
                  {d === 'simple' ? 'Simple' : d === 'grade' ? 'Grade Level' : 'Advanced'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main explanation */}
          <View style={[s.card, shadow1]}>
            <Text style={s.label}>EXPLANATION</Text>
            <Text style={s.bodyLg}>{explainResult.simple_explanation}</Text>
            {explainResult.local_language_explanation ? (
              <Text style={s.langExplain}>{explainResult.local_language_explanation}</Text>
            ) : null}
            {explainResult.grounding_source ? (
              <Text style={s.citation}>· {explainResult.grounding_source}</Text>
            ) : null}
          </View>

          {/* Key points */}
          {explainResult.key_points?.length > 0 && (
            <View style={[s.card, shadow1]}>
              <Text style={s.label}>KEY POINTS</Text>
              {explainResult.key_points.map((pt, i) => (
                <View key={i} style={s.bulletRow}>
                  <View style={s.bullet} />
                  <Text style={s.bulletText}>{pt}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Daily life example */}
          {explainResult.daily_life_example ? (
            <View style={[s.card, s.cardAccent, shadow1]}>
              <Text style={s.label}>REAL-LIFE EXAMPLE</Text>
              <Text style={s.bodyLg}>{explainResult.daily_life_example}</Text>
            </View>
          ) : null}

        </ScrollView>
      )}

      {/* Bottom action bar */}
      {!inferring && !waitingForModel && explainResult && (
        <ActionBar
          onReadAloud={readAloud}
          speaking={speaking}
          onQuiz={() => nav.navigate('Quiz')}
          onSimpler={() => {
            setDifficulty('simple')
            setExplainResult(null)
            runExplain('simple')
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.surface1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s3, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface3 },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  scroll:       { padding: SP.s4, paddingBottom: SP.s8 },
  loading:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SP.s3 },
  loadingText:  { fontSize: 16, fontWeight: '500', color: C.textPrimary, marginTop: SP.s2 },
  loadingSubText: { fontSize: 13, color: C.textTertiary },
  card:         { backgroundColor: C.surface0, borderRadius: R.lg, borderWidth: 1, borderColor: C.surface3, padding: SP.s4, marginBottom: SP.s3 },
  cardAccent:   { borderColor: C.brand100, backgroundColor: C.brand50 },
  label:        { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SP.s2 },
  bodyLg:       { fontSize: 18, lineHeight: 28, color: C.textPrimary, fontWeight: '400' },
  langExplain:  { fontSize: 17, lineHeight: 26, color: C.textSecondary, marginTop: SP.s3 },
  citation:     { fontFamily: 'monospace', fontSize: 12, color: C.textTertiary, marginTop: SP.s3 },
  bulletRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SP.s2 },
  bullet:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand500, marginTop: 7, marginRight: SP.s2 },
  bulletText:   { flex: 1, fontSize: 16, lineHeight: 24, color: C.textPrimary },
  diffRow:           { flexDirection: 'row', gap: SP.s2, marginBottom: SP.s3 },
  diffChip:          { flex: 1, height: 36, borderRadius: R.md, borderWidth: 1.5, borderColor: C.surface3, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface0 },
  diffChipActive:    { borderColor: C.brand500, backgroundColor: C.brand100 },
  diffChipText:      { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  diffChipTextActive:{ color: C.brand500 },
})
