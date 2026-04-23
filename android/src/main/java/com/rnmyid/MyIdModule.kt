package com.rnmyid

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.util.Base64
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import uz.myid.android.sdk.capture.MyIdClient
import uz.myid.android.sdk.capture.MyIdConfig
import uz.myid.android.sdk.capture.MyIdException
import uz.myid.android.sdk.capture.MyIdResult
import uz.myid.android.sdk.capture.MyIdResultListener
import uz.myid.android.sdk.capture.model.MyIdEnvironment
import uz.myid.android.sdk.capture.model.MyIdEvent
import uz.myid.android.sdk.capture.model.MyIdGraphicFieldType
import uz.myid.android.sdk.capture.model.MyIdLocale
import java.io.ByteArrayOutputStream

class MyIdModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), MyIdResultListener, ActivityEventListener {

    private val client = MyIdClient()

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun addListener(eventName: String?) {
        // Required no-op for NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // Required no-op for NativeEventEmitter.
    }

    @ReactMethod
    fun start(
        sessionId: String,
        clientHash: String,
        clientHashId: String,
        environment: String,
        locale: String
    ) {
        val config = MyIdConfig.Builder(sessionId)
            .withClientHash(clientHash, clientHashId)
            .withEnvironment(
                if (environment.equals("PRODUCTION", ignoreCase = true)) MyIdEnvironment.Production
                else MyIdEnvironment.Debug
            )
            .withLocale(mapLocale(locale))
            .build()

        val activity = reactContext.currentActivity
        if (activity == null) {
            emit(
                "onError",
                Arguments.createMap().apply {
                    putString("message", "No current activity to start MyId")
                    putInt("code", -1)
                }
            )
            return
        }
        val intent = client.createIntent(activity, config)
        activity.startActivityForResult(intent, MY_ID_REQUEST_CODE)
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == MY_ID_REQUEST_CODE) {
            client.handleActivityResult(resultCode, this)
        }
    }

    override fun onNewIntent(intent: Intent) {
        // No-op
    }

    override fun onSuccess(result: MyIdResult) {
        val bitmap = result.getGraphicFieldImageByType(MyIdGraphicFieldType.FacePortrait)
        val base64Image = bitmap?.let { encodeToBase64(it) }
        val params = Arguments.createMap().apply {
            putString("code", result.code)
            if (base64Image != null) putString("image", base64Image)
        }
        emit("onSuccess", params)
    }

    override fun onError(e: MyIdException) {
        val params = Arguments.createMap().apply {
            putString("message", e.message)
            putInt("code", e.code)
        }
        emit("onError", params)
    }

    override fun onUserExited() {
        val params = Arguments.createMap().apply {
            putString("message", "User exited MyId")
        }
        emit("onUserExited", params)
    }

    override fun onEvent(event: MyIdEvent) {
        // Intentionally unused at the JS layer.
    }

    private fun mapLocale(locale: String): MyIdLocale = when (locale.lowercase()) {
        "ru" -> MyIdLocale.Russian
        "en" -> MyIdLocale.English
        "uz-cyrl", "cyrl" -> MyIdLocale.UzbekCyrillic
        else -> MyIdLocale.Uzbek
    }

    private fun emit(eventName: String, params: WritableMap) {
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(eventName, params)
    }

    private fun encodeToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
    }

    companion object {
        const val NAME = "RNMyId"
        private const val MY_ID_REQUEST_CODE = 0x4D59 // "MY"
    }
}
