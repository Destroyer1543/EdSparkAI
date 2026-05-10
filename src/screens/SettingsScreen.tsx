import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Alert, Image,
} from 'react-native'
import { C, SP, R, TOUCH_CTA, shadow1 } from '../theme'
import { useStore, LANG_LABELS, Lang } from '../store/appStore'

const LANGS: Lang[] = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'ur']
const GRADES = ['5', '6', '7', '8', '9', '10', '11', '12', 'UG', 'General']

export default function SettingsScreen() {
  const {
    language, setLanguage,
    classGrade, setClassGrade,
    deleteChatSession, chatSessions,
    weakTopics, recordQuizResult,
  } = useStore()

  const [langModal, setLangModal]   = useState(false)
  const [gradeModal, setGradeModal] = useState(false)

  function clearChats() {
    Alert.alert('Clear all chats?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => chatSessions.forEach(s => deleteChatSession(s.id)) },
    ])
  }

  function clearWeakTopics() {
    Alert.alert('Clear weak topics?', 'Your revision list will be reset.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => useStore.setState({ weakTopics: [] }) },
    ])
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Image source={require('../assets/icons/gemmaspark_logo.png')} style={s.logo} resizeMode="contain" />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <Text style={s.sectionLabel}>PROFILE</Text>
        <View style={[s.card, shadow1]}>
          <TouchableOpacity style={s.row} onPress={() => setLangModal(true)} activeOpacity={0.7}>
            <View style={s.rowLeft}>
              <Text style={s.rowTitle}>Language</Text>
              <Text style={s.rowSub}>Explanation language</Text>
            </View>
            <View style={s.rowRight}>
              <Text style={s.rowValue}>{LANG_LABELS[language].native}</Text>
              <Text style={s.rowChevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={() => setGradeModal(true)} activeOpacity={0.7}>
            <View style={s.rowLeft}>
              <Text style={s.rowTitle}>Grade</Text>
              <Text style={s.rowSub}>Difficulty adapts to your level</Text>
            </View>
            <View style={s.rowRight}>
              <Text style={s.rowValue}>{classGrade === 'UG' || classGrade === 'General' ? classGrade : `Class ${classGrade}`}</Text>
              <Text style={s.rowChevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Data */}
        <Text style={s.sectionLabel}>DATA</Text>
        <View style={[s.card, shadow1]}>
          <TouchableOpacity style={s.row} onPress={clearChats} activeOpacity={0.7}>
            <View style={s.rowLeft}>
              <Text style={s.rowTitle}>Clear Chat History</Text>
              <Text style={s.rowSub}>{chatSessions.length} conversation{chatSessions.length !== 1 ? 's' : ''} saved</Text>
            </View>
            <Text style={s.rowDanger}>Clear</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={clearWeakTopics} activeOpacity={0.7}>
            <View style={s.rowLeft}>
              <Text style={s.rowTitle}>Clear Weak Topics</Text>
              <Text style={s.rowSub}>{weakTopics.length} topic{weakTopics.length !== 1 ? 's' : ''} tracked</Text>
            </View>
            <Text style={s.rowDanger}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={s.sectionLabel}>ABOUT</Text>
        <View style={[s.card, shadow1]}>
          <View style={s.row}>
            <Text style={s.rowTitle}>EdSparkAI</Text>
            <Text style={s.rowValue}>v1.0.0</Text>
          </View>
          <View style={s.divider} />
          <View style={s.aboutRow}>
            <Image source={require('../assets/icons/ic_sparkle.png')} style={s.aboutIcon} />
            <Text style={s.aboutText}>Powered by Gemma 4 E2B · Fully offline · Built for Gemma 4 Good Hackathon 2026{'\n\n'}Gemma is a trademark of Google LLC.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Language modal */}
      <Modal visible={langModal} animationType="slide" onRequestClose={() => setLangModal(false)}>
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Choose Language</Text>
            <TouchableOpacity onPress={() => setLangModal(false)} hitSlop={12}>
              <Text style={s.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l}
                style={[s.langRow, language === l && s.langRowActive]}
                onPress={() => { setLanguage(l); setLangModal(false) }}
                activeOpacity={0.7}
              >
                <Text style={[s.langNative, language === l && s.langNativeActive]}>{LANG_LABELS[l].native}</Text>
                <Text style={[s.langEn, language === l && s.langEnActive]}>{LANG_LABELS[l].en}</Text>
                {language === l && <Text style={s.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Grade modal */}
      <Modal visible={gradeModal} animationType="slide" onRequestClose={() => setGradeModal(false)}>
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Grade</Text>
            <TouchableOpacity onPress={() => setGradeModal(false)} hitSlop={12}>
              <Text style={s.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={s.gradeGrid}>
            {GRADES.map(g => (
              <TouchableOpacity
                key={g}
                style={[s.gradeChip, classGrade === g && s.gradeChipActive]}
                onPress={() => { setClassGrade(g); setGradeModal(false) }}
                activeOpacity={0.75}
              >
                <Text style={[s.gradeText, classGrade === g && s.gradeTextActive]}>
                  {g === 'UG' || g === 'General' ? g : `Class ${g}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.surface1 },
  header:       { alignItems: 'center', paddingTop: SP.s6, paddingBottom: SP.s4, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  logo:         { width: 220, height: 50 },
  scroll:       { paddingHorizontal: SP.s4, paddingTop: SP.s4, paddingBottom: SP.s10 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 1, marginBottom: SP.s2, marginTop: SP.s3 },
  card:         { backgroundColor: C.surface0, borderRadius: R.lg, overflow: 'hidden', marginBottom: SP.s2 },
  divider:      { height: 1, backgroundColor: C.surface2, marginLeft: SP.s4 },

  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.s4, paddingVertical: SP.s3, minHeight: 56 },
  rowLeft:      { flex: 1 },
  rowRight:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowTitle:     { fontSize: 15, fontWeight: '500', color: C.textPrimary },
  rowSub:       { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  rowValue:     { fontSize: 14, color: C.brand500, fontWeight: '600' },
  rowChevron:   { fontSize: 20, color: C.textTertiary, marginLeft: 2 },
  rowDanger:    { fontSize: 14, color: C.danger, fontWeight: '600' },

  aboutRow:     { flexDirection: 'row', alignItems: 'flex-start', padding: SP.s4, gap: SP.s3 },
  aboutIcon:    { width: 20, height: 20, marginTop: 1 },
  aboutText:    { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 },

  modalRoot:    { flex: 1, backgroundColor: C.surface0 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s4, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  modalClose:   { fontSize: 16, color: C.brand500, fontWeight: '600' },

  langRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: SP.s3, paddingHorizontal: SP.s4, borderRadius: R.lg, marginHorizontal: SP.s2, marginBottom: 2 },
  langRowActive:  { backgroundColor: C.brand50 },
  langNative:     { fontSize: 18, fontWeight: '600', color: C.textPrimary, flex: 1 },
  langNativeActive: { color: C.brand500 },
  langEn:         { fontSize: 13, color: C.textTertiary, marginRight: SP.s2 },
  langEnActive:   { color: C.brand500 },
  langCheck:      { fontSize: 16, color: C.brand500, fontWeight: '700' },

  gradeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s2, padding: SP.s4 },
  gradeChip:      { paddingHorizontal: SP.s4, paddingVertical: SP.s3, borderRadius: R.lg, backgroundColor: C.surface1, borderWidth: 1.5, borderColor: C.surface3 },
  gradeChipActive:{ borderColor: C.brand500, backgroundColor: C.brand50 },
  gradeText:      { fontSize: 15, fontWeight: '500', color: C.textSecondary },
  gradeTextActive:{ color: C.brand500, fontWeight: '600' },
})
