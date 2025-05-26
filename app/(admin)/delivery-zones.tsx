import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { deliveryTimeService } from '../../services/deliveryTimeService';

interface DeliveryZone {
  name: string;
  distance: string;
  estimatedTime: string;
  areas: string[];
  pricing?: {
    minOrder: string;
    deliveryCharge: string;
    freeDelivery: string;
  };
}

interface DeliveryZoneData {
  totalRadius: number;
  zones: DeliveryZone[];
}

export default function DeliveryZonesScreen() {
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    loadDeliveryZones();
  }, []);

  const loadDeliveryZones = async () => {
    try {
      setLoading(true);
      const zones = await deliveryTimeService.getDeliveryZones();
      setDeliveryZones(zones);
    } catch (error) {
      console.error('Error loading delivery zones:', error);
      Alert.alert('Error', 'Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  const testDeliveryCalculations = async () => {
    try {
      const testAddresses = [
        'Koramangala, Bangalore',
        'Indiranagar, Bangalore',
        'BTM Layout, Bangalore',
        'HSR Layout, Bangalore',
        'Whitefield, Bangalore',
        'Electronic City, Bangalore',
        'Marathahalli, Bangalore',
        'JP Nagar, Bangalore',
        'Jayanagar, Bangalore',
        'Rajajinagar, Bangalore',
      ];

      const results = await deliveryTimeService.calculateMultipleDeliveryTimes(testAddresses);
      setTestResults(results);
      
      Alert.alert(
        'Test Results',
        `Tested ${results.length} addresses. Check the results below.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to test delivery calculations');
    }
  };

  const getZoneColor = (index: number) => {
    const colors = ['#10b981', '#f59e0b', '#ef4444'];
    return colors[index] || '#6b7280';
  };

  const getZoneIcon = (index: number) => {
    const icons = ['flash', 'bicycle', 'car'];
    return icons[index] || 'location';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Zones</Text>
          <TouchableOpacity onPress={testDeliveryCalculations}>
            <Ionicons name="flask" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading delivery zones...</Text>
          </View>
        ) : deliveryZones ? (
          <>
            {/* Overview */}
            <View style={styles.overviewSection}>
              <Text style={styles.sectionTitle}>Delivery Coverage</Text>
              <View style={styles.overviewCard}>
                <View style={styles.overviewItem}>
                  <Ionicons name="location" size={24} color="#dc2626" />
                  <Text style={styles.overviewLabel}>Total Radius</Text>
                  <Text style={styles.overviewValue}>{deliveryZones.totalRadius} km</Text>
                </View>
                <View style={styles.overviewItem}>
                  <Ionicons name="map" size={24} color="#dc2626" />
                  <Text style={styles.overviewLabel}>Delivery Zones</Text>
                  <Text style={styles.overviewValue}>{deliveryZones.zones.length}</Text>
                </View>
                <View style={styles.overviewItem}>
                  <Ionicons name="business" size={24} color="#dc2626" />
                  <Text style={styles.overviewLabel}>Coverage Areas</Text>
                  <Text style={styles.overviewValue}>
                    {deliveryZones.zones.reduce((total, zone) => total + zone.areas.length, 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Zones */}
            <View style={styles.zonesSection}>
              <Text style={styles.sectionTitle}>Delivery Zones</Text>
              {deliveryZones.zones.map((zone, index) => (
                <View key={index} style={styles.zoneCard}>
                  <View style={styles.zoneHeader}>
                    <View style={styles.zoneIconContainer}>
                      <Ionicons 
                        name={getZoneIcon(index) as any} 
                        size={20} 
                        color={getZoneColor(index)} 
                      />
                    </View>
                    <View style={styles.zoneInfo}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <Text style={styles.zoneDistance}>{zone.distance}</Text>
                    </View>
                    <View style={styles.zoneTime}>
                      <Text style={styles.zoneTimeText}>{zone.estimatedTime}</Text>
                    </View>
                  </View>
                  
                  {zone.pricing && (
                    <View style={styles.zonePricing}>
                      <Text style={styles.pricingLabel}>Pricing:</Text>
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingText}>Min Order: {zone.pricing.minOrder}</Text>
                        <Text style={styles.pricingText}>Charge: {zone.pricing.deliveryCharge}</Text>
                        <Text style={styles.pricingText}>Free: {zone.pricing.freeDelivery}</Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.zoneAreas}>
                    <Text style={styles.areasLabel}>Coverage Areas:</Text>
                    <View style={styles.areasList}>
                      {zone.areas.map((area, areaIndex) => (
                        <View key={areaIndex} style={styles.areaChip}>
                          <Text style={styles.areaText}>{area}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Test Results */}
            {testResults.length > 0 && (
              <View style={styles.testSection}>
                <Text style={styles.sectionTitle}>Test Results</Text>
                {testResults.map((result, index) => (
                  <View key={index} style={styles.testResultCard}>
                    <View style={styles.testResultHeader}>
                      <Text style={styles.testAddress}>{result.address}</Text>
                      {result.result ? (
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      ) : (
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      )}
                    </View>
                    
                    {result.result ? (
                      <View style={styles.testResultDetails}>
                        <Text style={styles.testResultText}>
                          Time: {result.result.estimatedTime} mins
                        </Text>
                        <Text style={styles.testResultText}>
                          Distance: {result.result.distance.toFixed(1)} km
                        </Text>
                        <Text style={styles.testResultText}>
                          Charges: ₹{result.result.deliveryCharges}
                          {result.result.isFreeDelivery && ' (FREE)'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.testErrorText}>{result.error}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsSection}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(admin)/settings')}
              >
                <LinearGradient 
                  colors={['#7c3aed', '#8b5cf6']} 
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="settings" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Update Delivery Settings</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={testDeliveryCalculations}
              >
                <LinearGradient 
                  colors={['#059669', '#10b981']} 
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="flask" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Test Delivery Calculations</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#ef4444" />
            <Text style={styles.errorText}>Failed to load delivery zones</Text>
            <TouchableOpacity onPress={loadDeliveryZones} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewItem: {
    alignItems: 'center',
    gap: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  zonesSection: {
    marginBottom: 24,
  },
  zoneCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  zoneIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  zoneDistance: {
    fontSize: 14,
    color: '#6b7280',
  },
  zoneTime: {
    alignItems: 'flex-end',
  },
  zoneTimeText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  zoneAreas: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  areasLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  areasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  areaText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  testSection: {
    marginBottom: 24,
  },
  testResultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  testResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  testResultDetails: {
    gap: 4,
  },
  testResultText: {
    fontSize: 12,
    color: '#6b7280',
  },
  testErrorText: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  zonePricing: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pricingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  pricingText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
}); 