package `in`.spacecom.log2space.client.microscan

import com.clevertap.android.sdk.CleverTapAPI
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
    super.onCreate()
    // Ensure CleverTap default instance exists before any FCM delivery thread runs.
    CleverTapAPI.getDefaultInstance(this)
    if (BuildConfig.DEBUG) {
      CleverTapAPI.setDebugLevel(CleverTapAPI.LogLevel.VERBOSE)
    }
    ReactNativeApplicationEntryPoint.loadReactNative(this)
  }
}
