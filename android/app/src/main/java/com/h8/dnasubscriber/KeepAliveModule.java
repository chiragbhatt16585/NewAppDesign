package com.h8.dnasubscriber;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import android.content.Intent;
import android.util.Log;

public class KeepAliveModule extends ReactContextBaseJavaModule {
    private static final String TAG = "KeepAliveModule";
    
    public KeepAliveModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return "KeepAliveModule";
    }
    
    @ReactMethod
    public void startService(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
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

