import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function AdminAnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="bar-chart" size={28} color="white" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Analytics Dashboard</Text>
              <Text style={styles.headerSubtitle}>Business insights</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="trending-up" size={32} color="#10b981" />
            <Text style={styles.metricValue}>₹1,25,000</Text>
            <Text style={styles.metricLabel}>Monthly Revenue</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Ionicons name="people" size={32} color="#3b82f6" />
            <Text style={styles.metricValue}>2,450</Text>
            <Text style={styles.metricLabel}>Total Customers</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Ionicons name="bag" size={32} color="#f59e0b" />
            <Text style={styles.metricValue}>1,890</Text>
            <Text style={styles.metricLabel}>Orders Completed</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Ionicons name="star" size={32} color="#8b5cf6" />
            <Text style={styles.metricValue}>4.8</Text>
            <Text style={styles.metricLabel}>Average Rating</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>📊 Analytics coming soon...</Text>
        <Text style={styles.description}>
          Detailed charts and reports will be available in the next update.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 