import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { C, SP, R } from '../theme'

export default function OfflineBadge({ ready }: { ready: boolean }) {
  return (
    <View style={[s.badge, ready ? s.ready : s.notReady]}>
      <Text style={[s.text, { color: ready ? C.success : C.warning }]}>
        {ready ? '● Offline · Ready' : '● Offline · Loading'}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  badge:    { flexDirection: 'row', alignItems: 'center', gap: SP.s1, paddingHorizontal: SP.s2, paddingVertical: SP.s1, borderRadius: R.full, borderWidth: 1 },
  ready:    { borderColor: C.successBg, backgroundColor: C.successBg },
  notReady: { borderColor: C.warningBg, backgroundColor: C.warningBg },
  text:     { fontSize: 11, fontWeight: '600' },
})
