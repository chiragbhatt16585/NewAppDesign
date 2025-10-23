import { AppState, AppStateStatus, Platform, NativeModules } from 'react-native';

export class AppLifecycleManager {
  private static instance: AppLifecycleManager;
  private appStateSubscription: any = null;
  private backgroundTime: number = 0;
  private isInBackground: boolean = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private backgroundTaskInterval: NodeJS.Timeout | null = null;
  private readonly BACKGROUND_THRESHOLD = 2 * 60 * 1000; // 2 minutes (reduced)
  private readonly KEEP_ALIVE_INTERVAL = 15 * 1000; // 15 seconds (more frequent)
  private readonly BACKGROUND_TASK_INTERVAL = 30 * 1000; // 30 seconds

  private constructor() {
    this.initializeAppStateListener();
  }

  static getInstance(): AppLifecycleManager {
    if (!AppLifecycleManager.instance) {
      AppLifecycleManager.instance = new AppLifecycleManager();
    }
    return AppLifecycleManager.instance;
  }

  private initializeAppStateListener(): void {
    console.log('🔄 Initializing Enhanced App Lifecycle Manager...');
    
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    
    // Start keep-alive mechanism for Android
    if (Platform.OS === 'android') {
      this.startKeepAlive();
      this.startBackgroundTasks();
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log('📱 App state changed:', { from: AppState.currentState, to: nextAppState });
    
    if (nextAppState === 'background') {
      this.handleBackgroundState();
    } else if (nextAppState === 'active') {
      this.handleActiveState();
    }
  }

  private handleBackgroundState(): void {
    this.isInBackground = true;
    this.backgroundTime = Date.now();
    console.log('📱 App went to background at:', new Date(this.backgroundTime).toISOString());
    
    // Optimize memory usage when going to background
    this.optimizeForBackground();
  }

  private handleActiveState(): void {
    const wasInBackground = this.isInBackground;
    const backgroundDuration = this.isInBackground ? Date.now() - this.backgroundTime : 0;
    
    console.log('📱 App became active. Background duration:', backgroundDuration, 'ms');
    
    this.isInBackground = false;
    
    if (wasInBackground && backgroundDuration > this.BACKGROUND_THRESHOLD) {
      console.log('📱 App was in background for extended period, triggering cleanup...');
      this.handleExtendedBackgroundReturn();
    }
  }

  private optimizeForBackground(): void {
    // Clear any unnecessary caches or timers
    console.log('🧹 Optimizing app for background state...');
    
    // Reduce memory footprint
    if (global.gc) {
      global.gc();
    }
  }

  private handleExtendedBackgroundReturn(): void {
    // Perform cleanup and refresh when returning from extended background
    console.log('🔄 Handling extended background return...');
    
    // Trigger data refresh if needed
    this.triggerDataRefresh();
  }

  private triggerDataRefresh(): void {
    // This will be called by other services that need to refresh data
    console.log('🔄 Triggering data refresh after background return...');
  }

  private startKeepAlive(): void {
    // Keep the app alive by performing lightweight operations
    this.keepAliveInterval = setInterval(() => {
      console.log('💓 Keep-alive heartbeat...');
      this.performKeepAliveOperation();
    }, this.KEEP_ALIVE_INTERVAL);
  }

  private startBackgroundTasks(): void {
    // Perform background tasks to keep the app active
    this.backgroundTaskInterval = setInterval(() => {
      if (this.isInBackground) {
        console.log('🔄 Background task running...');
        this.performBackgroundTask();
      }
    }, this.BACKGROUND_TASK_INTERVAL);
  }

  private performKeepAliveOperation(): void {
    // Lightweight operation to prevent app from being killed
    try {
      // Touch AsyncStorage to keep app active
      const timestamp = Date.now().toString();
      console.log('💓 Keep-alive operation completed:', timestamp);
      
      // Perform a minimal operation to keep the app alive
      if (Platform.OS === 'android') {
        // Try to start foreground service if available
        this.tryStartForegroundService();
      }
    } catch (error) {
      console.error('❌ Keep-alive operation failed:', error);
    }
  }

  private performBackgroundTask(): void {
    // Perform background tasks to keep the app active
    try {
      console.log('🔄 Background task completed');
      // Add any background processing here
    } catch (error) {
      console.error('❌ Background task failed:', error);
    }
  }

  private tryStartForegroundService(): void {
    // Try to start the KeepAliveService
    try {
      if (Platform.OS === 'android' && NativeModules.KeepAliveModule) {
        NativeModules.KeepAliveModule.startService();
      }
    } catch (error) {
      // Service might not be available, that's okay
      console.log('Foreground service not available:', error);
    }
  }

  public getBackgroundDuration(): number {
    if (this.isInBackground) {
      return Date.now() - this.backgroundTime;
    }
    return 0;
  }

  public isAppInBackground(): boolean {
    return this.isInBackground;
  }

  public destroy(): void {
    console.log('🗑️ Destroying Enhanced App Lifecycle Manager...');
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    
    if (this.backgroundTaskInterval) {
      clearInterval(this.backgroundTaskInterval);
      this.backgroundTaskInterval = null;
    }
  }
}

export default AppLifecycleManager.getInstance();
