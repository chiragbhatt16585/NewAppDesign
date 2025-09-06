import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { getClientConfig } from '../config/client-config';
import CommonHeader from '../components/CommonHeader';

const AboutScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const fetchAboutUs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clientConfig = getClientConfig();
      const baseUrl = clientConfig.api.baseURL;
      
      // Handle both cases: with and without https:// prefix
      let domain;
      if (baseUrl.startsWith('https://')) {
        // If baseURL already has https://, extract domain and remove /l2s/api
        domain = baseUrl.replace('https://', '').split('/')[0];
      } else {
        // If baseURL doesn't have https://, extract domain and remove /l2s/api
        domain = baseUrl.split('/')[0];
      }
      
      const url = `https://${domain}/tmp/aboutus.html`;
      
      console.log('Fetching About Us from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      setHtmlContent(html);
      console.log('About Us loaded successfully');
    } catch (err) {
      console.error('Error fetching About Us:', err);
      setError('Failed to load About Us. Please try again later.');
      
      // Show fallback content
      setHtmlContent(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 20px; 
                line-height: 1.6; 
                color: #333;
              }
              h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              h2 { color: #34495e; margin-top: 30px; }
              p { margin-bottom: 15px; }
              .error { color: #e74c3c; background: #fdf2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c; }
            </style>
          </head>
          <body>
            <h1>About Us</h1>
            <div class="error">
              <h2>⚠️ Content Unavailable</h2>
              <p>We're unable to load the About Us information at the moment. This could be due to:</p>
              <ul>
                <li>Network connectivity issues</li>
                <li>Server maintenance</li>
                <li>Temporary service disruption</li>
              </ul>
              <p>Please try again later or contact our support team for assistance.</p>
            </div>
          </body>
        </html>
      `);
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    fetchAboutUs();
  };

  if (loading && !htmlContent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CommonHeader navigation={navigation} />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading About Us...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error || '#e74c3c' }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={retryFetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.webViewLoadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading...
            </Text>
          </View>
        )}
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setError('Failed to display About Us. Please try again.');
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webViewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default AboutScreen;
