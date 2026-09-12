package PACKAGE_PLACEHOLDER

import android.content.pm.PackageManager
import android.util.Log
import com.clevertap.android.pushtemplates.PushTemplateNotificationHandler
import com.clevertap.android.sdk.CleverTapAPI
import com.clevertap.android.sdk.interfaces.NotificationHandler
import com.clevertap.react.CleverTapApplication
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.ReactNativeApplicationEntryPoint

class MainApplication : CleverTapApplication(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages

        override fun getJSMainModuleName(): String = "index"
        override fun getUseDeveloperSupport(): Boolean = true
        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = true
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    // Rich push templates + image rendering (must be set before CleverTap init)
    CleverTapAPI.setNotificationHandler(PushTemplateNotificationHandler() as NotificationHandler)
    super.onCreate()
    logCleverTapNativeCredentials()
    // Ensure CleverTap default instance exists before any FCM delivery thread runs.
    CleverTapAPI.getDefaultInstance(this)
    // OFF (-1): send profiles/events to Live. VERBOSE (3) routes to Test/Integration Debugger.
    CleverTapAPI.setDebugLevel(CleverTapAPI.LogLevel.OFF)
    ReactNativeApplicationEntryPoint.loadReactNative(this)
  }

  private fun logCleverTapNativeCredentials() {
    try {
      val meta = packageManager
        .getApplicationInfo(packageName, PackageManager.GET_META_DATA)
        .metaData
      val accountId = meta?.getString("CLEVERTAP_ACCOUNT_ID") ?: "(missing)"
      val token = meta?.getString("CLEVERTAP_TOKEN") ?: "(missing)"
      val region = meta?.getString("CLEVERTAP_REGION") ?: "(missing)"
      val env = if (accountId.startsWith("TEST-")) "TEST" else "LIVE"
      Log.i(
        "CleverTapCreds",
        "NATIVE CREDENTIALS accountId=$accountId token=$token region=$region environment=$env debugLevel=OFF(-1)",
      )
    } catch (e: Exception) {
      Log.w("CleverTapCreds", "Failed to read CleverTap meta-data", e)
    }
  }
}
