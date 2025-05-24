import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

interface TrackingStatus {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  time?: string;
}

export default function TrackOrderScreen() {
  const [currentStatus, setCurrentStatus] = useState('on_the_way');
  const [estimatedTime, setEstimatedTime] = useState(12);
  
  const trackingStatuses: TrackingStatus[] = [
    {
      id: 'confirmed',
      title: 'Order Confirmed',
      description: 'Your order has been placed successfully',
      completed: true,
      active: false,
      time: '2:45 PM'
    },
    {
      id: 'preparing',
      title: 'Preparing Order',
      description: 'Your items are being packed carefully',
      completed: true,
      active: false,
      time: '2:50 PM'
    },
    {
      id: 'on_the_way',
      title: 'On the Way',
      description: 'Delivery partner is heading to your location',
      completed: false,
      active: true,
    },
    {
      id: 'nearby',
      title: 'Nearby',
      description: 'Delivery partner is near your location',
      completed: false,
      active: false,
    },
    {
      id: 'delivered',
      title: 'Delivered',
      description: 'Your order has been delivered successfully',
      completed: false,
      active: false,
    }
  ];

  const deliveryPartner = {
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    vehicle: 'Motorcycle',
    rating: 4.8,
    totalDeliveries: 1250
  };

  useEffect(() => {
    // Simulate real-time updates
    const timer = setInterval(() => {
      setEstimatedTime(prev => prev > 0 ? prev - 1 : 0);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const callDeliveryPartner = () => {
    // In a real app, this would initiate a phone call
    console.log('Calling delivery partner...');
  };

  const renderMapPlaceholder = () => (
    <View style={styles.mapContainer}>
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe']}
        style={styles.mapPlaceholder}
      >
        <Ionicons name="location" size={40} color="#7c3aed" />
        <Text style={styles.mapText}>Live Map View</Text>
        <Text style={styles.mapSubtext}>Tracking delivery partner location</Text>
        
        {/* Delivery partner marker */}
        <View style={styles.deliveryMarker}>
          <Ionicons name="bicycle" size={20} color="white" />
        </View>
        
        {/* Customer location marker */}
        <View style={styles.customerMarker}>
          <Ionicons name="home" size={16} color="white" />
        </View>
        
        {/* Route line simulation */}
        <View style={styles.routeLine} />
      </LinearGradient>
    </View>
  );

  const renderStatusItem = (status: TrackingStatus) => (
    <View key={status.id} style={styles.statusItem}>
      <View style={styles.statusIndicator}>
        <View style={[
          styles.statusDot,
          status.completed && styles.completedDot,
          status.active && styles.activeDot
        ]}>
          {status.completed && (
            <Ionicons name="checkmark" size={12} color="white" />
          )}
          {status.active && (
            <View style={styles.pulseDot} />
          )}
        </View>
        {status.id !== 'delivered' && (
          <View style={[
            styles.statusLine,
            status.completed && styles.completedLine
          ]} />
        )}
      </View>
      
      <View style={styles.statusContent}>
        <Text style={[
          styles.statusTitle,
          status.active && styles.activeStatusTitle
        ]}>
          {status.title}
        </Text>
        <Text style={styles.statusDescription}>{status.description}</Text>
        {status.time && (
          <Text style={styles.statusTime}>{status.time}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Estimated Time Card */}
        <View style={styles.timeCard}>
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            style={styles.timeGradient}
          >
            <View style={styles.timeContent}>
              <Ionicons name="time" size={24} color="white" />
              <Text style={styles.timeText}>Estimated Delivery</Text>
              <Text style={styles.timeValue}>{estimatedTime} mins</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Map View */}
        {renderMapPlaceholder()}

        {/* Delivery Partner Info */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerHeader}>
            <View style={styles.partnerAvatar}>
              <Ionicons name="person" size={24} color="#7c3aed" />
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{deliveryPartner.name}</Text>
              <View style={styles.partnerMeta}>
                <Ionicons name="star" size={14} color="#fbbf24" />
                <Text style={styles.partnerRating}>{deliveryPartner.rating}</Text>
                <Text style={styles.partnerDeliveries}>
                  • {deliveryPartner.totalDeliveries} deliveries
                </Text>
              </View>
              <Text style={styles.partnerVehicle}>
                <Ionicons name="bicycle" size={14} color="#6b7280" />
                {' '}{deliveryPartner.vehicle}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={callDeliveryPartner}
            >
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Status Timeline */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.statusTimeline}>
            {trackingStatuses.map(renderStatusItem)}
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.orderSection}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.orderCard}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Order ID</Text>
              <Text style={styles.orderValue}>#BH2024001</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Items</Text>
              <Text style={styles.orderValue}>6 items</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Total Amount</Text>
              <Text style={styles.orderValue}>₹234</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Delivery Address</Text>
              <Text style={styles.orderValue}>Koramangala, Bangalore</Text>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    width: 24,
  },
  timeCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  timeGradient: {
    padding: 20,
  },
  timeContent: {
    alignItems: 'center',
  },
  timeText: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },
  timeValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  deliveryMarker: {
    position: 'absolute',
    top: 60,
    right: 80,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customerMarker: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  routeLine: {
    position: 'absolute',
    top: 80,
    right: 100,
    width: 120,
    height: 2,
    backgroundColor: '#7c3aed',
    transform: [{ rotate: '45deg' }],
  },
  partnerCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  partnerRating: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 4,
  },
  partnerDeliveries: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  partnerVehicle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  orderSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  statusTimeline: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  completedDot: {
    backgroundColor: '#10b981',
  },
  activeDot: {
    backgroundColor: '#7c3aed',
  },
  pulseDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    opacity: 0.3,
    position: 'absolute',
  },
  statusLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  completedLine: {
    backgroundColor: '#10b981',
  },
  statusContent: {
    flex: 1,
    paddingBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  activeStatusTitle: {
    color: '#7c3aed',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
}); 