import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import CommonHeader from '../components/CommonHeader';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import { getClientConfig } from '../config/client-config';

const UsageDetailsScreen = ({ navigation }: any) => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async () => {
    try {
      setIsLoading(true);
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) {
        throw new Error('No user session found');
      }
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      const result = await apiService.usageRecords(
        session.username,
        'active',
        fromDate,
        toDate,
        realm
      );
      if (result) {
        const data = {
          total: `${(result.download + result.upload).toFixed(2)} GB`,
          download: `${result.download.toFixed(2)} GB`,
          upload: `${result.upload.toFixed(2)} GB`,
          hours: result.hrsUsed,
          percentage: 75
        };
        setUsageData(data);
      }
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to fetch data');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader navigation={navigation} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Usage Details</Text>
          <Text style={styles.subtitle}>Monitor your data consumption</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Select Date Range</Text>
          <Text style={styles.cardSubtitle}>Choose the period to fetch usage statistics</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{formatDate(fromDate)}</Text>
            </TouchableOpacity>
            <View style={styles.dateDivider} />
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatDate(toDate)}</Text>
            </TouchableOpacity>
          </View>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={toDate}
              onChange={(event: any, date?: Date) => {
                setShowFromPicker(false);
                if (date) setFromDate(date);
              }}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={fromDate}
              maximumDate={new Date()}
              onChange={(event: any, date?: Date) => {
                setShowToPicker(false);
                if (date) setToDate(date);
              }}
            />
          )}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleFetch}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '⏳ Loading...' : '📊 Fetch Usage'}
            </Text>
          </TouchableOpacity>
        </View>
        {usageData && (
          <View style={styles.dataCard}>
            <Text style={styles.dataTitle}>📈 Usage Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statArrowIcon}>↓</Text>
                <Text style={styles.statLabel}>Download</Text>
                <Text style={styles.statValue}>{usageData.download}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statArrowIcon}>↑</Text>
                <Text style={styles.statLabel}>Upload</Text>
                <Text style={styles.statValue}>{usageData.upload}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>{usageData.total}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⏰</Text>
                <Text style={styles.statLabel}>Hours</Text>
                <Text style={styles.statValue}>{usageData.hours} h</Text>
              </View>
            </View>
            {/* <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Usage Progress</Text>
                <Text style={styles.progressPercentage}>{usageData.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${usageData.percentage}%` }]} />
              </View>
            </View> */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  dateLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  dateDivider: {
    width: 12,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statArrowIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
});

export default UsageDetailsScreen; 