import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { C, R } from '../theme'

interface Props { onPress: () => void; hitSlop?: number }

export default function BackButton({ onPress, hitSlop = 12 }: Props) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop} activeOpacity={0.7}>
      <View style={s.btn}>
        <Text style={s.arrow}>‹</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  btn:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 24, color: C.textPrimary, fontWeight: '600', lineHeight: 26, marginLeft: -2 },
})
