package PACKAGE_PLACEHOLDER

import android.os.Bundle
import android.util.Log
import com.clevertap.android.sdk.CleverTapAPI
import com.clevertap.android.sdk.pushnotification.fcm.CTFcmMessageHandler
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * CleverTap test campaigns include a TEST- prefix in wzrk_acct_id, but the SDK registers
 * the default instance without that prefix. Normalize before rendering push notifications.
 * Also records Push Impressions after the notification is rendered.
 */
class MicroscanFcmMessageListenerService : FirebaseMessagingService() {
  private val handler = CTFcmMessageHandler()

  override fun onMessageReceived(message: RemoteMessage) {
    val bundle = remoteMessageToBundle(message)
    normalizeCleverTapAccountId(bundle)

    try {
      val info = CleverTapAPI.getNotificationInfo(bundle)
      if (info.fromCleverTap) {
        CleverTapAPI.createNotification(applicationContext, bundle)
        // createNotification + PushTemplateNotificationHandler raise Push Impressions
        // when enabled in CleverTap dashboard (Settings → Schema → Push Impressions).
        Log.d(TAG, "Rendered CleverTap notification: ${bundle.getString("nt")}")
        return
      }
    } catch (error: Exception) {
      Log.w(TAG, "CleverTap createNotification failed, using default FCM handler", error)
    }

    handler.createNotification(applicationContext, message)
  }

  override fun onNewToken(token: String) {
    super.onNewToken(token)
    handler.onNewToken(applicationContext, token)
  }

  private fun remoteMessageToBundle(message: RemoteMessage): Bundle {
    val bundle = Bundle()
    for ((key, value) in message.data) {
      bundle.putString(key, value)
    }
    message.notification?.let { notification ->
      notification.title?.let { bundle.putString("nt", it) }
      notification.body?.let { bundle.putString("nm", it) }
    }
    return bundle
  }

  private fun normalizeCleverTapAccountId(bundle: Bundle) {
    val accountId = bundle.getString("wzrk_acct_id") ?: return
    if (!accountId.startsWith(TEST_PREFIX)) {
      return
    }
    val normalized = accountId.removePrefix(TEST_PREFIX)
    bundle.putString("wzrk_acct_id", normalized)
    Log.d(TAG, "Normalized wzrk_acct_id: $accountId -> $normalized")
  }

  companion object {
    private const val TAG = "CleverTapFCM"
    private const val TEST_PREFIX = "TEST-"
  }
}
