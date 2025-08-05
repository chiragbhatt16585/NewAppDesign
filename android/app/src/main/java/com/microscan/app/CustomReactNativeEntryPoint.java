package com.microscan.app;

import android.content.Context;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.soloader.OpenSourceMergedSoMapping;
import com.facebook.soloader.SoLoader;

import java.io.IOException;

public class CustomReactNativeEntryPoint {
  public static void loadReactNative(Context context) {
    try {
       SoLoader.init(context, OpenSourceMergedSoMapping.INSTANCE);
    } catch (IOException error) {
      throw new RuntimeException(error);
    }
    
    // New architecture is disabled in gradle.properties and MainApplication.kt
    // No need to check BuildConfig
  }
} 