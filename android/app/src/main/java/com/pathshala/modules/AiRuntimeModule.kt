package com.pathshala.modules

import android.content.Context
import android.os.PowerManager
import android.util.Log
import com.facebook.react.bridge.*
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig
import kotlinx.coroutines.*
import java.io.File

class AiRuntimeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var engine: Engine? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var warming = false
    private var activeConversation: Conversation? = null
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    companion object {
        const val TAG = "AiRuntimeModule"
        private const val MODEL_PATH_LEGACY = "/data/local/tmp/gemma4/model.litertlm"
        private const val MAX_TOKENS = 2048
    }

    override fun getName() = "AiRuntimeModule"

    @ReactMethod
    fun warmup(promise: Promise) {
        if (engine != null) { promise.resolve(null); return }
        if (warming) { promise.reject("WARMUP_BUSY", "Warmup already in progress"); return }
        warming = true
        scope.launch {
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            val wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "pathshala:engine")
            wl.acquire(30 * 60 * 1000L)
            try {
                val filesDir = File(reactApplicationContext.filesDir, "models/model.litertlm")
                val modelPath = if (filesDir.exists()) filesDir.absolutePath else MODEL_PATH_LEGACY
                val cfg = EngineConfig(
                    modelPath = modelPath,
                    backend = Backend.CPU(),
                    visionBackend = Backend.CPU(),
                    audioBackend = Backend.CPU(),
                    maxNumTokens = MAX_TOKENS,
                )
                val e = Engine(cfg)
                e.initialize()
                engine = e
                wakeLock = wl
                Log.d(TAG, "Engine ready — backend: CPU")
                promise.resolve(null)
            } catch (e: Exception) {
                Log.e(TAG, "Warmup failed: ${e.message}")
                if (wl.isHeld) wl.release()
                promise.reject("WARMUP_ERROR", e.message)
            } finally {
                warming = false
            }
        }
    }

    @ReactMethod
    fun explainPage(ocrText: String, lang: String, ragContext: String, difficulty: String, promise: Promise) {
        val e = engine ?: return promise.reject("NOT_READY", "Call warmup() first.")
        scope.launch {
            try {
                val (system, user) = buildExplainPrompt(ocrText, lang, ragContext, difficulty)
                val raw = runInference(e, system, user)
                Log.d(TAG, "explainPage raw: ${raw.take(200)}")
                promise.resolve(extractJson(raw))
            } catch (ex: Exception) {
                Log.e(TAG, "explainPage error: ${ex.message}")
                promise.reject("EXPLAIN_ERROR", ex.message)
            }
        }
    }

    @ReactMethod
    fun generateTeacherPack(ocrText: String, classGrade: String, lang: String, promise: Promise) {
        val e = engine ?: return promise.reject("NOT_READY", "Call warmup() first.")
        scope.launch {
            try {
                val (system, user) = buildTeacherPackPrompt(ocrText, classGrade, lang)
                val raw = runInference(e, system, user)
                Log.d(TAG, "teacherPack raw: ${raw.take(200)}")
                promise.resolve(extractJson(raw))
            } catch (ex: Exception) {
                Log.e(TAG, "teacherPack error: ${ex.message}")
                promise.reject("TEACHER_PACK_ERROR", ex.message)
            }
        }
    }

    @ReactMethod
    fun startChat(ocrText: String, explainSummary: String, lang: String, promise: Promise) {
        val e = engine ?: return promise.reject("NOT_READY", "Call warmup() first.")
        scope.launch {
            try {
                try { activeConversation?.close() } catch (_: Exception) {}
                val system = "You are EdSparkAI, an offline AI tutor. The student is looking at a textbook page.\n\nPage content: ${ocrText.take(400)}\n${if (explainSummary.isNotBlank()) "Summary: ${explainSummary.take(150)}" else ""}\n\nAnswer student questions in $lang. Be concise (2-3 sentences). No markdown."
                val convCfg = ConversationConfig(
                    systemInstruction = Contents.of(system),
                    samplerConfig = SamplerConfig(topK = 16, topP = 0.9, temperature = 0.5, seed = 42),
                )
                activeConversation = e.createConversation(convCfg)
                Log.d(TAG, "Chat session started")
                promise.resolve(null)
            } catch (ex: Exception) {
                Log.e(TAG, "startChat error: ${ex.message}")
                promise.reject("CHAT_ERROR", ex.message)
            }
        }
    }

    @ReactMethod
    fun chat(message: String, promise: Promise) {
        val conv = activeConversation ?: return promise.reject("NO_SESSION", "Call startChat() first.")
        scope.launch {
            try {
                val msg = conv.sendMessage(message.take(400))
                val response = msg.contents.contents
                    .filterIsInstance<Content.Text>()
                    .joinToString("") { it.text }
                    .trim()
                    .ifEmpty { "Sorry, I could not generate a response. Try again." }
                Log.d(TAG, "chat: ${response.take(100)}")
                promise.resolve(response)
            } catch (ex: Exception) {
                Log.e(TAG, "chat error: ${ex.message}")
                promise.reject("CHAT_ERROR", ex.message)
            }
        }
    }

    @ReactMethod
    fun chatWithImage(message: String, imagePath: String, promise: Promise) {
        val conv = activeConversation ?: return promise.reject("NO_SESSION", "Call startChat() first.")
        scope.launch {
            try {
                // Run OCR on the image to extract text context, then send with question
                val ocrResult = runCatching {
                    com.google.mlkit.vision.common.InputImage.fromFilePath(
                        reactApplicationContext, android.net.Uri.fromFile(java.io.File(imagePath))
                    ).let { image ->
                        var ocrText = ""
                        val task = com.google.mlkit.vision.text.TextRecognition.getClient(
                            com.google.mlkit.vision.text.latin.TextRecognizerOptions.DEFAULT_OPTIONS
                        ).process(image)
                        val latch = java.util.concurrent.CountDownLatch(1)
                        task.addOnSuccessListener { result -> ocrText = result.text; latch.countDown() }
                            .addOnFailureListener { latch.countDown() }
                        latch.await(5, java.util.concurrent.TimeUnit.SECONDS)
                        ocrText
                    }
                }.getOrDefault("")
                val contextualMessage = if (ocrResult.isNotBlank())
                    "[Image text: ${ocrResult.take(400)}]\nQuestion: ${message.take(400)}"
                else
                    message.take(600)
                val msg = conv.sendMessage(contextualMessage)
                val response = msg.contents.contents.filterIsInstance<Content.Text>()
                    .joinToString("") { it.text }.trim()
                    .ifEmpty { "Sorry, I could not generate a response. Try again." }
                promise.resolve(response)
            } catch (ex: Exception) {
                Log.e(TAG, "chatWithImage error: ${ex.message}")
                promise.reject("CHAT_ERROR", ex.message)
            }
        }
    }

    @ReactMethod
    fun endChat(promise: Promise) {
        scope.launch {
            try { activeConversation?.close() } catch (_: Exception) {}
            activeConversation = null
            promise.resolve(null)
        }
    }

    private fun runInference(e: Engine, systemPrompt: String, userPrompt: String): String {
        try { activeConversation?.close() } catch (_: Exception) {}
        activeConversation = null

        val convCfg = ConversationConfig(
            systemInstruction = Contents.of(systemPrompt),
            samplerConfig = SamplerConfig(topK = 16, topP = 0.9, temperature = 0.2, seed = 42),
        )
        val conv = e.createConversation(convCfg)
        activeConversation = conv
        return try {
            val msg = conv.sendMessage(userPrompt)
            msg.contents.contents
                .filterIsInstance<Content.Text>()
                .joinToString("") { it.text }
                .ifEmpty { throw Exception("Empty response from model") }
        } finally {
            try { conv.close() } catch (_: Exception) {}
            activeConversation = null
        }
    }

    private fun buildExplainPrompt(text: String, lang: String, context: String, difficulty: String): Pair<String, String> {
        val schema = """{"simple_explanation":"string","local_language_explanation":"string","key_points":["string"],"daily_life_example":"string","grounding_source":"string","quiz":[{"question":"string","options":["A","B","C","D"],"correct_index":0}]}"""
        val system = "You are EdSparkAI, an offline AI tutor. You MUST respond with ONLY a JSON object. No explanation, no markdown, no code fences. Start your response with { and end with }."
        val levelHint = when (difficulty) {
            "simple"   -> "Use very simple words for an 8-year-old child."
            "advanced" -> "Use technical depth and precise terminology."
            else       -> "Use language suitable for a Grade 7 student."
        }
        val user = "Fill this JSON schema with real content. Do not copy the schema — write actual explanations.\nSCHEMA: $schema\nLANG: $lang\nLEVEL: $levelHint\nTEXT: ${text.take(350)}\nRules: simple_explanation in English, local_language_explanation in $lang, 2 quiz questions, correct_index is 0-3. Output JSON only."
        return Pair(system, user)
    }

    private fun buildTeacherPackPrompt(text: String, grade: String, lang: String): Pair<String, String> {
        val schema = """{"objective":"string","blackboard_summary":"string","recap_5_min":"string","worksheet":"string","homework":"string","slow_learner_version":"string","advanced_challenge":"string"}"""
        val system = "You are EdSparkAI. Respond with ONLY a JSON object. No markdown, no explanation. Start with { and end with }."
        val user = "Fill this JSON schema with real lesson content.\nSCHEMA: $schema\nGRADE: $grade\nLANG: $lang\nTEXT: ${text.take(450)}\nOutput JSON only."
        return Pair(system, user)
    }

    private fun extractJson(raw: String): String {
        // Strip markdown code fences
        var s = raw.replace(Regex("```(?:json|JSON)?\\s*"), "").replace("```", "").trim()

        val start = s.indexOf('{')
        if (start < 0) throw Exception("Model did not return JSON. Got: ${s.take(120)}")
        s = s.substring(start)

        // If JSON was truncated, attempt repair
        val end = s.lastIndexOf('}')
        if (end < 0) {
            // Close any open string literal
            if (s.count { it == '"' } % 2 != 0) s += "\""
            // Balance brackets and braces
            val openArr   = s.count { it == '[' } - s.count { it == ']' }
            val openObj   = s.count { it == '{' } - s.count { it == '}' }
            repeat(openArr.coerceAtLeast(0)) { s += "]" }
            repeat(openObj.coerceAtLeast(0)) { s += "}" }
        } else {
            s = s.substring(0, end + 1)
        }

        return s
    }

    override fun onCatalystInstanceDestroy() {
        scope.cancel()
        try { activeConversation?.close() } catch (_: Exception) {}
        engine?.close()
        if (wakeLock?.isHeld == true) wakeLock?.release()
    }
}
