package com.pathshala.modules

import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.facebook.react.bridge.*
import java.util.Locale

class SpeechModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var tts: TextToSpeech? = null

    init {
        tts = TextToSpeech(reactContext.applicationContext) { /* init callback */ }
    }

    override fun getName() = "SpeechModule"

    @ReactMethod
    fun speak(text: String, langCode: String, promise: Promise) {
        val engine = tts ?: return promise.reject("TTS_ERROR", "TTS not ready")
        val locale = when (langCode) {
            "hi" -> Locale("hi", "IN")
            "ta" -> Locale("ta", "IN")
            "te" -> Locale("te", "IN")
            "bn" -> Locale("bn", "IN")
            "mr" -> Locale("mr", "IN")
            "gu" -> Locale("gu", "IN")
            "kn" -> Locale("kn", "IN")
            "ml" -> Locale("ml", "IN")
            "or" -> Locale("or", "IN")
            "pa" -> Locale("pa", "IN")
            "ur" -> Locale("ur", "PK")
            else -> Locale.ENGLISH
        }
        val res = engine.setLanguage(locale)
        if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
            engine.setLanguage(Locale.ENGLISH)
        }
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) { promise.resolve(null) }
            @Deprecated("Deprecated in Java")
            override fun onError(id: String?) { promise.reject("TTS_ERROR", "Speech failed") }
        })
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ps_utt")
    }

    @ReactMethod
    fun stop(promise: Promise) {
        tts?.stop()
        promise.resolve(null)
    }

    override fun onCatalystInstanceDestroy() {
        tts?.shutdown()
    }
}
