package PACKAGE_PLACEHOLDER

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.clevertap.android.sdk.CleverTapAPI
import com.clevertap.react.CleverTapRnAPI
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    CleverTapRnAPI.setInitialUri(intent?.data)
    super.onCreate(null)
    // Cold-start push click (Android 12+)
    notifyCleverTapPushClicked(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    CleverTapRnAPI.setInitialUri(intent.data)
    emitUrlToJavaScript(intent.dataString)
    // Android 12+ trampoline: raise push-click so JS gets CleverTapPushNotificationClicked
    notifyCleverTapPushClicked(intent)
  }

  override fun getMainComponentName(): String = "ISPApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  private fun notifyCleverTapPushClicked(intent: Intent?) {
    if (intent == null) {
      return
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return
    }
    try {
      CleverTapAPI.getDefaultInstance(applicationContext)
          ?.pushNotificationClickedEvent(intent.extras)
    } catch (error: Throwable) {
      Log.w("CleverTapPush", "pushNotificationClickedEvent failed: ${error.message}")
    }
  }

  private fun emitUrlToJavaScript(url: String?) {
    if (url.isNullOrBlank()) {
      return
    }

    try {
      val reactContext: ReactContext? =
          try {
            reactNativeHost.reactInstanceManager.currentReactContext
          } catch (_: Throwable) {
            null
          }

      if (reactContext == null || !reactContext.hasActiveReactInstance()) {
        Log.w("DeepLink", "React context not ready for URL: $url")
        return
      }

      val payload = Arguments.createMap()
      payload.putString("url", url)
      reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("url", payload)
      Log.i("DeepLink", "Emitted url event to JS: $url")
    } catch (error: Throwable) {
      Log.w("DeepLink", "Failed to emit url event: ${error.message}")
    }
  }
}
