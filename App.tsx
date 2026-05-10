import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Image, View } from 'react-native'
import { paperTheme, C } from './src/theme'
import { useStore } from './src/store/appStore'
import { AiRuntime } from './src/native/AiRuntime'
import { ModelDownload } from './src/native/ModelDownload'

import ModelDownloadScreen from './src/screens/ModelDownloadScreen'
import TeacherScreen from './src/screens/TeacherScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import HomeScreen from './src/screens/HomeScreen'
import ScanScreen from './src/screens/ScanScreen'
import ExplainScreen from './src/screens/ExplainScreen'
import QuizScreen from './src/screens/QuizScreen'
import ChatScreen from './src/screens/ChatScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.brand500,
        tabBarInactiveTintColor: C.textTertiary,
        tabBarStyle: { borderTopColor: C.surface3, height: 64, paddingBottom: 10, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Learn', tabBarIcon: ({ color }) => <Image source={require('./src/assets/icons/ic_books.png')} style={{ width: 28, height: 28, tintColor: color }} /> }}
      />
      <Tab.Screen
        name="Teacher"
        component={TeacherScreen}
        options={{ tabBarLabel: 'Teacher', tabBarIcon: ({ color }) => <Image source={require('./src/assets/icons/ic_teacher.png')} style={{ width: 28, height: 28, tintColor: color }} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <Image source={require('./src/assets/icons/ic_student.png')} style={{ width: 28, height: 28, tintColor: color }} /> }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const { setModelReady, setModelLoading, setModelExists, modelExists, _hydrated, hasOnboarded } = useStore()

  useEffect(() => {
    ModelDownload.checkModelExists().then(exists => {
      setModelExists(exists)
      if (exists) {
        setModelLoading(true)
        AiRuntime.warmup()
          .then(() => setModelReady(true))
          .catch((e: any) => { if (e?.code !== 'WARMUP_BUSY') setModelReady(false) })
          .finally(() => setModelLoading(false))
      }
    })
  }, [])

  if (!_hydrated || modelExists === null) return <View style={{ flex: 1, backgroundColor: '#fff' }} />

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}
            initialRouteName={!modelExists ? 'ModelDownload' : hasOnboarded ? 'Main' : 'Onboarding'}>
            <Stack.Screen name="ModelDownload" component={ModelDownloadScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Scan" component={ScanScreen} />
            <Stack.Screen name="Explain" component={ExplainScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  )
}
