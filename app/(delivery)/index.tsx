import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { locationService, STORE_LOCATION, MAX_DELIVERY_RADIUS } from '../../services/locationService';

interface DeliveryOrder {
  id: string;
  customerName: string;
  address: string;
  items: number;
  amount: number;
  status: 'new' | 'assigned' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered' | 'rejected';
  distance: string;
  estimatedTime: number;
  estimatedEarning: number;
  isNew?: boolean;
}

export default function DeliveryDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [todayStats, setTodayStats] = useState({
    earnings: 850,
    deliveries: 12,
    avgEarning: 71,
    hoursWorked: 8,
  });

  // Location tracking state
  const [locationStatus, setLocationStatus] = useState({
    isTracking: false,
    distanceFromStore: 0,
    isEligibleForOrders: false,
    lastUpdate: null as Date | null,
  });

  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([
    {
      id: 'BH2024005',
      customerName: 'Ravi Kumar',
      address: 'Whitefield, Bangalore',
      items: 4,
      amount: 180,
      status: 'new',
      distance: '1.8 km',
      estimatedTime: 15,
      estimatedEarning: 35,
      isNew: true,
    },
    {
      id: 'BH2024006',
      customerName: 'Meera Patel',
      address: 'Electronic City, Bangalore',
      items: 7,
      amount: 320,
      status: 'new',
      distance: '2.7 km',
      estimatedTime: 20,
      estimatedEarning: 50,
      isNew: true,
    },
  ]);

  const [acceptedOrders, setAcceptedOrders] = useState<DeliveryOrder[]>([
    {
      id: 'BH2024001',
      customerName: 'Priya Sharma',
      address: 'Koramangala, Bangalore',
      items: 6,
      amount: 234,
      status: 'accepted',
      distance: '2.1 km',
      estimatedTime: 12,
      estimatedEarning: 45,
    },
    {
      id: 'BH2024004',
      customerName: 'Amit Patel',
      address: 'Indiranagar, Bangalore',
      items: 3,
      amount: 156,
      status: 'picked_up',
      distance: '3.5 km',
      estimatedTime: 18,
      estimatedEarning: 30,
    },
  ]);

  // Audio and alarm state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const alarmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOrderIdRef = useRef<string | null>(null);

  // Initialize audio and location
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log('Error setting audio mode:', error);
      }
    };

    const initializeLocation = async () => {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail && isOnline) {
        await startLocationTracking();
      }
    };

    initializeAudio();
    initializeLocation();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
      }
      locationService.stopTracking();
    };
  }, []);

  // Location tracking functions
  const startLocationTracking = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) return;

      const success = await locationService.startTracking(userEmail);
      if (success) {
        setLocationStatus(prev => ({ ...prev, isTracking: true }));
        
        // Update location status every 30 seconds
        const locationInterval = setInterval(async () => {
          const currentLocation = locationService.getCurrentLocationData();
          if (currentLocation) {
            const distance = locationService.calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              STORE_LOCATION.latitude,
              STORE_LOCATION.longitude
            );
            
            const isEligible = distance <= MAX_DELIVERY_RADIUS;
            
            setLocationStatus(prev => ({
              ...prev,
              distanceFromStore: distance,
              isEligibleForOrders: isEligible,
              lastUpdate: new Date(),
            }));

            // Filter orders based on eligibility
            if (!isEligible && availableOrders.length > 0) {
              setAvailableOrders([]);
              Alert.alert(
                '📍 Location Alert',
                `You are ${distance.toFixed(1)}km from the store. Orders are only available within ${MAX_DELIVERY_RADIUS}km radius.`,
                [{ text: 'OK' }]
              );
            }
          }
        }, 30000);

        return () => clearInterval(locationInterval);
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to receive delivery orders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {/* Open settings */} }
          ]
        );
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = async () => {
    await locationService.stopTracking();
    setLocationStatus({
      isTracking: false,
      distanceFromStore: 0,
      isEligibleForOrders: false,
      lastUpdate: null,
    });
  };

  // Create alarm sound
  const createAlarmSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        // Using a built-in notification sound or you can add your own alarm.mp3 file
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        {
          shouldPlay: false,
          isLooping: true,
          volume: 1.0,
        }
      );
      return newSound;
    } catch (error) {
      console.log('Error creating alarm sound:', error);
      return null;
    }
  };

  // Start 30-second alarm
  const startAlarm = async (orderId: string) => {
    try {
      // Stop any existing alarm
      await stopAlarm();

      currentOrderIdRef.current = orderId;
      setIsAlarmPlaying(true);

      // Create and play alarm sound
      const alarmSound = await createAlarmSound();
      if (alarmSound) {
        setSound(alarmSound);
        await alarmSound.playAsync();
      }

      // Vibration pattern every 2 seconds
      const vibrationInterval = setInterval(() => {
        if (currentOrderIdRef.current === orderId) {
          Vibration.vibrate([100, 300, 100, 300]);
        } else {
          clearInterval(vibrationInterval);
        }
      }, 2000);

      // Auto-stop alarm after 30 seconds
      alarmTimeoutRef.current = setTimeout(async () => {
        await stopAlarm();
        Alert.alert(
          '⏰ Order Timeout',
          'The order alert has timed out. The order is still available in your list.',
          [{ text: 'OK' }]
        );
        clearInterval(vibrationInterval);
      }, 30000);

    } catch (error) {
      console.log('Error starting alarm:', error);
    }
  };

  // Stop alarm
  const stopAlarm = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
        alarmTimeoutRef.current = null;
      }

      setIsAlarmPlaying(false);
      currentOrderIdRef.current = null;
      Vibration.cancel();
    } catch (error) {
      console.log('Error stopping alarm:', error);
    }
  };

  // Simulate new order alerts
  useEffect(() => {
    if (isOnline) {
      const alertInterval = setInterval(() => {
        // Simulate a new order coming in
        const newOrder: DeliveryOrder = {
          id: `BH${Date.now()}`,
          customerName: ['Suresh Singh', 'Anita Gupta', 'Vikram Yadav'][Math.floor(Math.random() * 3)],
          address: ['HSR Layout', 'BTM Layout', 'Marathahalli'][Math.floor(Math.random() * 3)] + ', Bangalore',
          items: Math.floor(Math.random() * 10) + 1,
          amount: Math.floor(Math.random() * 300) + 100,
          status: 'new',
          distance: `${(Math.random() * 3 + 1).toFixed(1)} km`,
          estimatedTime: Math.floor(Math.random() * 15) + 10,
          estimatedEarning: Math.floor(Math.random() * 40) + 25,
          isNew: true,
        };

        setAvailableOrders(prev => [newOrder, ...prev]);
        
        // Trigger alarm notification
        triggerOrderAlert(newOrder.id);
      }, 45000); // New order every 45 seconds for demo

      return () => clearInterval(alertInterval);
    }
  }, [isOnline]);

  const triggerOrderAlert = async (orderId: string) => {
    // Start 30-second alarm
    await startAlarm(orderId);
    
    // Show alert dialog
    Alert.alert(
      '🚨 NEW ORDER ALERT! 🚨',
      'A new delivery order is available! Alarm will stop when you accept or reject, or after 30 seconds.',
      [
        { 
          text: 'View Orders', 
          onPress: () => {
            // Don't stop alarm, let user see orders and decide
          } 
        },
        { 
          text: 'Stop Alarm', 
          style: 'cancel',
          onPress: () => stopAlarm()
        },
      ],
      { cancelable: true }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#ef4444';
      case 'assigned': return '#f59e0b';
      case 'accepted': return '#3b82f6';
      case 'picked_up': return '#8b5cf6';
      case 'on_the_way': return '#7c3aed';
      case 'delivered': return '#10b981';
      case 'rejected': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'New Order';
      case 'assigned': return 'Assigned';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'Picked Up';
      case 'on_the_way': return 'On the Way';
      case 'delivered': return 'Delivered';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await stopAlarm(); // Stop any playing alarm
            await AsyncStorage.clear();
            router.replace('/');
          },
        },
      ]
    );
  };

  const acceptOrder = async (orderId: string) => {
    // Stop alarm immediately when order is accepted
    await stopAlarm();

    const order = availableOrders.find(o => o.id === orderId);
    if (order) {
      const acceptedOrder = { ...order, status: 'accepted' as const, isNew: false };
      setAcceptedOrders(prev => [...prev, acceptedOrder]);
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
      
      // Update earnings
      setTodayStats(prev => ({
        ...prev,
        deliveries: prev.deliveries + 1,
        earnings: prev.earnings + acceptedOrder.estimatedEarning,
      }));

      Alert.alert(
        'Order Accepted! 🎉',
        `You have accepted order #${orderId}. Navigate to pickup location?`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Navigate Now', onPress: () => handleOrderAction(orderId, 'Navigate') },
        ]
      );
    }
  };

  const rejectOrder = async (orderId: string) => {
    // Stop alarm immediately when order is rejected
    await stopAlarm();

    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
            Alert.alert('Order Rejected', 'The order has been rejected and removed from your list.');
          },
        },
      ]
    );
  };

  const handleOrderAction = (orderId: string, action: string) => {
    if (action === 'Navigate') {
      Alert.alert('Navigation', `Opening navigation for order #${orderId}`);
    } else if (action === 'Mark Picked Up') {
      setAcceptedOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: 'picked_up' } : order
        )
      );
      Alert.alert('Order Updated', 'Order marked as picked up!');
    } else if (action === 'Mark Delivered') {
      setAcceptedOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: 'delivered' } : order
        )
      );
      Alert.alert('Order Completed! 🎉', 'Order marked as delivered. Great job!');
    }
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    
    if (isOnline) {
      // Stop alarm when going offline
      await stopAlarm();
      await stopLocationTracking();
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail) {
        await locationService.setPartnerOffline(userEmail);
      }
    } else {
      // Start location tracking when going online
      await startLocationTracking();
    }
    
    setIsOnline(newStatus);
    Alert.alert(
      newStatus ? 'Going Online' : 'Going Offline',
      newStatus 
        ? 'Location tracking started. You will receive orders when near the store.' 
        : 'Location tracking stopped. You will not receive new orders.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#f97316', '#ea580c']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="bicycle" size={24} color="white" />
            <Text style={styles.headerTitle}>Delivery Dashboard</Text>
            {isAlarmPlaying && (
              <View style={styles.alarmIndicator}>
                <Ionicons name="notifications" size={16} color="#ef4444" />
                <Text style={styles.alarmText}>ALARM</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.statusText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
            {isAlarmPlaying && (
              <TouchableOpacity onPress={stopAlarm} style={styles.stopAlarmButton}>
                <Ionicons name="stop-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
          </View>
        </View>

        {/* Alarm Alert Banner */}
        {isAlarmPlaying && (
          <View style={styles.alarmBanner}>
            <View style={styles.alarmBannerContent}>
              <Ionicons name="alarm" size={20} color="#ef4444" />
              <Text style={styles.alarmBannerText}>New Order Alert! Accept or Reject to stop alarm</Text>
              <TouchableOpacity onPress={stopAlarm} style={styles.stopAlarmMini}>
                <Ionicons name="close" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{todayStats.earnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            <Ionicons name="wallet" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayStats.deliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
            <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.8)" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{todayStats.avgEarning}</Text>
            <Text style={styles.statLabel}>Avg per Delivery</Text>
            <Ionicons name="trending-up" size={20} color="rgba(255,255,255,0.8)" />
            </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayStats.hoursWorked}h</Text>
            <Text style={styles.statLabel}>Hours Worked</Text>
            <Ionicons name="time" size={20} color="rgba(255,255,255,0.8)" />
            </View>
        </ScrollView>

        {/* Location Status */}
        {isOnline && (
          <View style={styles.locationStatus}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={16} color="white" />
              <Text style={styles.locationTitle}>Location Status</Text>
            </View>
            <View style={styles.locationInfo}>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Distance from store:</Text>
                <Text style={styles.locationValue}>
                  {locationStatus.distanceFromStore > 0 
                    ? `${locationStatus.distanceFromStore.toFixed(1)} km` 
                    : 'Calculating...'}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Order eligibility:</Text>
                <View style={[
                  styles.eligibilityBadge,
                  { backgroundColor: locationStatus.isEligibleForOrders ? '#10b981' : '#ef4444' }
                ]}>
                  <Text style={styles.eligibilityText}>
                    {locationStatus.isEligibleForOrders ? 'ELIGIBLE' : 'TOO FAR'}
                  </Text>
                </View>
              </View>
              {!locationStatus.isEligibleForOrders && locationStatus.distanceFromStore > 0 && (
                <Text style={styles.locationHint}>
                  Move within {MAX_DELIVERY_RADIUS}km of the store to receive orders
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionItem, isOnline ? styles.onlineAction : styles.offlineAction]}
              onPress={toggleOnlineStatus}
            >
              <Ionicons name="power" size={24} color="white" />
              <Text style={styles.actionText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => Alert.alert('Feature', 'Navigation')}
            >
              <Ionicons name="navigate" size={24} color="white" />
              <Text style={styles.actionText}>Navigation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => Alert.alert('Feature', 'Earnings Report')}
            >
              <Ionicons name="analytics" size={24} color="white" />
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => Alert.alert('Feature', 'Support')}
            >
              <Ionicons name="help-circle" size={24} color="white" />
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer}>
      {/* Available Orders */}
      <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleDark}>Available Orders</Text>
            <View style={styles.orderCount}>
              <Text style={styles.orderCountText}>{availableOrders.length}</Text>
            </View>
          </View>
        
        {!isOnline ? (
          <View style={styles.offlineMessage}>
            <Ionicons name="power" size={32} color="#9ca3af" />
            <Text style={styles.offlineText}>Go online to see available orders</Text>
          </View>
          ) : availableOrders.length === 0 ? (
            <View style={styles.noOrdersMessage}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text style={styles.noOrdersText}>No new orders available</Text>
          </View>
        ) : (
            availableOrders.map((order) => (
              <View key={order.id} style={[
                styles.orderCard, 
                order.isNew && styles.newOrderCard,
                isAlarmPlaying && currentOrderIdRef.current === order.id && styles.alarmingOrderCard
              ]}>
                {order.isNew && (
                  <View style={styles.newOrderBadge}>
                    <Ionicons name="flash" size={12} color="white" />
                    <Text style={styles.newOrderText}>NEW</Text>
                  </View>
                )}
                
                {isAlarmPlaying && currentOrderIdRef.current === order.id && (
                  <View style={styles.alarmingBadge}>
                    <Ionicons name="alarm" size={12} color="white" />
                    <Text style={styles.alarmingText}>ALARM</Text>
                  </View>
                )}
                
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderIdText}>#{order.id}</Text>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                  </View>
                  <View style={styles.orderAmount}>
                    <Text style={styles.amountText}>₹{order.amount}</Text>
                    <Text style={styles.earningText}>Earn ₹{order.estimatedEarning}</Text>
                  </View>
                </View>
                
                <View style={styles.orderDetails}>
                  <View style={styles.addressContainer}>
                    <Ionicons name="location" size={14} color="#6b7280" />
                    <Text style={styles.address}>{order.address}</Text>
                  </View>
                  
                  <View style={styles.deliveryMeta}>
                    <Text style={styles.distance}>{order.distance} • {order.items} items</Text>
                    <Text style={styles.estimatedTime}>{order.estimatedTime} mins</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={[styles.rejectButton, isAlarmPlaying && currentOrderIdRef.current === order.id && styles.alarmButton]}
                    onPress={() => rejectOrder(order.id)}
                  >
                    <Ionicons name="close" size={16} color="#ef4444" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.acceptButton, isAlarmPlaying && currentOrderIdRef.current === order.id && styles.alarmAcceptButton]}
                    onPress={() => acceptOrder(order.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Accepted Orders */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleDark}>My Orders</Text>
            <View style={styles.orderCount}>
              <Text style={styles.orderCountText}>{acceptedOrders.length}</Text>
            </View>
          </View>
          
          {acceptedOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderIdText}>#{order.id}</Text>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                <View style={styles.orderAmount}>
                  <Text style={styles.amountText}>₹{order.amount}</Text>
                  <Text style={styles.itemsText}>{order.items} items</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.addressContainer}>
                  <Ionicons name="location" size={14} color="#6b7280" />
                  <Text style={styles.address}>{order.address}</Text>
                </View>
                
                <View style={styles.deliveryMeta}>
                  <Text style={styles.distance}>{order.distance}</Text>
                  <Text style={styles.estimatedTime}>{order.estimatedTime} mins</Text>
                </View>
              </View>
              
              <View style={styles.orderFooter}>
                <View style={styles.statusContainer}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(order.status) }
                    ]} 
                  />
                  <Text style={styles.statusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  {order.status === 'accepted' && (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleOrderAction(order.id, 'Navigate')}
                      >
                        <Ionicons name="navigate" size={14} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.pickupButton]}
                        onPress={() => handleOrderAction(order.id, 'Mark Picked Up')}
                      >
                        <Ionicons name="bag" size={14} color="white" />
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {order.status === 'picked_up' && (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleOrderAction(order.id, 'Navigate')}
                      >
                        <Ionicons name="navigate" size={14} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deliveredButton]}
                        onPress={() => handleOrderAction(order.id, 'Mark Delivered')}
                      >
                        <Ionicons name="checkmark" size={14} color="white" />
                      </TouchableOpacity>
                    </>
        )}
      </View>
              </View>
            </View>
          ))}
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
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  alarmIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  alarmText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stopAlarmButton: {
    padding: 4,
    marginRight: 8,
  },
  logoutButton: {
    padding: 4,
  },
  alarmBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  alarmBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alarmBannerText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  stopAlarmMini: {
    padding: 4,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    minWidth: 160,
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  onlineAction: {
    backgroundColor: '#ef4444',
  },
  offlineAction: {
    backgroundColor: '#10b981',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  ordersSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleDark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderCount: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  offlineMessage: {
    alignItems: 'center',
    padding: 40,
  },
  offlineText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 12,
  },
  noOrdersMessage: {
    alignItems: 'center',
    padding: 40,
  },
  noOrdersText: {
    color: '#10b981',
    fontSize: 16,
    marginTop: 12,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  newOrderCard: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  alarmingOrderCard: {
    borderWidth: 3,
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
  },
  newOrderBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  alarmingBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  alarmingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  newOrderText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
  },
  earningText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  itemsText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  orderDetails: {
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    flex: 1,
  },
  deliveryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    color: '#6b7280',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 4,
  },
  alarmButton: {
    backgroundColor: '#fecaca',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 4,
  },
  alarmAcceptButton: {
    backgroundColor: '#ea580c',
    borderWidth: 2,
    borderColor: '#dc2626',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f97316',
    borderRadius: 6,
    padding: 8,
  },
  pickupButton: {
    backgroundColor: '#3b82f6',
  },
  deliveredButton: {
    backgroundColor: '#10b981',
  },
  // Location Status Styles
  locationStatus: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationInfo: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  locationValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  eligibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eligibilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
}); 