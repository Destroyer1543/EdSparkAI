import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView, Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import BackButton from '../components/BackButton'
import { C, SP, R, TOUCH_MIN } from '../theme'
import { useStore, LANG_LABELS, Lang, ChatSession } from '../store/appStore'
import { AiRuntime } from '../native/AiRuntime'
import { Speech } from '../native/Speech'
import { SpeechInput } from '../native/SpeechInput'
import { Vision } from '../native/Vision'
import { Camera } from '../native/Camera'

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  imagePath?: string
}

const LANGS: Lang[] = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'ur']

interface Props {
  route?: { params?: { sessionId?: string } }
}

export default function ChatScreen({ route }: Props) {
  const nav = useNavigation<any>()
  const { selectedBlockText, explainResult, language, modelReady, chatSessions, saveChatSession } = useStore()
  const resumeSessionId = route?.params?.sessionId

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [ready, setReady] = useState(false)
  const [waitingForModel, setWaitingForModel] = useState(false)
  const [lang, setLang] = useState<Lang>(language)
  const [langPickerOpen, setLangPickerOpen] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [replyImage, setReplyImage] = useState<{ path: string; ocr: string } | null>(null)
  const titleGeneratedRef = useRef(false)
  const listRef = useRef<FlatList>(null)
  const sessionIdRef = useRef<string>(resumeSessionId ?? Date.now().toString())
  const ocrTextRef = useRef<string>(selectedBlockText)
  const explainSummaryRef = useRef<string>(explainResult?.simple_explanation ?? '')

  useEffect(() => {
    init()
    return () => {
      AiRuntime.endChat().catch(() => {})
    }
  }, [])

  // Save session whenever messages change (debounced via ref)
  const messagesRef = useRef<Message[]>([])
  messagesRef.current = messages

  useEffect(() => {
    if (messages.filter(m => m.role === 'user').length === 0) return
    const session: ChatSession = {
      id: sessionIdRef.current,
      title: ocrTextRef.current.split(' ').slice(0, 6).join(' ') || 'Chat Session',
      preview: [...messages].reverse().find(m => m.role === 'ai')?.text ?? '',
      ocrText: ocrTextRef.current,
      explainSummary: explainSummaryRef.current,
      language: lang,
      messages: messages.map(m => ({ role: m.role, text: m.text })),
      savedAt: Date.now(),
    }
    saveChatSession(session)
  }, [messages])

  async function init() {
    if (resumeSessionId) {
      const session = chatSessions.find(s => s.id === resumeSessionId)
      if (session) {
        ocrTextRef.current = session.ocrText
        explainSummaryRef.current = session.explainSummary
        setLang(session.language)
        setMessages(session.messages.map((m, i) => ({ ...m, id: i.toString() })))
        if (!modelReady) { setReady(false); return }
        try {
          await AiRuntime.startChat(session.ocrText, session.explainSummary, session.language)
          setReady(true)
        } catch (e: any) {
          Alert.alert('Error', e.message)
          nav.goBack()
        }
        return
      }
    }

    if (!modelReady) {
      setWaitingForModel(true)
      return
    }
    try {
      const summary = explainResult?.simple_explanation ?? ''
      await AiRuntime.startChat(selectedBlockText, summary, lang)
      setReady(true)
      addMessage('ai', 'Hi! Ask me anything about this page.')
    } catch (e: any) {
      Alert.alert('Error', e.message)
      nav.goBack()
    }
  }

  useEffect(() => {
    if (waitingForModel && modelReady) {
      setWaitingForModel(false)
      init()
    }
  }, [modelReady])

  async function switchLang(newLang: Lang) {
    setLangPickerOpen(false)
    if (newLang === lang) return
    setLang(newLang)
    if (!ready) return
    try {
      await AiRuntime.endChat()
      await AiRuntime.startChat(ocrTextRef.current, explainSummaryRef.current, newLang)
      addMessage('ai', `Switched to ${LANG_LABELS[newLang].native}. Ask me anything!`)
    } catch {}
  }

  function addMessage(role: 'user' | 'ai', text: string, imagePath?: string) {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, text, imagePath }])
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }

  async function generateTitle() {
    if (titleGeneratedRef.current) return
    titleGeneratedRef.current = true
    try {
      const raw = await AiRuntime.chat('In 4–5 words, what topic is this page about? Reply with ONLY the title, no punctuation.')
      const title = raw.replace(/["""'']/g, '').trim().split('\n')[0].slice(0, 50)
      if (title.length > 3) {
        saveChatSession({
          id: sessionIdRef.current,
          title,
          preview: messagesRef.current.filter(m => m.role === 'ai').slice(-1)[0]?.text ?? '',
          ocrText: ocrTextRef.current,
          explainSummary: explainSummaryRef.current,
          language: lang,
          messages: messagesRef.current.map(m => ({ role: m.role, text: m.text })),
          savedAt: Date.now(),
        })
      }
    } catch {}
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || thinking || !ready) return
    setInput('')
    const pendingReply = replyImage
    setReplyImage(null)
    addMessage('user', msg, pendingReply?.path)
    setThinking(true)
    try {
      const response = pendingReply
        ? await AiRuntime.chatWithImage(msg, pendingReply.path)
        : await AiRuntime.chat(msg)
      addMessage('ai', response)
      if (!titleGeneratedRef.current) generateTitle()
    } catch {
      addMessage('ai', 'Sorry, something went wrong. Try again.')
    } finally {
      setThinking(false)
    }
  }

  async function speak(id: string, text: string) {
    if (speakingId === id) {
      await Speech.stop()
      setSpeakingId(null)
      return
    }
    if (speakingId) await Speech.stop()
    setSpeakingId(id)
    try {
      await Speech.speak(text, lang)
    } finally {
      setSpeakingId(null)
    }
  }

  async function startVoice() {
    if (listening || thinking) return
    setListening(true)
    try {
      const text = await SpeechInput.startListening(lang)
      setListening(false)
      send(text)
    } catch {
      setListening(false)
    }
  }

  async function addPage() {
    try {
      const path = await Camera.takePhoto()
      const blocks = await Vision.recognizeText(path)
      if (blocks.length === 0) { Alert.alert('No text found', 'Try better lighting.'); return }
      const newText = blocks.map(b => b.text).join('\n')
      const contextMsg = `New page added. Content: ${newText.slice(0, 600)}`
      addMessage('user', 'Added a page', path)
      setThinking(true)
      const response = await AiRuntime.chat(contextMsg)
      addMessage('ai', response)
    } catch (e: any) {
      if (e?.message !== 'Cancelled') Alert.alert('Error', e.message)
    } finally {
      setThinking(false)
    }
  }

  const langLabel = LANG_LABELS[lang]

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <BackButton onPress={() => nav.goBack()} />
        <View>
          <Text style={s.title}>AI Tutor</Text>
          <Text style={s.subtitle}>EdSparkAI · Offline</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.langPill} onPress={() => setLangPickerOpen(true)} hitSlop={8}>
            <Text style={s.langPillText}>{langLabel.native}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addPage} hitSlop={12} style={s.addPageBtn}>
            <Image source={require('../assets/icons/ic_camera.png')} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
        </View>
      </View>

      {waitingForModel && (
        <View style={s.waitingBanner}>
          <ActivityIndicator size="small" color={C.brand500} />
          <Text style={s.waitingText}>Waiting for model to load…</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={[s.bubbleWrap, item.role === 'user' ? s.bubbleWrapUser : s.bubbleWrapAi]}>
            <View style={[s.bubble, item.role === 'user' ? s.bubbleUser : s.bubbleAi]}>
              {item.imagePath ? (
                <Image source={{ uri: `file://${item.imagePath}` }} style={s.bubbleImage} resizeMode="cover" />
              ) : null}
              {item.text ? (
                <Text style={[s.bubbleText, item.role === 'user' ? s.bubbleTextUser : s.bubbleTextAi]}>
                  {item.text}
                </Text>
              ) : null}
            </View>
            {item.role === 'user' && item.imagePath && (
              <TouchableOpacity
                style={s.askAboutBtn}
                onPress={() => setReplyImage({ path: item.imagePath!, ocr: item.text })}
                hitSlop={8}
              >
                <Text style={s.askAboutText}>Ask about this image →</Text>
              </TouchableOpacity>
            )}
            {item.role === 'ai' && (
              <TouchableOpacity style={s.speakBtn} onPress={() => speak(item.id, item.text)} hitSlop={8}>
                <Image source={speakingId === item.id ? require('../assets/icons/ic_stop.png') : require('../assets/icons/ic_speaker.png')} style={s.speakIcon} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListFooterComponent={
          thinking ? (
            <View style={s.typingRow}>
              <ActivityIndicator size="small" color={C.brand500} />
              <Text style={s.typingText}>Thinking…</Text>
            </View>
          ) : null
        }
      />

      {replyImage && (
        <View style={s.replyBar}>
          <Image source={{ uri: `file://${replyImage.path}` }} style={s.replyThumb} resizeMode="cover" />
          <Text style={s.replyBarText} numberOfLines={1}>Asking about image</Text>
          <TouchableOpacity onPress={() => setReplyImage(null)} hitSlop={8}>
            <Text style={s.replyClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.inputRow}>
        <TouchableOpacity
          style={[s.micBtn, listening && s.micBtnActive]}
          onPress={startVoice}
          disabled={thinking || !ready}
        >
          <Image source={listening ? require('../assets/icons/ic_stop.png') : require('../assets/icons/ic_mic.png')} style={s.micIcon} />
        </TouchableOpacity>

        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question…"
          placeholderTextColor={C.textTertiary}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          editable={ready && !thinking}
          multiline
        />

        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || thinking) && s.sendBtnDisabled]}
          onPress={() => send()}
          disabled={!input.trim() || thinking || !ready}
        >
          <Image source={require('../assets/icons/ic_sparkle.png')} style={s.sendIcon} />
        </TouchableOpacity>
      </View>

      <Modal visible={langPickerOpen} transparent animationType="fade" onRequestClose={() => setLangPickerOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setLangPickerOpen(false)}>
          <View style={s.picker}>
            <Text style={s.pickerTitle}>Choose Language</Text>
            <ScrollView>
              {LANGS.map(l => (
                <TouchableOpacity key={l} style={[s.pickerRow, l === lang && s.pickerRowActive]} onPress={() => switchLang(l)}>
                  <Text style={[s.pickerNative, l === lang && s.pickerNativeActive]}>{LANG_LABELS[l].native}</Text>
                  <Text style={s.pickerEn}>{LANG_LABELS[l].en}</Text>
                  {l === lang && <Text style={s.pickerCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: C.surface1 },
  waitingBanner:    { flexDirection: 'row', alignItems: 'center', gap: SP.s2, backgroundColor: C.brand50, paddingHorizontal: SP.s4, paddingVertical: SP.s2 },
  waitingText:      { fontSize: 13, color: C.brand500, fontWeight: '500' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.s4, paddingTop: SP.s6, paddingBottom: SP.s3, backgroundColor: C.surface0, borderBottomWidth: 1, borderBottomColor: C.surface3 },
  back:             { fontSize: 22, color: C.textPrimary },
  title:            { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  subtitle:         { fontSize: 11, color: C.textTertiary },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: SP.s2 },
  langPill:         { backgroundColor: C.brand100, borderRadius: R.full, paddingHorizontal: SP.s3, paddingVertical: 5 },
  langPillText:     { fontSize: 13, color: C.brand500, fontWeight: '600' },
  addPageBtn:       { padding: SP.s1 },
  addPageText:      { fontSize: 22 },
  list:             { padding: SP.s4, paddingBottom: SP.s2 },
  bubbleWrap:       { marginBottom: SP.s2 },
  bubbleWrapUser:   { alignItems: 'flex-end' },
  bubbleWrapAi:     { alignItems: 'flex-start' },
  bubble:           { maxWidth: '80%', borderRadius: R.lg, padding: SP.s3 },
  bubbleUser:       { backgroundColor: C.brand500 },
  bubbleAi:         { backgroundColor: C.surface0, elevation: 1, shadowColor: '#0E0E10', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  speakBtn:         { marginTop: 4, marginLeft: SP.s1 },
  speakIcon:        { width: 16, height: 16 },
  bubbleImage:      { width: 200, height: 150, borderRadius: R.md, marginBottom: SP.s1 },
  askAboutBtn:      { marginTop: 4, alignSelf: 'flex-end' },
  askAboutText:     { fontSize: 12, color: C.brand500, fontWeight: '600' },
  replyBar:         { flexDirection: 'row', alignItems: 'center', gap: SP.s2, paddingHorizontal: SP.s3, paddingVertical: SP.s2, backgroundColor: C.brand50, borderTopWidth: 1, borderTopColor: C.brand100 },
  replyThumb:       { width: 36, height: 36, borderRadius: R.sm },
  replyBarText:     { flex: 1, fontSize: 13, color: C.brand500, fontWeight: '500' },
  replyClose:       { fontSize: 16, color: C.textTertiary, fontWeight: '600' },
  bubbleText:       { fontSize: 15, lineHeight: 22 },
  bubbleTextUser:   { color: '#fff' },
  bubbleTextAi:     { color: C.textPrimary },
  typingRow:        { flexDirection: 'row', alignItems: 'center', gap: SP.s2, paddingLeft: SP.s2, paddingBottom: SP.s2 },
  typingText:       { fontSize: 13, color: C.textTertiary },
  inputRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: SP.s2, paddingHorizontal: SP.s3, paddingVertical: SP.s3, paddingBottom: SP.s5, backgroundColor: C.surface0, borderTopWidth: 1, borderTopColor: C.surface3 },
  micBtn:           { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: R.full, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  micBtnActive:     { backgroundColor: C.dangerBg },
  micIcon:          { width: 22, height: 22 },
  input:            { flex: 1, minHeight: TOUCH_MIN, maxHeight: 100, backgroundColor: C.surface2, borderRadius: R.lg, paddingHorizontal: SP.s3, paddingVertical: SP.s2, fontSize: 15, color: C.textPrimary },
  sendBtn:          { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: R.full, backgroundColor: C.brand500, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:  { backgroundColor: C.surface3 },
  sendIcon:         { width: 22, height: 22, tintColor: '#fff' },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  picker:           { backgroundColor: C.surface0, borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg, paddingTop: SP.s4, paddingBottom: SP.s8, maxHeight: '70%' },
  pickerTitle:      { fontSize: 14, fontWeight: '600', color: C.textSecondary, paddingHorizontal: SP.s4, marginBottom: SP.s2 },
  pickerRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.s4, paddingVertical: SP.s3 },
  pickerRowActive:  { backgroundColor: C.brand50 },
  pickerNative:     { fontSize: 16, color: C.textPrimary, flex: 1 },
  pickerNativeActive: { color: C.brand500, fontWeight: '600' },
  pickerEn:         { fontSize: 13, color: C.textTertiary, marginRight: SP.s2 },
  pickerCheck:      { fontSize: 16, color: C.brand500, fontWeight: '700' },
})
