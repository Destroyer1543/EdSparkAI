import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { C, SP, R, TOUCH_CTA } from '../theme'
import { Speech } from '../native/Speech'

interface Props {
  onReadAloud: () => void
  speaking: boolean
  onQuiz: () => void
  onSimpler: () => void
}

export default function ActionBar({ onReadAloud, speaking, onQuiz, onSimpler }: Props) {
  return (
    <View style={s.bar}>
      <ActionBtn
        icon={<Image source={speaking ? require('../assets/icons/ic_speaker_off.png') : require('../assets/icons/ic_speaker.png')} style={s.ico} />}
        label={speaking ? 'Stop' : 'Read Aloud'}
        onPress={speaking ? () => Speech.stop() : onReadAloud}
      />
      <ActionBtn
        icon={<Image source={require('../assets/icons/ic_pencil.png')} style={s.ico} />}
        label="Simpler"
        onPress={onSimpler}
      />
      <ActionBtn
        icon={<Image source={require('../assets/icons/ic_quiz.png')} style={[s.ico, {tintColor:'#fff'}]} />}
        label="Take Quiz"
        onPress={onQuiz}
        primary
      />
    </View>
  )
}

function ActionBtn({ icon, label, onPress, primary }: { icon: React.ReactNode; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <TouchableOpacity style={[s.btn, primary && s.btnPrimary]} onPress={onPress} activeOpacity={0.75}>
      {icon}
      <Text style={[s.label, primary && s.labelPrimary]}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  bar:         { flexDirection: 'row', gap: SP.s2, paddingHorizontal: SP.s4, paddingVertical: SP.s3, paddingBottom: SP.s5, backgroundColor: C.surface0, borderTopWidth: 1, borderTopColor: C.surface3 },
  ico:         { width: 22, height: 22 },
  btn:         { flex: 1, height: TOUCH_CTA, borderRadius: R.md, borderWidth: 1.5, borderColor: C.surface3, alignItems: 'center', justifyContent: 'center', gap: SP.s1 },
  btnPrimary:  { flex: 2, borderColor: C.brand500, backgroundColor: C.brand500 },
  label:       { fontSize: 12, fontWeight: '600', color: C.brand500 },
  labelPrimary:{ color: '#fff' },
})
