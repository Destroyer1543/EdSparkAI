import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import type { MD3Theme } from 'react-native-paper'

export const C = {
  brand500: '#6E56F7',
  brand600: '#5B43E0',
  brand100: '#EDE8FF',
  brand200: '#D5C9FF',
  brand50:  '#F6F3FF',
  surface0: '#FFFFFF',
  surface1: '#FAFAFA',
  surface2: '#F4F4F5',
  surface3: '#E8E8EA',
  surface0Dark: '#0E0E10',
  surface1Dark: '#161618',
  surface2Dark: '#1F1F22',
  surface3Dark: '#2A2A2E',
  textPrimary:   '#0E0E10',
  textSecondary: '#52525B',
  textTertiary:  '#8B8B92',
  textDisabled:  '#C2C2C8',
  textInverse:   '#FAFAFA',
  success:    '#16A34A',
  successBg:  '#DCFCE7',
  warning:    '#D97706',
  warningBg:  '#FEF3C7',
  danger:     '#DC2626',
  dangerBg:   '#FEE2E2',
} as const

export const SP = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s8: 48, s10: 64 } as const
export const R  = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 } as const
export const TOUCH_MIN = 48
export const TOUCH_CTA = 56

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          C.brand500,
    primaryContainer: C.brand100,
    secondary:        C.textSecondary,
    surface:          C.surface0,
    surfaceVariant:   C.surface2,
    background:       C.surface1,
    error:            C.danger,
    onPrimary:        '#FFFFFF',
    onBackground:     C.textPrimary,
    onSurface:        C.textPrimary,
    outline:          C.surface3,
  },
}

export const shadow1 = {
  shadowColor: '#0E0E10',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 2,
}

export const shadowBrand = {
  shadowColor: C.brand500,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.24,
  shadowRadius: 8,
  elevation: 4,
}
