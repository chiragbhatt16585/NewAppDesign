import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Foundation
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
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
