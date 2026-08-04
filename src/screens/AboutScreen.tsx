import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { getClientConfig } from '../config/client-config';
import CommonHeader from '../components/CommonHeader';
import { apiService } from '../services/api';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Build About Company HTML from client-config static content. */
const buildStaticAboutHtml = (isDark: boolean): string => {
  const about = getClientConfig().about;
  const companyName = escapeHtml(about?.companyName || 'About Us');
  const established = about?.establishedYear
    ? `Established ${escapeHtml(about.establishedYear)}`
    : '';
  const descriptionParagraphs = (about?.description || '')
    .split(/\n+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `<p>${escapeHtml(part)}</p>`)
    .join('');
  const specializations = (about?.specializations || [])
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const serviceAreas = (about?.serviceAreas || [])
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const achievements = (about?.achievements || [])
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');

  const textColor = isDark ? '#F5F5F5' : '#333';
  const headingColor = isDark ? '#FFFFFF' : '#2c3e50';
  const subHeadingColor = isDark ? '#E0E0E0' : '#34495e';
  const metaColor = isDark ? '#B0B0B0' : '#666';
  const borderColor = isDark ? '#4A90E2' : '#3498db';
  const bgColor = isDark ? '#121212' : '#FFFFFF';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 20px;
        line-height: 1.6;
        color: ${textColor};
        background: ${bgColor};
      }
      h1 { color: ${headingColor}; border-bottom: 2px solid ${borderColor}; padding-bottom: 10px; }
      h2 { color: ${subHeadingColor}; margin-top: 24px; font-size: 18px; }
      p { margin-bottom: 15px; }
      ul { padding-left: 20px; }
      .meta { color: ${metaColor}; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>${companyName}</h1>
    ${established ? `<p class="meta">${established}</p>` : ''}
    ${descriptionParagraphs}
    ${specializations ? `<h2>What we offer</h2><ul>${specializations}</ul>` : ''}
    ${serviceAreas ? `<h2>Service areas</h2><ul>${serviceAreas}</ul>` : ''}
    ${achievements ? `<h2>Highlights</h2><ul>${achievements}</ul>` : ''}
  </body>
</html>`;
};

/** True when CRM returned a usable About HTML page (not an L2S error payload). */
const isValidAboutHtml = (text: string): boolean => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  // L2S / CRM error payloads
  if (
    lower.includes('resource not allocated') ||
    lower.includes('token expired') ||
    lower.includes('"status":"error"') ||
    lower.includes('"status": "error"')
  ) {
    return false;
  }

  // JSON error objects returned with HTTP 200
  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed);
      if (json?.status === 'error' || json?.code || json?.message) {
        return false;
      }
    } catch {
      // not JSON — continue
    }
  }

  // Prefer real HTML; reject bare error strings
  if (!lower.includes('<html') && !lower.includes('<body') && !lower.includes('<p') && !lower.includes('<div')) {
    return false;
  }

  return true;
};

const AboutScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const showStaticAbout = useCallback(() => {
    setHtmlContent(buildStaticAboutHtml(isDark));
    setUsingFallback(true);
  }, [isDark]);

  const fetchAboutUs = useCallback(async () => {
    try {
      setLoading(true);
      setUsingFallback(false);

      const clientConfig = getClientConfig();
      const baseUrl = clientConfig.api.baseURL;

      let domain: string;
      if (baseUrl.startsWith('https://')) {
        domain = baseUrl.replace('https://', '').split('/')[0];
      } else {
        domain = baseUrl.split('/')[0];
      }

      const url = `https://${domain}/tmp/aboutus.html`;

      const html = await apiService.makeAuthenticatedRequest(async (token) => {
        const response = await fetch(url, {
          headers: new Headers({
            Authentication: token || '',
            'cache-control': 'no-cache',
            referer: 'L2S-System/User-App-Requests',
          }),
        });

        const text = await response.text();
        const lower = text.toLowerCase();

        if (!response.ok) {
          if (lower.includes('token') && (lower.includes('expired') || lower.includes('error'))) {
            throw new Error('Token Expired');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Server may return 200 with token-expired JSON — retry via makeAuthenticatedRequest
        if (lower.includes('token') && (lower.includes('expired') || lower.includes('error'))) {
          throw new Error('Token Expired');
        }

        return text;
      });

      if (isValidAboutHtml(html)) {
        setHtmlContent(html);
        setUsingFallback(false);
      } else {
        // Missing /tmp/aboutus.html → "Resource not allocated", etc.
        console.warn('[AboutScreen] Remote about HTML invalid/missing — using client-config content');
        showStaticAbout();
      }
    } catch (err: any) {
      console.warn('[AboutScreen] Failed to fetch remote about HTML — using client-config content:', err?.message || err);
      showStaticAbout();
    } finally {
      setLoading(false);
    }
  }, [showStaticAbout]);

  useEffect(() => {
    fetchAboutUs();
  }, [fetchAboutUs]);

  // Rebuild static HTML if theme changes while on fallback
  useEffect(() => {
    if (usingFallback) {
      setHtmlContent(buildStaticAboutHtml(isDark));
    }
  }, [isDark, usingFallback]);

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

      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.webViewLoadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <WebView
          source={{ html: htmlContent, baseUrl: '' }}
          style={[styles.webview, { backgroundColor: colors.background }]}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          originWhitelist={['*']}
          onError={(syntheticEvent) => {
            console.error('WebView error:', syntheticEvent.nativeEvent);
            showStaticAbout();
            setLoading(false);
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
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default AboutScreen;
