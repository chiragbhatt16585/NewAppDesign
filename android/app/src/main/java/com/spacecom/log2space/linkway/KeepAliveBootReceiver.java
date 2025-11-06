package com.spacecom.log2space.linkway;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class KeepAliveBootReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    try {
      // Avoid starting on Android 14+ (SDK 34+) due to foreground service type restrictions
      if (Build.VERSION.SDK_INT >= 34) return;
      Intent serviceIntent = new Intent(context, KeepAliveService.class);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(serviceIntent);
      } else {
        context.startService(serviceIntent);
      }
    } catch (Exception ignored) {}
  }
}

