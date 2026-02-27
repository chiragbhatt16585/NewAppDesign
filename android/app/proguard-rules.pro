# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Exclude AR-related classes to prevent AR dependency issues
-dontwarn com.google.ar.core.**
-keep class com.google.ar.core.** { *; }
-dontwarn androidx.xr.arcore.**
-keep class androidx.xr.arcore.** { *; }

# React Native Screens - Fix Fragment instantiation issues
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.rnscreens.ScreenFragment { *; }
-keep class com.swmansion.rnscreens.ScreenStackFragment { *; }
-keep class com.swmansion.rnscreens.ScreenContainerFragment { *; }
-keepclassmembers class com.swmansion.rnscreens.** {
    <init>(...);
}

# Keep all Fragment classes from react-native-screens
-keep class * extends androidx.fragment.app.Fragment {
    <init>(...);
}

# Keep Fragment constructors
-keepclassmembers class * extends androidx.fragment.app.Fragment {
    public <init>(...);
}
