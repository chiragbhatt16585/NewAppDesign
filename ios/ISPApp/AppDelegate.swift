import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Foundation
import FirebaseCore
import CleverTapSDK
import CleverTapReact
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, CleverTapURLDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  override init() {
    super.init()
    // Set up global exception handler for Objective-C exceptions
    NSSetUncaughtExceptionHandler { exception in
      print("❌ Uncaught Exception: \(exception.name)")
      print("❌ Reason: \(exception.reason ?? "Unknown")")
      print("❌ Call Stack: \(exception.callStackSymbols.joined(separator: "\n"))")
      // Log to crash reporting service if available
      // Don't re-raise - let the app try to continue if possible
    }
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Wrap everything in do-catch to prevent crashes
    do {
      // Ensure Firebase default app is configured BEFORE React Native starts.
      // This fixes "No Firebase App '[DEFAULT]'" and allows FCM to work on iOS.
      if FirebaseApp.app() == nil {
        FirebaseApp.configure()
      }

      CleverTap.autoIntegrate()
      #if DEBUG
      CleverTap.setDebugLevel(3)
      #endif
      CleverTapReactManager.sharedInstance()?.applicationDidLaunch(options: launchOptions)
      CleverTap.sharedInstance()?.setUrlDelegate(self)
      // Take UNUserNotificationCenterDelegate so we can show foreground banners + log payloads.
      // Must forward to CleverTap via handleNotification(withData:) so click/viewed analytics
      // and CleverTapPushNotificationClicked still fire (autoIntegrate loses the delegate).
      UNUserNotificationCenter.current().delegate = self

      if let remoteNotification = launchOptions?[.remoteNotification] as? [AnyHashable: Any] {
        print("[CleverTap] Cold-start push payload: \(remoteNotification)")
      }

      let delegate = ReactNativeDelegate()
      let factory = RCTReactNativeFactory(delegate: delegate)
      delegate.dependencyProvider = RCTAppDependencyProvider()

      reactNativeDelegate = delegate
      reactNativeFactory = factory

      window = UIWindow(frame: UIScreen.main.bounds)
      
      // Verify bundle exists before starting React Native
      #if !DEBUG
      if let bundleURL = delegate.bundleURL(), !FileManager.default.fileExists(atPath: bundleURL.path) {
        // Bundle file doesn't exist - show error screen instead of crashing
        showErrorScreen(message: "App bundle not found. Please reinstall the app.")
        window?.makeKeyAndVisible()
        return true
      }
      #endif

      factory.startReactNative(
        withModuleName: "ISPApp",
        in: window,
        launchOptions: launchOptions
      )

      window?.makeKeyAndVisible()
    } catch {
      // If initialization fails, show error screen instead of crashing
      print("❌ App initialization error: \(error)")
      showErrorScreen(message: "Failed to initialize app. Please restart.")
      window?.makeKeyAndVisible()
    }

    return true
  }

  // MARK: - APNs registration

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("[CleverTap] APNs device token registered: \(token.prefix(16))...")
    CleverTap.sharedInstance()?.setPushToken(deviceToken)
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[CleverTap] APNs registration failed: \(error.localizedDescription)")
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    // Logging only — CleverTap.autoIntegrate() swizzles this for processing.
    print("[CleverTap] didReceiveRemoteNotification: \(userInfo)")
    completionHandler(.noData)
  }

  // MARK: - UNUserNotificationCenterDelegate (CleverTap / APNs)

  /// Show push while app is in foreground and record viewed event.
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    let userInfo = notification.request.content.userInfo
    print("[CleverTap] willPresent notification: \(userInfo)")
    CleverTap.sharedInstance()?.recordNotificationViewedEvent(withData: userInfo)
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .list, .sound, .badge])
    } else {
      completionHandler([.alert, .sound, .badge])
    }
  }

  /// Push tap — forward to CleverTap so JS gets CleverTapPushNotificationClicked.
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    print("[CleverTap] didReceive notification response: \(userInfo)")
    CleverTap.sharedInstance()?.handleNotification(withData: userInfo)
    completionHandler()
  }

  // CleverTapURLDelegate — push / in-app / inbox deep links
  func shouldHandleCleverTap(_ url: URL?, for channel: CleverTapChannel) -> Bool {
    guard let url else {
      return false
    }
    print("[CleverTap] Handling URL: \(url) for channel: \(channel)")
    return RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
  }

  // Deep links / custom URL schemes (e.g. microscan://refer-friend)
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links (https://www.microscaninternet.com/...)
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }
  
  private func showErrorScreen(message: String) {
    guard let window = window else { return }
    
    let errorViewController = UIViewController()
    errorViewController.view.backgroundColor = .white
    
    let label = UILabel()
    label.text = message
    label.textColor = .black
    label.textAlignment = .center
    label.numberOfLines = 0
    label.translatesAutoresizingMaskIntoConstraints = false
    
    errorViewController.view.addSubview(label)
    NSLayoutConstraint.activate([
      label.centerXAnchor.constraint(equalTo: errorViewController.view.centerXAnchor),
      label.centerYAnchor.constraint(equalTo: errorViewController.view.centerYAnchor),
      label.leadingAnchor.constraint(equalTo: errorViewController.view.leadingAnchor, constant: 20),
      label.trailingAnchor.constraint(equalTo: errorViewController.view.trailingAnchor, constant: -20)
    ])
    
    window.rootViewController = errorViewController
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    // In debug, try to get bundle from Metro bundler
    if let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") {
      return url
    }
    // Fallback to local bundle if Metro is not available
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #else
    // In production, load from bundle
    guard let url = Bundle.main.url(forResource: "main", withExtension: "jsbundle") else {
      print("❌ Error: main.jsbundle not found in app bundle")
      return nil
    }
    return url
    #endif
  }
}
