package com.pathshala.modules

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import com.pathshala.CameraActivity

class CameraModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName() = "CameraModule"

    @ReactMethod
    fun takePhoto(promise: Promise) {
        val activity = currentActivity
            ?: return promise.reject("NO_ACTIVITY", "No activity available")
        pendingPromise = promise
        val intent = Intent(reactApplicationContext, CameraActivity::class.java)
        activity.startActivityForResult(intent, REQUEST_CODE)
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REQUEST_CODE) return
        val p = pendingPromise ?: return
        pendingPromise = null
        if (resultCode == Activity.RESULT_OK) {
            val path = data?.getStringExtra("photo_path")
            if (path != null) p.resolve(path)
            else p.reject("CAMERA_ERROR", "No photo path returned")
        } else {
            p.reject("CAMERA_CANCELLED", "Cancelled")
        }
    }

    override fun onNewIntent(intent: Intent?) {}

    companion object {
        private const val REQUEST_CODE = 9001
    }
}
