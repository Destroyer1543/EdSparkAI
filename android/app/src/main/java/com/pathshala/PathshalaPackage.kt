package com.pathshala

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.pathshala.modules.*

class PathshalaPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = listOf(
        AiRuntimeModule(ctx),
        ModelDownloadModule(ctx),
        VisionModule(ctx),
        SpeechModule(ctx),
        SchoolPackModule(ctx),
        CameraModule(ctx),
        SpeechInputModule(ctx),
    )
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
