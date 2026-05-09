import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA, shadow1, shadowBrand } from '../theme'
import { useStore, LANG_LABELS } from '../store/appStore'
import OfflineBadge from '../components/OfflineBadge'

interface ActionCard {
  icon: React.ReactNode
  title: string
  titleLang: string
  subtitle: string
  onPress: () => void
  primary?: boolean
}

export default function HomeScreen() {
  const nav = useNavigation<any>()
  const { modelReady, language, classGrade, explanationsGenerated, weakTopics, chatSessions, deleteChatSession } = useStore()
  const langLabel = LANG_LABELS[language]

  const cards: ActionCard[] = [
    {
      icon: <Image source={require('../assets/icons/ic_scan.png')} style={ic} />,
      title: 'Scan Page',
      titleLang: 'पन्ना स्कैन करें',
      subtitle: 'Point camera at a textbook page',
      onPress: () => nav.navigate('Scan'),
      primary: true,
    },
    {
      icon: <Image source={require('../assets/icons/ic_chat.png')} style={ic} />,
      title: 'Ask Doubt',
      titleLang: 'सवाल पूछें',
      subtitle: 'Chat with AI tutor about current page',
      onPress: () => nav.navigate('Chat'),
    },
    {
      icon: <Image source={require('../assets/icons/ic_quiz.png')} style={ic} />,
      title: 'Quiz Me',
      titleLang: 'प्रश्नोत्तरी',
      subtitle: 'Practice with recent material',
      onPress: () => nav.navigate('Quiz'),
    },
  ]

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <View>
          <Image source={require('../assets/icons/gemmaspark_logo.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.meta}>Class {classGrade} · {langLabel.native} · {langLabel.en}</Text>
        </View>
        <View>
          <OfflineBadge ready={modelReady} />
          {explanationsGenerated > 0 && (
            <View style={s.dataBadge}>
              <Text style={s.dataBadgeText}>{explanationsGenerated} explanations · 0 MB data</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.greeting}>What do you need today?</Text>
        <Text style={s.greetingLang}>आज क्या चाहिए?</Text>

        {cards.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={[s.card, card.primary && s.cardPrimary, card.primary && shadowBrand, !card.primary && shadow1]}
            onPress={card.onPress}
            activeOpacity={0.82}
          >
            <View style={s.cardIcon}>{card.icon}</View>
            <View style={s.cardText}>
              <Text style={[s.cardTitle, card.primary && s.cardTitlePrimary]}>{card.title}</Text>
              <Text style={s.cardTitleLang}>{card.titleLang}</Text>
              <Text style={s.cardSub}>{card.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {chatSessions.length > 0 && (
          <View style={s.sessionSection}>
            <Text style={s.sessionHeading}>Past Conversations</Text>
            <Text style={s.sessionHeadingLang}>पिछली बातचीत</Text>
            {chatSessions.map(session => (
              <View key={session.id} style={[s.sessionCard, shadow1]}>
                <TouchableOpacity style={s.sessionMain} onPress={() => nav.navigate('Chat', { sessionId: session.id })}>
                  <Text style={s.sessionTitle} numberOfLines={1}>{session.title}</Text>
                  <Text style={s.sessionPreview} numberOfLines={2}>{session.preview}</Text>
                  <Text style={s.sessionMeta}>{LANG_LABELS[session.language]?.native} · {new Date(session.savedAt).toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.sessionDelete}
                  hitSlop={8}
                  onPress={() => Alert.alert('Delete chat?', 'This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteChatSession(session.id) },
                  ])}
                >
                  <Image source={require('../assets/icons/ic_trash.png')} style={s.sessionDeleteIcon} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {weakTopics.length > 0 && (
          <View style={s.weakCard}>
            <Text style={s.weakTitle}>Review These Topics</Text>
            <Text style={s.weakSub}>दोबारा पढ़ें</Text>
            {weakTopics.map((t, i) => (
              <View key={i} style={s.weakRow}>
                <View style={s.weakDot} />
                <Text style={s.weakText} numberOfLines={1}>{t.topic}</Text>
                <Text style={s.weakCount}>{t.wrongCount}✗</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const ic = { width: 42, height: 42 }

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.surface1 },
  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s4, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface3 },
  logoImg:         { width: 150, height: 36 },
  meta:            { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  scroll:          { paddingHorizontal: SP.s4, paddingTop: SP.s5, paddingBottom: SP.s8 },
  greeting:        { fontSize: 24, fontWeight: '600', color: C.textPrimary, letterSpacing: -0.3 },
  greetingLang:    { fontSize: 15, color: C.textSecondary, marginTop: SP.s1, marginBottom: SP.s5 },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface0, borderRadius: R.lg, borderWidth: 1, borderColor: C.surface3, padding: SP.s4, marginBottom: SP.s3, minHeight: TOUCH_CTA + 12 },
  cardPrimary:     { borderColor: C.brand500, backgroundColor: C.brand50 },
  cardIcon:        { width: 56, height: 56, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginRight: SP.s4 },
  cardText:        { flex: 1 },
  cardTitle:       { fontSize: 18, fontWeight: '600', color: C.textPrimary },
  cardTitlePrimary:{ color: C.brand500 },
  cardTitleLang:   { fontSize: 13, color: C.textSecondary, marginTop: 1 },
  cardSub:         { fontSize: 13, color: C.textTertiary, marginTop: SP.s1 },
  dataBadge:       { marginTop: 4, backgroundColor: C.brand100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  dataBadgeText:   { fontSize: 10, color: C.brand600, fontWeight: '600' },
  weakCard:  { backgroundColor: '#FFF7ED', borderRadius: R.lg, borderWidth: 1, borderColor: '#FED7AA', padding: SP.s4, marginBottom: SP.s3 },
  weakTitle: { fontSize: 15, fontWeight: '600', color: '#9A3412', marginBottom: 2 },
  weakSub:   { fontSize: 12, color: '#C2410C', marginBottom: SP.s3 },
  weakRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SP.s2 },
  weakDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EA580C', marginRight: SP.s2 },
  weakText:  { flex: 1, fontSize: 14, color: '#7C2D12' },
  weakCount: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  sessionSection:      { marginTop: SP.s2 },
  sessionHeading:      { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  sessionHeadingLang:  { fontSize: 12, color: C.textSecondary, marginBottom: SP.s3 },
  sessionCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface0, borderRadius: R.lg, borderWidth: 1, borderColor: C.surface3, marginBottom: SP.s2, overflow: 'hidden' },
  sessionMain:         { flex: 1, padding: SP.s3 },
  sessionTitle:        { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  sessionPreview:      { fontSize: 12, color: C.textSecondary, marginTop: 2, lineHeight: 18 },
  sessionMeta:         { fontSize: 11, color: C.textTertiary, marginTop: SP.s1 },
  sessionDelete:       { padding: SP.s3, alignSelf: 'stretch', justifyContent: 'center' },
  sessionDeleteIcon:   { width: 20, height: 20 },
})
