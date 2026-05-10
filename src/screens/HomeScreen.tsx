import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, SP, R, TOUCH_CTA, shadow1, shadowBrand } from '../theme'
import { useStore, LANG_LABELS } from '../store/appStore'

const BTN_LABELS: Record<string, { scan: string; ask: string; quiz: string }> = {
  hi: { scan: 'पन्ना स्कैन करें',           ask: 'सवाल पूछें',              quiz: 'प्रश्नोत्तरी' },
  ta: { scan: 'பக்கம் ஸ்கேன் செய்',         ask: 'சந்தேகம் கேளு',           quiz: 'வினாடி வினா' },
  te: { scan: 'పేజీని స్కాన్ చేయండి',       ask: 'సందేహం అడగండి',           quiz: 'క్విజ్' },
  bn: { scan: 'পাতা স্ক্যান করুন',           ask: 'সন্দেহ জিজ্ঞেস করুন',     quiz: 'কুইজ' },
  mr: { scan: 'पान स्कॅन करा',              ask: 'शंका विचारा',              quiz: 'प्रश्नमंजुषा' },
  gu: { scan: 'પૃષ્ઠ સ્કૅન કરો',            ask: 'શંકા પૂછો',                quiz: 'ક્વિઝ' },
  kn: { scan: 'ಪುಟ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',          ask: 'ಅನುಮಾನ ಕೇಳಿ',             quiz: 'ರಸಪ್ರಶ್ನೆ' },
  ml: { scan: 'പേജ് സ്കാൻ ചെയ്യുക',        ask: 'സംശയം ചോദിക്കുക',         quiz: 'ക്വിസ്' },
  or: { scan: 'ପୃଷ୍ଠା ସ୍କ୍ୟାନ୍ କରନ୍ତୁ',    ask: 'ସନ୍ଦେହ ପଚାରନ୍ତୁ',          quiz: 'କ୍ୱିଜ୍' },
  pa: { scan: 'ਪੰਨਾ ਸਕੈਨ ਕਰੋ',             ask: 'ਸ਼ੱਕ ਪੁੱਛੋ',               quiz: 'ਕੁਇਜ਼' },
  ur: { scan: 'صفحہ اسکین کریں',            ask: 'شک پوچھیں',               quiz: 'کوئز' },
}

const GREET: Record<string, [string, string, string]> = {
  hi: ['सुप्रभात',      'नमस्ते',        'शुभ संध्या'],
  ta: ['காலை வணக்கம்',  'மதிய வணக்கம்',  'மாலை வணக்கம்'],
  te: ['శుభోదయం',       'శుభ మధ్యాహ్నం', 'శుభ సాయంత్రం'],
  bn: ['সুপ্রভাত',      'নমস্কার',       'শুভ সন্ধ্যা'],
  mr: ['सुप्रभात',      'नमस्कार',       'शुभ संध्याकाळ'],
  gu: ['સુપ્રભાત',      'નમસ્તે',        'શુભ સાંજ'],
  kn: ['ಶುಭೋದಯ',        'ನಮಸ್ಕಾರ',       'ಶುಭ ಸಂಜೆ'],
  ml: ['സുപ്രഭാതം',     'നമസ്കാരം',      'ശുഭ സന്ധ്യ'],
  or: ['ଶୁଭ ସକାଳ',      'ନମସ୍କାର',       'ଶୁଭ ସନ୍ଧ୍ୟା'],
  pa: ['ਸ਼ੁਭ ਸਵੇਰ',      'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', 'ਸ਼ੁਭ ਸ਼ਾਮ'],
  ur: ['صبح بخیر',      'ادب',           'شب بخیر'],
}

function getGreeting(lang: string) {
  const h = new Date().getHours()
  const idx = h < 12 ? 0 : h < 17 ? 1 : 2
  const en = ['Good morning', 'Good afternoon', 'Good evening'][idx]
  const native = GREET[lang]?.[idx] ?? null
  return { en, native }
}

export default function HomeScreen() {
  const nav = useNavigation<any>()
  const { language, classGrade, explanationsGenerated, chatSessions, deleteChatSession, explainResult } = useStore()
  const langLabel = LANG_LABELS[language]
  const greeting = getGreeting(language)
  const btnL = language !== 'en' ? BTN_LABELS[language] : null

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <Image source={require('../assets/icons/gemmaspark_logo.png')} style={s.logoImg} resizeMode="contain" />
        {explanationsGenerated > 0 && (
          <Text style={s.dataBadge}>{explanationsGenerated} explained</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.greetRow}>
          <View>
            <Text style={s.greetEn}>{greeting.en}</Text>
            {greeting.native && <Text style={s.greetHi}>{greeting.native}</Text>}
          </View>
          <View style={s.metaPill}>
            <Text style={s.metaPillText}>Class {classGrade} · {langLabel.native}</Text>
          </View>
        </View>

        {/* Hero — Scan */}
        <TouchableOpacity style={[s.heroCard, shadowBrand]} onPress={() => nav.navigate('Scan')} activeOpacity={0.88}>
          <View style={s.heroDecoCircle} />
          <View style={s.heroIconWrap}>
            <Image source={require('../assets/icons/ic_camera.png')} style={s.heroIcon} />
          </View>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>Scan Page</Text>
            {btnL && <Text style={s.heroSub}>{btnL.scan}</Text>}
            <Text style={s.heroHint}>Point camera at a textbook page</Text>
          </View>
          <Text style={s.heroArrow}>→</Text>
        </TouchableOpacity>

        {/* Secondary row */}
        <View style={s.secondaryRow}>
          <TouchableOpacity style={[s.secCard, shadow1]} onPress={() => nav.navigate('Chat')} activeOpacity={0.82}>
            <Image source={require('../assets/icons/ic_chat.png')} style={s.secIcon} />
            <Text style={s.secTitle}>Ask Doubt</Text>
            {btnL && <Text style={s.secTitleHi}>{btnL.ask}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[s.secCard, shadow1]} onPress={() => explainResult ? nav.navigate('Quiz') : nav.navigate('Scan')} activeOpacity={0.82}>
            <Image source={require('../assets/icons/ic_quiz.png')} style={s.secIcon} />
            <Text style={s.secTitle}>Quiz Me</Text>
            {btnL && <Text style={s.secTitleHi}>{btnL.quiz}</Text>}
          </TouchableOpacity>
        </View>

        {/* Past Conversations */}
        {chatSessions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>PAST CONVERSATIONS</Text>
            {chatSessions.map(session => (
              <View key={session.id} style={[s.sessionCard, shadow1]}>
                <TouchableOpacity style={s.sessionMain} onPress={() => nav.navigate('Chat', { sessionId: session.id })}>
                  <Text style={s.sessionTitle} numberOfLines={1}>{session.title}</Text>
                  <Text style={s.sessionPreview} numberOfLines={1}>{session.preview}</Text>
                  <Text style={s.sessionMeta}>{LANG_LABELS[session.language]?.native} · {new Date(session.savedAt).toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.sessionDelete}
                  hitSlop={10}
                  onPress={() => Alert.alert('Delete chat?', 'This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteChatSession(session.id) },
                  ])}
                >
                  <Image source={require('../assets/icons/ic_trash.png')} style={{ width: 18, height: 18 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}


      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.surface1 },
  topBar:       { alignItems: 'center', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s4, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  logoImg:      { width: 220, height: 50 },
  dataBadge:    { fontSize: 10, color: C.brand600, fontWeight: '600', backgroundColor: C.brand100, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },

  scroll:       { paddingHorizontal: SP.s4, paddingTop: SP.s4, paddingBottom: SP.s10 },

  greetRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SP.s4 },
  greetEn:      { fontSize: 26, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.5 },
  greetHi:      { fontSize: 14, color: C.textSecondary, marginTop: 2 },
  metaPill:     { backgroundColor: C.surface2, borderRadius: R.full, paddingHorizontal: SP.s3, paddingVertical: 5 },
  metaPillText: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },

  heroCard:     { backgroundColor: C.brand500, borderRadius: R.xl, padding: SP.s5, marginBottom: SP.s3, flexDirection: 'row', alignItems: 'center', minHeight: 120, overflow: 'hidden' },
  heroDecoCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', right: -40, top: -40 },
  heroIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: SP.s4 },
  heroIcon:     { width: 34, height: 34 },
  heroText:     { flex: 1 },
  heroTitle:    { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroHint:     { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: SP.s1 },
  heroArrow:    { fontSize: 22, color: 'rgba(255,255,255,0.7)', fontWeight: '300' },

  secondaryRow: { flexDirection: 'row', gap: SP.s3, marginBottom: SP.s4 },
  secCard:      { flex: 1, backgroundColor: C.surface0, borderRadius: R.lg, padding: SP.s4, minHeight: 110, justifyContent: 'space-between' },
  secIcon:      { width: 36, height: 36, marginBottom: SP.s2 },
  secTitle:     { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  secTitleHi:   { fontSize: 12, color: C.textTertiary, marginTop: 2 },

  section:      { marginBottom: SP.s4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 1, marginBottom: SP.s2 },

  sessionCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface0, borderRadius: R.lg, marginBottom: SP.s2 },
  sessionMain:   { flex: 1, padding: SP.s3 },
  sessionTitle:  { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  sessionPreview:{ fontSize: 12, color: C.textSecondary, marginTop: 2 },
  sessionMeta:   { fontSize: 11, color: C.textTertiary, marginTop: 3 },
  sessionDelete: { padding: SP.s3, alignSelf: 'stretch', justifyContent: 'center' },

})
