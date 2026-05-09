import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA, shadow1 } from '../theme'
import { useStore } from '../store/appStore'

export default function QuizScreen() {
  const nav = useNavigation<any>()
  const { explainResult, language, recordQuizResult } = useStore()
  const quiz = explainResult?.quiz ?? []

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (quiz.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.emptyText}>No questions yet. Scan a page first.</Text>
        <Text style={s.emptyTextLang}>पहले एक पेज स्कैन करें।</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const q = quiz[current]
  const answered = selected !== null

  function handleAnswer(idx: number) {
    if (answered) return
    setSelected(idx)
    if (idx === q.correct_index) setScore(s2 => s2 + 1)
  }

  function next() {
    const isLastQuestion = current + 1 >= quiz.length
    const justGotCorrect = selected === q.correct_index
    if (isLastQuestion) {
      const totalWrong = quiz.length - score - (justGotCorrect ? 1 : 0)
      const topic = explainResult?.simple_explanation?.split(' ').slice(0, 5).join(' ') ?? 'General Topic'
      recordQuizResult(topic, totalWrong, quiz.length)
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  if (done) {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
            <Text style={{fontSize:22,color:C.textPrimary}}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Quiz Complete</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.center}>
          <Text style={s.scoreNum}>{score}/{quiz.length}</Text>
          <Text style={s.scoreLabel}>Questions correct</Text>
          <Text style={s.scoreSub}>
            {score === quiz.length ? 'Excellent work!' : score >= quiz.length / 2 ? 'Good effort. Review the explanation.' : 'Read the explanation again carefully.'}
          </Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => { setCurrent(0); setSelected(null); setScore(0); setDone(false) }}>
            <Text style={s.ctaBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => nav.navigate('Explain')}>
            <Text style={s.secondaryBtnText}>Back to Explanation</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={{fontSize:22,color:C.textPrimary}}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Quiz</Text>
        <Text style={s.scoreChip}>{score} correct</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.progressRow}>
          {quiz.map((_, i) => (
            <View key={i} style={[s.progressDot, i === current && s.progressDotActive, i < current && s.progressDotDone]} />
          ))}
        </View>

        <View style={[s.questionCard, shadow1]}>
          <Text style={s.questionText}>{q.question}</Text>
        </View>

        {q.options.map((opt, idx) => {
          const isCorrect = idx === q.correct_index
          const isSelected = idx === selected
          let style = [s.option]
          if (answered && isCorrect) style.push(s.optionCorrect as any)
          if (answered && isSelected && !isCorrect) style.push(s.optionWrong as any)

          return (
            <TouchableOpacity key={idx} style={style} onPress={() => handleAnswer(idx)} activeOpacity={answered ? 1 : 0.75}>
              <Text style={s.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
              <Text style={s.optionText}>{opt}</Text>
              {answered && isCorrect && <Text style={{fontSize:18,color:C.success,marginLeft:'auto'}}>✓</Text>}
              {answered && isSelected && !isCorrect && <Text style={{fontSize:18,color:C.danger,marginLeft:'auto'}}>✗</Text>}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {answered && (
        <View style={s.nextBar}>
          <TouchableOpacity style={s.nextBtn} onPress={next}>
            <Text style={s.nextBtnText}>
              {current + 1 < quiz.length ? 'Next Question' : 'See Results'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.surface1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s3, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface3 },
  headerTitle:    { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  scoreChip:      { fontSize: 13, color: C.brand500, fontWeight: '600', backgroundColor: C.brand100, paddingHorizontal: SP.s2, paddingVertical: SP.s1, borderRadius: R.sm },
  scroll:         { padding: SP.s4, paddingBottom: SP.s10 },
  progressRow:    { flexDirection: 'row', gap: SP.s1, marginBottom: SP.s4 },
  progressDot:    { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.surface3 },
  progressDotActive: { backgroundColor: C.brand500 },
  progressDotDone:   { backgroundColor: C.brand200 },
  questionCard:   { backgroundColor: C.surface0, borderRadius: R.lg, borderWidth: 1, borderColor: C.surface3, padding: SP.s4, marginBottom: SP.s4 },
  questionText:   { fontSize: 18, lineHeight: 27, fontWeight: '500', color: C.textPrimary },
  option:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface0, borderRadius: R.md, borderWidth: 1.5, borderColor: C.surface3, padding: SP.s3, marginBottom: SP.s2, minHeight: TOUCH_CTA },
  optionCorrect:  { borderColor: C.success, backgroundColor: C.successBg },
  optionWrong:    { borderColor: C.danger, backgroundColor: C.dangerBg },
  optionLetter:   { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface2, textAlign: 'center', lineHeight: 28, fontWeight: '600', fontSize: 13, color: C.textSecondary, marginRight: SP.s3 },
  optionText:     { flex: 1, fontSize: 15, color: C.textPrimary, lineHeight: 22 },
  nextBar:        { paddingHorizontal: SP.s4, paddingVertical: SP.s3, paddingBottom: SP.s6, backgroundColor: C.surface0, borderTopWidth: 1, borderTopColor: C.surface3 },
  nextBtn:        { backgroundColor: C.brand500, borderRadius: R.lg, height: TOUCH_CTA, alignItems: 'center', justifyContent: 'center' },
  nextBtnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SP.s5 },
  scoreNum:       { fontSize: 56, fontWeight: '700', color: C.brand500, letterSpacing: -1 },
  scoreLabel:     { fontSize: 18, fontWeight: '500', color: C.textPrimary, marginTop: SP.s2 },
  scoreSub:       { fontSize: 14, color: C.textSecondary, marginTop: SP.s2, textAlign: 'center', lineHeight: 22 },
  ctaBtn:         { marginTop: SP.s5, backgroundColor: C.brand500, borderRadius: R.lg, paddingHorizontal: SP.s6, height: TOUCH_CTA, alignItems: 'center', justifyContent: 'center', width: '100%' },
  ctaBtnText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn:   { marginTop: SP.s3, height: TOUCH_CTA, alignItems: 'center', justifyContent: 'center', width: '100%' },
  secondaryBtnText: { fontSize: 15, color: C.brand500, fontWeight: '500' },
  emptyText:      { fontSize: 18, color: C.textPrimary, fontWeight: '500', textAlign: 'center' },
  emptyTextLang:  { fontSize: 15, color: C.textSecondary, marginTop: SP.s2, textAlign: 'center' },
  backBtn:        { marginTop: SP.s5, backgroundColor: C.brand500, borderRadius: R.lg, paddingHorizontal: SP.s6, height: TOUCH_CTA, alignItems: 'center', justifyContent: 'center' },
  backBtnText:    { color: '#fff', fontWeight: '600', fontSize: 16 },
})
