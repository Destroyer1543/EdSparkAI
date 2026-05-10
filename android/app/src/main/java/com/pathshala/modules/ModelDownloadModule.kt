package com.pathshala.modules

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import android.os.StatFs
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong

class ModelDownloadModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val scope  = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(0,  TimeUnit.SECONDS)
        .build()

    private val CHUNKS = 6          // parallel streams
    private val BUF    = 512 * 1024 // 512 KB per stream buffer

    override fun getName() = "ModelDownloadModule"

    fun modelFile(): File {
        val dir = File(reactApplicationContext.filesDir, "models")
        dir.mkdirs()
        return File(dir, "model.litertlm")
    }

    private val legacyPaths = listOf(
        "/data/local/tmp/gemma4/model.litertlm",
        "/data/local/tmp/pathshala/model.litertlm",
    )

    @ReactMethod
    fun checkModelExists(promise: Promise) {
        val primary = modelFile()
        if (primary.exists() && primary.length() > 100_000_000L) { promise.resolve(true); return }
        promise.resolve(legacyPaths.any { File(it).exists() && File(it).length() > 100_000_000L })
    }

    @ReactMethod
    fun getModelPath(promise: Promise) {
        promise.resolve(modelFile().absolutePath)
    }

    @ReactMethod
    fun downloadModel(url: String, promise: Promise) {
        scope.launch {
            val dest = modelFile()
            try {
                // Storage check
                val stat = StatFs(reactApplicationContext.filesDir.absolutePath)
                val free = stat.availableBlocksLong * stat.blockSizeLong
                if (free < 2_700_000_000L) {
                    promise.reject("NO_SPACE", "Need ~2.7 GB free (have ${free / 1_000_000_000L} GB).")
                    return@launch
                }

                // Get total file size via HEAD
                val headResp = client.newCall(Request.Builder().url(url).head().build()).execute()
                val total = headResp.headers["Content-Length"]?.toLongOrNull()
                    ?: headResp.body?.contentLength()?.takeIf { it > 0 }
                    ?: run {
                        // HEAD didn't give size — fall back to single-stream download
                        singleStream(url, dest, promise)
                        return@launch
                    }
                headResp.close()

                // Check if server supports range requests
                val rangeCheck = client.newCall(
                    Request.Builder().url(url).header("Range", "bytes=0-0").build()
                ).execute()
                val supportsRange = rangeCheck.code == 206
                rangeCheck.close()

                if (!supportsRange) {
                    singleStream(url, dest, promise)
                    return@launch
                }

                // Parallel chunk download
                val tmp = File(dest.parent, "model_par.tmp")
                // Pre-allocate file
                RandomAccessFile(tmp, "rw").use { it.setLength(total) }

                val chunkSize  = total / CHUNKS
                val downloaded = AtomicLong(0L)
                var lastEmit   = System.currentTimeMillis()

                val jobs = (0 until CHUNKS).map { i ->
                    val start = i * chunkSize
                    val end   = if (i == CHUNKS - 1) total - 1 else (i + 1) * chunkSize - 1
                    async(Dispatchers.IO) {
                        downloadChunk(url, tmp, start, end, downloaded, total) {
                            val now = System.currentTimeMillis()
                            if (now - lastEmit >= 200) {
                                lastEmit = now
                                emitProgress(downloaded.get(), total)
                            }
                        }
                    }
                }

                try {
                    jobs.awaitAll()
                } catch (e: Exception) {
                    tmp.delete()
                    promise.reject("DOWNLOAD_ERROR", e.message ?: "Chunk download failed")
                    return@launch
                }

                emitProgress(total, total)
                tmp.renameTo(dest)
                promise.resolve(dest.absolutePath)

            } catch (e: Exception) {
                promise.reject("DOWNLOAD_ERROR", e.message ?: "Download failed")
            }
        }
    }

    private suspend fun downloadChunk(
        url: String,
        dest: File,
        start: Long,
        end: Long,
        totalDownloaded: AtomicLong,
        totalSize: Long,
        onProgress: () -> Unit,
    ) = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url(url)
            .header("Range", "bytes=$start-$end")
            .build()
        val resp = client.newCall(req).execute()
        check(resp.code == 206) { "Expected 206, got ${resp.code}" }
        val body = resp.body ?: error("Empty chunk body")
        val buf  = ByteArray(BUF)
        RandomAccessFile(dest, "rw").use { raf ->
            raf.seek(start)
            body.byteStream().use { input ->
                var n: Int
                while (input.read(buf).also { n = it } != -1) {
                    raf.write(buf, 0, n)
                    totalDownloaded.addAndGet(n.toLong())
                    onProgress()
                }
            }
        }
    }

    private suspend fun singleStream(url: String, dest: File, promise: Promise) {
        val tmp = File(dest.parent, "model.tmp")
        try {
            val resumeFrom = if (tmp.exists()) tmp.length() else 0L
            val reqBuilder = Request.Builder().url(url)
            if (resumeFrom > 0) reqBuilder.header("Range", "bytes=$resumeFrom-")
            val resp = client.newCall(reqBuilder.build()).execute()
            if (!resp.isSuccessful && resp.code != 206) {
                promise.reject("HTTP_ERROR", "Server returned ${resp.code}")
                return
            }
            val body = resp.body ?: run { promise.reject("NO_BODY", "Empty response"); return }
            val contentLen = body.contentLength()
            val total = if (contentLen > 0) contentLen + resumeFrom else -1L
            var downloaded = resumeFrom
            FileOutputStream(tmp, resumeFrom > 0).use { out ->
                val buf = ByteArray(BUF)
                body.byteStream().use { input ->
                    var n: Int
                    while (input.read(buf).also { n = it } != -1) {
                        out.write(buf, 0, n)
                        downloaded += n
                        emitProgress(downloaded, total)
                    }
                }
            }
            tmp.renameTo(dest)
            promise.resolve(dest.absolutePath)
        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message ?: "Download failed")
        }
    }

    private fun emitProgress(downloaded: Long, total: Long) {
        val params = Arguments.createMap().apply {
            putDouble("bytesDownloaded", downloaded.toDouble())
            putDouble("totalBytes",      total.toDouble())
            putDouble("percent",         if (total > 0) downloaded * 100.0 / total else 0.0)
        }
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("ModelDownloadProgress", params)
    }

    @ReactMethod
    fun cancelDownload(promise: Promise) {
        client.dispatcher.cancelAll()
        promise.resolve(null)
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
