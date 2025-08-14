import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { getClientConfig } from '../config/client-config';
import CommonHeader from '../components/CommonHeader';

const AboutScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  // Get client configuration dynamically
  const clientConfig = getClientConfig();
  const aboutData = clientConfig.about;

  const renderSection = (title: string, content: string | string[], icon: string) => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      
      {Array.isArray(content) ? (
        <View style={styles.listContainer}>
          {content.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={[styles.listText, { color: colors.textSecondary }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
          {content}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroTitle}>
            {aboutData.companyName}
          </Text>
          <Text style={styles.heroSubtitle}>
            Established in {aboutData.establishedYear}
          </Text>
        </View>

        {/* Company Description */}
        <View style={styles.contentContainer}>
          {renderSection(
            'About Us',
            aboutData.description,
            '🏢'
          )}

          {/* Specializations */}
          {renderSection(
            'Our Specializations',
            aboutData.specializations,
            '⚡'
          )}

          {/* Service Areas */}
          {renderSection(
            'Service Areas',
            aboutData.serviceAreas,
            '🌍'
          )}

          {/* Achievements */}
          {renderSection(
            'Key Achievements',
            aboutData.achievements,
            '🏆'
          )}

          {/* Contact Information */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📞</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Contact Information
              </Text>
            </View>
            
            <View style={styles.contactInfo}>
              {clientConfig.contact.tollFree && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Toll Free:</Text>
                  <Text style={[styles.contactValue, { color: colors.primary }]}>
                    {clientConfig.contact.tollFree}
                  </Text>
                </View>
              )}
              
              {clientConfig.contact.landline && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Landline:</Text>
                  <Text style={[styles.contactValue, { color: colors.primary }]}>
                    {clientConfig.contact.landline}
                  </Text>
                </View>
              )}
              
              {clientConfig.contact.emails?.inquiries && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Email:</Text>
                  <Text style={[styles.contactValue, { color: colors.primary }]}>
                    {clientConfig.contact.emails.inquiries}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Head Office */}
          {clientConfig.contact.headOffice && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📍</Text>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {clientConfig.contact.headOffice.title}
                </Text>
              </View>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {clientConfig.contact.headOffice.address}
              </Text>
            </View>
          )}

          {/* Branch Offices */}
          {clientConfig.contact.branchOffices && clientConfig.contact.branchOffices.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🏢</Text>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Branch Offices
                </Text>
              </View>
              
              {clientConfig.contact.branchOffices.map((office, index) => (
                <View key={index} style={styles.branchOffice}>
                  <Text style={[styles.branchTitle, { color: colors.text }]}>
                    {office.title}
                  </Text>
                  <Text style={[styles.branchAddress, { color: colors.textSecondary }]}>
                    {office.address}
                  </Text>
                  {office.corporateLandline && (
                    <Text style={[styles.branchPhone, { color: colors.primary }]}>
                      📞 {office.corporateLandline}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Call to Action */}
          <View style={[styles.ctaSection, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaTitle}>
              Ready to Get Started?
            </Text>
            <Text style={styles.ctaSubtitle}>
              Experience the best internet service with {aboutData.companyName}
            </Text>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: colors.background }]}
              onPress={() => navigation.navigate('ContactUs')}
            >
              <Text style={[styles.ctaButtonText, { color: colors.primary }]}>
                Contact Us Today
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 12,
    marginTop: 2,
  },
  listText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  branchOffice: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  branchTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  branchPhone: {
    fontSize: 14,
    fontWeight: '500',
  },
  ctaSection: {
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AboutScreen;
