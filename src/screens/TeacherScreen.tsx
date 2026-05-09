import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native'
import { C, SP, R, TOUCH_CTA, shadow1, shadowBrand } from '../theme'
import { useStore } from '../store/appStore'
import { AiRuntime } from '../native/AiRuntime'

export default function TeacherScreen() {
  const { selectedBlockText, classGrade, language, teacherPackResult, setTeacherPackResult } = useStore()
  const [loading, setLoading] = useState(false)

  async function generatePack() {
    if (!selectedBlockText) {
      Alert.alert('No page scanned', 'Scan a textbook page first from the Learn tab.')
      return
    }
    setLoading(true)
    try {
      const result = await AiRuntime.generateTeacherPack(selectedBlockText, classGrade, language)
      setTeacherPackResult(result)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Image source={require('../assets/icons/ic_school.png')} style={{ width: 26, height: 26 }} />
        <Text style={s.headerTitle}>Teacher Tools</Text>
        <Text style={s.headerSub}>Class {classGrade}</Text>
      </View>

      {!teacherPackResult ? (
        <View style={s.emptyState}>
          <Image source={require('../assets/icons/ic_clipboard.png')} style={{ width: 48, height: 48 }} />
          <Text style={s.emptyTitle}>No lesson pack yet</Text>
          <Text style={s.emptySub}>Scan a page from the Learn tab, then generate the pack here.</Text>
          <TouchableOpacity
            style={[s.genBtn, shadowBrand, loading && s.genBtnDisabled]}
            onPress={generatePack}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.genBtnText}>Generate Lesson Pack</Text>
            }
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <Section icon={<Image source={require('../assets/icons/ic_open_book.png')} style={ico} />} label="OBJECTIVE">
            {teacherPackResult.objective}
          </Section>

          <Section icon={<Image source={require('../assets/icons/ic_school.png')} style={ico} />} label="BLACKBOARD SUMMARY">
            {teacherPackResult.blackboard_summary}
          </Section>

          <Section icon={<Image source={require('../assets/icons/ic_clipboard.png')} style={ico} />} label="5-MIN RECAP">
            {teacherPackResult.recap_5_min}
          </Section>

          <Section icon={<Image source={require('../assets/icons/ic_grad_cap.png')} style={ico} />} label="SLOW LEARNER VERSION">
            {teacherPackResult.slow_learner_version}
          </Section>

          <Section icon={<Image source={require('../assets/icons/ic_sparkle.png')} style={ico} />} label="ADVANCED CHALLENGE">
            {teacherPackResult.advanced_challenge}
          </Section>

          <Section icon={<Image source={require('../assets/icons/ic_pencil.png')} style={ico} />} label="WORKSHEET ACTIVITY">
            {teacherPackResult.worksheet}
          </Section>

          <Section icon={<Image source={require('../assets/icons/ic_house.png')} style={ico} />} label="HOMEWORK">
            {teacherPackResult.homework}
          </Section>

          <TouchableOpacity style={s.regenBtn} onPress={generatePack} disabled={loading}>
            {loading
              ? <ActivityIndicator color={C.brand500} />
              : <Text style={s.regenBtnText}>Regenerate Pack</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  )
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: string }) {
  return (
    <View style={ss.card}>
      <View style={ss.labelRow}>
        {icon}
        <Text style={ss.label}>{label}</Text>
      </View>
      <Text style={ss.body}>{children}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.surface1 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: SP.s2, paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s3, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface3 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.textPrimary, flex: 1 },
  headerSub:   { fontSize: 13, color: C.textTertiary },
  scroll:      { padding: SP.s4, paddingBottom: SP.s10 },
  emptyState:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SP.s5 },
  emptyTitle:  { fontSize: 20, fontWeight: '600', color: C.textPrimary, marginTop: SP.s4 },
  emptySub:    { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: SP.s2, lineHeight: 22 },
  genBtn:      { marginTop: SP.s5, backgroundColor: C.brand500, borderRadius: R.lg, paddingHorizontal: SP.s6, height: TOUCH_CTA, alignItems: 'center', justifyContent: 'center', width: '100%' },
  genBtnDisabled: { opacity: 0.6 },
  genBtnText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  regenBtn:    { marginTop: SP.s4, height: TOUCH_CTA, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.brand500, alignItems: 'center', justifyContent: 'center' },
  regenBtnText:{ fontSize: 15, color: C.brand500, fontWeight: '500' },
})

const ico = { width: 18, height: 18 }

const ss = StyleSheet.create({
  card:     { backgroundColor: C.surface0, borderRadius: R.lg, borderWidth: 1, borderColor: C.surface3, padding: SP.s4, marginBottom: SP.s3, ...shadow1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: SP.s2, marginBottom: SP.s2 },
  label:    { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' },
  body:     { fontSize: 15, lineHeight: 24, color: C.textPrimary },
})
