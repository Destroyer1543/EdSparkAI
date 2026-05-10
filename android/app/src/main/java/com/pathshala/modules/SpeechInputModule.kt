package com.pathshala.modules

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*

class SpeechInputModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var recognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun getName() = "SpeechInputModule"

    @ReactMethod
    fun startListening(langCode: String, promise: Promise) {
        mainHandler.post {
            try {
                recognizer?.destroy()
                recognizer = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, toBcp47(langCode))
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                }
                recognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onResults(bundle: Bundle) {
                        val results = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = results?.firstOrNull() ?: ""
                        recognizer?.destroy()
                        if (text.isBlank()) promise.reject("STT_EMPTY", "No speech detected")
                        else promise.resolve(text)
                    }
                    override fun onError(error: Int) {
                        recognizer?.destroy()
                        promise.reject("STT_ERROR", "Error: $error")
                    }
                    override fun onReadyForSpeech(p: Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(v: Float) {}
                    override fun onBufferReceived(b: ByteArray?) {}
                    override fun onEndOfSpeech() {}
                    override fun onPartialResults(b: Bundle?) {}
                    override fun onEvent(t: Int, b: Bundle?) {}
                })
                recognizer?.startListening(intent)
            } catch (e: Exception) {
                promise.reject("STT_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        mainHandler.post {
            recognizer?.stopListening()
            promise.resolve(null)
        }
    }

    private fun toBcp47(langCode: String): String = when (langCode) {
        "hi" -> "hi-IN"; "ta" -> "ta-IN"; "te" -> "te-IN"
        "bn" -> "bn-IN"; "mr" -> "mr-IN"; "gu" -> "gu-IN"
        "kn" -> "kn-IN"; "ml" -> "ml-IN"; "or" -> "or-IN"
        "pa" -> "pa-IN"; "ur" -> "ur-PK"
        else -> "en-IN"
    }

    override fun onCatalystInstanceDestroy() {
        mainHandler.post { recognizer?.destroy() }
    }
}
