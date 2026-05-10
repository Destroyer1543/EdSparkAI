package com.pathshala.modules

import com.facebook.react.bridge.*
import com.pathshala.modules.db.AppDatabase
import com.pathshala.modules.db.LearningAttempt
import com.pathshala.modules.db.TextbookChunk
import kotlinx.coroutines.*
import org.json.JSONObject

class SchoolPackModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val db by lazy { AppDatabase.get(reactApplicationContext) }

    override fun getName() = "SchoolPackModule"

    @ReactMethod
    fun importPack(jsonPath: String, promise: Promise) {
        scope.launch {
            try {
                val text = java.io.File(jsonPath).readText()
                val root = JSONObject(text)
                val grade = root.getString("grade")
                val subject = root.getString("subject")
                val chapters = root.getJSONArray("chapters")
                val chunks = mutableListOf<TextbookChunk>()
                for (ci in 0 until chapters.length()) {
                    val ch = chapters.getJSONObject(ci)
                    val chId = ch.getString("id")
                    val chTitle = ch.optString("title", chId)
                    val items = ch.getJSONArray("chunks")
                    for (ii in 0 until items.length()) {
                        val item = items.getJSONObject(ii)
                        chunks.add(TextbookChunk(
                            id = item.getString("id"),
                            subject = subject,
                            grade = grade,
                            chapter = chTitle,
                            pageNum = item.optInt("page", 0),
                            content = item.getString("content"),
                            keywords = item.optString("keywords", ""),
                        ))
                    }
                }
                db.chunkDao().insertChunks(chunks)
                promise.resolve(chunks.size)
            } catch (e: Exception) {
                promise.reject("IMPORT_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun retrieve(query: String, grade: String, subject: String, promise: Promise) {
        scope.launch {
            try {
                val dao = db.chunkDao()
                val results = dao.search(query, grade, subject)
                    .ifEmpty { dao.fallback(grade, subject) }
                promise.resolve(results.joinToString("\n---\n") { it.content })
            } catch (e: Exception) {
                promise.resolve("") // non-fatal: proceed without context
            }
        }
    }

    @ReactMethod
    fun recordAttempt(studentId: String, chunkId: String, topic: String, isCorrect: Boolean, promise: Promise) {
        scope.launch {
            try {
                db.chunkDao().insertAttempt(LearningAttempt(
                    studentId = studentId,
                    chunkId = chunkId,
                    topic = topic,
                    isCorrect = isCorrect,
                ))
                promise.resolve(null)
            } catch (e: Exception) {
                promise.resolve(null) // non-fatal
            }
        }
    }

    @ReactMethod
    fun getWeakTopics(studentId: String, promise: Promise) {
        scope.launch {
            try {
                val topics = db.chunkDao().weakTopics(studentId)
                val arr = WritableNativeArray()
                for (t in topics) {
                    val m = WritableNativeMap()
                    m.putString("topic", t.topic)
                    m.putDouble("score", t.score)
                    arr.pushMap(m)
                }
                promise.resolve(arr)
            } catch (e: Exception) {
                promise.resolve(WritableNativeArray())
            }
        }
    }

    override fun onCatalystInstanceDestroy() { scope.cancel() }
}
