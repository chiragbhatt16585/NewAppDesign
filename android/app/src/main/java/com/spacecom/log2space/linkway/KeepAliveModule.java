package com.spacecom.log2space.linkway;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import android.content.Intent;
import android.util.Log;
import android.os.Build;

public class KeepAliveModule extends ReactContextBaseJavaModule {
    private static final String TAG = "KeepAliveModule";
    
    public KeepAliveModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() { return "KeepAliveModule"; }
    
    @ReactMethod
    public void startService(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            // Do not start on Android 14+ (SDK 34+) to avoid MissingForegroundServiceTypeException
            if (Build.VERSION.SDK_INT >= 34) {
                Log.d(TAG, "Skipping KeepAliveService start on Android 14+");
                promise.resolve("Skipped on Android 14+");
                return;
            }
            Intent serviceIntent = new Intent(context, KeepAliveService.class);
            context.startService(serviceIntent);
            Log.d(TAG, "KeepAliveService started successfully");
            promise.resolve("Service started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start KeepAliveService", e);
            promise.reject("SERVICE_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void stopService(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, KeepAliveService.class);
            context.stopService(serviceIntent);
            Log.d(TAG, "KeepAliveService stopped successfully");
            promise.resolve("Service stopped");
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop KeepAliveService", e);
            promise.reject("SERVICE_ERROR", e.getMessage());
        }
    }
}


