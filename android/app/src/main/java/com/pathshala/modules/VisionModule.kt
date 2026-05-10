package com.pathshala.modules

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

class VisionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "VisionModule"

    @ReactMethod
    fun getLastCameraPhoto(promise: Promise) {
        try {
            val resolver = reactApplicationContext.contentResolver
            val cursor = resolver.query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                arrayOf(MediaStore.Images.Media.DATA),
                null, null,
                "${MediaStore.Images.Media.DATE_ADDED} DESC"
            )
            if (cursor != null && cursor.moveToFirst()) {
                val path = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA))
                cursor.close()
                promise.resolve(path)
            } else {
                cursor?.close()
                promise.reject("NO_PHOTO", "No photos found on device")
            }
        } catch (e: Exception) {
            promise.reject("PHOTO_ERROR", e.message)
        }
    }

    @ReactMethod
    fun cropImage(imagePath: String, xRatio: Double, yRatio: Double, wRatio: Double, hRatio: Double, promise: Promise) {
        try {
            val bmp = BitmapFactory.decodeFile(imagePath)
                ?: return promise.reject("CROP_ERROR", "Cannot decode image")
            val x = (bmp.width  * xRatio).toInt().coerceIn(0, bmp.width  - 1)
            val y = (bmp.height * yRatio).toInt().coerceIn(0, bmp.height - 1)
            val w = (bmp.width  * wRatio).toInt().coerceIn(1, bmp.width  - x)
            val h = (bmp.height * hRatio).toInt().coerceIn(1, bmp.height - y)
            val cropped = Bitmap.createBitmap(bmp, x, y, w, h)
            bmp.recycle()
            val file = File(reactApplicationContext.cacheDir, "crop_${System.currentTimeMillis()}.jpg")
            FileOutputStream(file).use { it.let { out -> cropped.compress(Bitmap.CompressFormat.JPEG, 95, out) } }
            cropped.recycle()
            promise.resolve(file.absolutePath)
        } catch (e: Exception) {
            promise.reject("CROP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun recognizeText(imagePath: String, promise: Promise) {
        try {
            val bitmap = BitmapFactory.decodeFile(imagePath)
                ?: return promise.reject("OCR_ERROR", "Cannot decode image: $imagePath")
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

            recognizer.process(inputImage)
                .addOnSuccessListener { visionText ->
                    val blocks = WritableNativeArray()
                    for (block in visionText.textBlocks) {
                        val map = WritableNativeMap()
                        map.putString("text", block.text)
                        val bb = block.boundingBox
                        val rect = WritableNativeMap()
                        rect.putInt("left",   bb?.left   ?: 0)
                        rect.putInt("top",    bb?.top    ?: 0)
                        rect.putInt("right",  bb?.right  ?: 0)
                        rect.putInt("bottom", bb?.bottom ?: 0)
                        map.putMap("bounds", rect)
                        blocks.pushMap(map)
                    }
                    promise.resolve(blocks)
                }
                .addOnFailureListener { e -> promise.reject("OCR_ERROR", e.message) }
        } catch (e: Exception) {
            promise.reject("OCR_ERROR", e.message)
        }
    }
}
