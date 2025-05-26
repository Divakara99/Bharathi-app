import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DeliveryTier {
  maxDistance: number;
  minOrderValue: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
}

interface CompanyProfile {
  companyName: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  phone: string;
  email: string;
  gstNumber: string;
  deliveryRadius: number; // in km
  baseDeliveryTime: number; // in minutes
  timePerKm: number; // additional minutes per km
  deliveryTiers: DeliveryTier[];
  globalFreeDeliveryAbove: number;
  operatingHours: {
    start: string;
    end: string;
  };
  isDeliveryEnabled: boolean;
}

export default function AdminSettingsScreen() {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: 'Bharathi Enterprises',
    storeAddress: 'Koramangala, Bangalore, Karnataka 560034',
    storeLatitude: 12.9716,
    storeLongitude: 77.5946,
    phone: '+91 98765 43210',
    email: 'admin@bharathienterprises.com',
    gstNumber: '29ABCDE1234F1Z5',
    deliveryRadius: 15,
    baseDeliveryTime: 15,
    timePerKm: 5,
    deliveryTiers: [
      {
        maxDistance: 5,
        minOrderValue: 200,
        deliveryCharge: 30,
        freeDeliveryAbove: 200,
      },
      {
        maxDistance: 10,
        minOrderValue: 500,
        deliveryCharge: 50,
        freeDeliveryAbove: 500,
      },
      {
        maxDistance: 15,
        minOrderValue: 0,
        deliveryCharge: 50,
        freeDeliveryAbove: Infinity,
      },
    ],
    globalFreeDeliveryAbove: 2000,
    operatingHours: {
      start: '09:00',
      end: '21:00',
    },
    isDeliveryEnabled: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('companyProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  const saveCompanyProfile = async () => {
    try {
      setLoading(true);
      await AsyncStorage.setItem('companyProfile', JSON.stringify(profile));
      
      // Update store location in location service
      const locationServiceData = {
        latitude: profile.storeLatitude,
        longitude: profile.storeLongitude,
        address: profile.storeAddress,
      };
      await AsyncStorage.setItem('storeLocation', JSON.stringify(locationServiceData));
      
      setIsEditing(false);
      Alert.alert('Success', 'Company profile updated successfully!');
    } catch (error) {
      console.error('Error saving company profile:', error);
      Alert.alert('Error', 'Failed to save company profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressLookup = () => {
    Alert.alert(
      'Address Lookup',
      'This feature would integrate with Google Maps API to get coordinates from address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Manual Entry', 
          onPress: () => {
            Alert.prompt(
              'Enter Latitude',
              'Enter store latitude:',
              (lat) => {
                if (lat) {
                  Alert.prompt(
                    'Enter Longitude',
                    'Enter store longitude:',
                    (lng) => {
                      if (lng) {
                        setProfile(prev => ({
                          ...prev,
                          storeLatitude: parseFloat(lat),
                          storeLongitude: parseFloat(lng),
                        }));
                      }
                    }
                  );
                }
              }
            );
          }
        }
      ]
    );
  };

  const calculateEstimatedDeliveryTime = (customerAddress: string): number => {
    // This is a simplified calculation
    // In a real app, you'd use Google Maps Distance Matrix API
    const baseTime = profile.baseDeliveryTime;
    const estimatedDistance = Math.random() * profile.deliveryRadius; // Simulated distance
    const additionalTime = estimatedDistance * profile.timePerKm;
    
    return Math.round(baseTime + additionalTime);
  };

  const testDeliveryCalculation = () => {
    const testAddresses = [
      'Indiranagar, Bangalore',
      'BTM Layout, Bangalore',
      'HSR Layout, Bangalore',
      'Whitefield, Bangalore',
    ];

    const results = testAddresses.map(address => ({
      address,
      estimatedTime: calculateEstimatedDeliveryTime(address),
    }));

    const resultText = results
      .map(r => `${r.address}: ${r.estimatedTime} mins`)
      .join('\n');

    Alert.alert('Delivery Time Test', resultText);
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
          <Text style={styles.headerTitle}>Company Settings</Text>
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Ionicons 
              name={isEditing ? "close" : "create"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.companyName}
              onChangeText={(text) => setProfile(prev => ({ ...prev, companyName: text }))}
              editable={isEditing}
              placeholder="Enter company name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.phone}
              onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
              editable={isEditing}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.email}
              onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
              editable={isEditing}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GST Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.gstNumber}
              onChangeText={(text) => setProfile(prev => ({ ...prev, gstNumber: text }))}
              editable={isEditing}
              placeholder="Enter GST number"
            />
          </View>
        </View>

        {/* Store Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Store Location</Text>
            {isEditing && (
              <TouchableOpacity 
                onPress={handleAddressLookup}
                style={styles.lookupButton}
              >
                <Ionicons name="location" size={16} color="#dc2626" />
                <Text style={styles.lookupText}>Lookup</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, !isEditing && styles.disabledInput]}
              value={profile.storeAddress}
              onChangeText={(text) => setProfile(prev => ({ ...prev, storeAddress: text }))}
              editable={isEditing}
              placeholder="Enter complete store address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profile.storeLatitude.toString()}
                onChangeText={(text) => setProfile(prev => ({ 
                  ...prev, 
                  storeLatitude: parseFloat(text) || 0 
                }))}
                editable={isEditing}
                placeholder="Latitude"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profile.storeLongitude.toString()}
                onChangeText={(text) => setProfile(prev => ({ 
                  ...prev, 
                  storeLongitude: parseFloat(text) || 0 
                }))}
                editable={isEditing}
                placeholder="Longitude"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Delivery Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Settings</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable Delivery Service</Text>
            <Switch
              value={profile.isDeliveryEnabled}
              onValueChange={(value) => setProfile(prev => ({ ...prev, isDeliveryEnabled: value }))}
              disabled={!isEditing}
              trackColor={{ false: '#d1d5db', true: '#dc2626' }}
              thumbColor={profile.isDeliveryEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Radius (km)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.deliveryRadius.toString()}
              onChangeText={(text) => setProfile(prev => ({ 
                ...prev, 
                deliveryRadius: parseInt(text) || 0 
              }))}
              editable={isEditing}
              placeholder="Maximum delivery distance"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Base Delivery Time (minutes)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.baseDeliveryTime.toString()}
              onChangeText={(text) => setProfile(prev => ({ 
                ...prev, 
                baseDeliveryTime: parseInt(text) || 0 
              }))}
              editable={isEditing}
              placeholder="Minimum delivery time"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Time per KM (minutes)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.timePerKm.toString()}
              onChangeText={(text) => setProfile(prev => ({ 
                ...prev, 
                timePerKm: parseInt(text) || 0 
              }))}
              editable={isEditing}
              placeholder="Extra time per kilometer"
              keyboardType="numeric"
            />
          </View>

                        <View style={styles.deliveryActions}>
                <TouchableOpacity 
                  style={styles.testButton}
                  onPress={testDeliveryCalculation}
                >
                  <Ionicons name="calculator" size={16} color="white" />
                  <Text style={styles.testButtonText}>Test Delivery Calculation</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.zonesButton}
                  onPress={() => router.push('/(admin)/delivery-zones')}
                >
                  <Ionicons name="map" size={16} color="white" />
                  <Text style={styles.zonesButtonText}>View Delivery Zones</Text>
                </TouchableOpacity>
              </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Opening Time</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profile.operatingHours.start}
                onChangeText={(text) => setProfile(prev => ({ 
                  ...prev, 
                  operatingHours: { ...prev.operatingHours, start: text }
                }))}
                editable={isEditing}
                placeholder="09:00"
              />
            </View>
            
            <View style={styles.timeInput}>
              <Text style={styles.label}>Closing Time</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={profile.operatingHours.end}
                onChangeText={(text) => setProfile(prev => ({ 
                  ...prev, 
                  operatingHours: { ...prev.operatingHours, end: text }
                }))}
                editable={isEditing}
                placeholder="21:00"
              />
            </View>
          </View>
        </View>

        {/* Delivery Pricing Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Pricing Tiers</Text>
          
          {profile.deliveryTiers.map((tier, index) => (
            <View key={index} style={styles.tierContainer}>
              <Text style={styles.tierTitle}>
                Zone {index + 1}: 0-{tier.maxDistance}km
              </Text>
              
              <View style={styles.tierRow}>
                <View style={styles.tierInput}>
                  <Text style={styles.label}>Max Distance (km)</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.disabledInput]}
                    value={tier.maxDistance.toString()}
                    onChangeText={(text) => {
                      const newTiers = [...profile.deliveryTiers];
                      newTiers[index].maxDistance = parseInt(text) || 0;
                      setProfile(prev => ({ ...prev, deliveryTiers: newTiers }));
                    }}
                    editable={isEditing}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.tierInput}>
                  <Text style={styles.label}>Min Order (₹)</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.disabledInput]}
                    value={tier.minOrderValue.toString()}
                    onChangeText={(text) => {
                      const newTiers = [...profile.deliveryTiers];
                      newTiers[index].minOrderValue = parseInt(text) || 0;
                      setProfile(prev => ({ ...prev, deliveryTiers: newTiers }));
                    }}
                    editable={isEditing}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.tierRow}>
                <View style={styles.tierInput}>
                  <Text style={styles.label}>Delivery Charge (₹)</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.disabledInput]}
                    value={tier.deliveryCharge.toString()}
                    onChangeText={(text) => {
                      const newTiers = [...profile.deliveryTiers];
                      newTiers[index].deliveryCharge = parseInt(text) || 0;
                      setProfile(prev => ({ ...prev, deliveryTiers: newTiers }));
                    }}
                    editable={isEditing}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.tierInput}>
                  <Text style={styles.label}>Free Above (₹)</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.disabledInput]}
                    value={tier.freeDeliveryAbove === Infinity ? '∞' : tier.freeDeliveryAbove.toString()}
                    onChangeText={(text) => {
                      const newTiers = [...profile.deliveryTiers];
                      newTiers[index].freeDeliveryAbove = text === '∞' ? Infinity : parseInt(text) || 0;
                      setProfile(prev => ({ ...prev, deliveryTiers: newTiers }));
                    }}
                    editable={isEditing}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          ))}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Global Free Delivery Above (₹)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.globalFreeDeliveryAbove.toString()}
              onChangeText={(text) => setProfile(prev => ({ 
                ...prev, 
                globalFreeDeliveryAbove: parseInt(text) || 0 
              }))}
              editable={isEditing}
              placeholder="Free delivery for all distances above this amount"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Orders above this amount get free delivery regardless of distance
            </Text>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={saveCompanyProfile}
            disabled={loading}
          >
            <LinearGradient 
              colors={['#dc2626', '#ef4444']} 
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  lookupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lookupText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deliveryActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  zonesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  zonesButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tierContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tierInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 