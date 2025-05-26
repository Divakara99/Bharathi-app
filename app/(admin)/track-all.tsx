import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService, STORE_LOCATION, MAX_DELIVERY_RADIUS, DeliveryPartnerLocation } from '../../services/locationService';

const { width } = Dimensions.get('window');

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryPartnerId: string;
  deliveryPartnerName: string;
  status: 'confirmed' | 'preparing' | 'on_the_way' | 'nearby' | 'delivered';
  items: number;
  totalAmount: number;
  estimatedTime: number;
  address: string;
  orderTime: string;
}

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  status: 'available' | 'busy' | 'offline';
  currentLocation: string;
  activeOrderId?: string;
  totalDeliveries: number;
  earningsToday: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  lastOrderDate: string;
  status: 'active' | 'inactive';
  location: string;
}

export default function AdminTrackAllScreen() {
  const [activeTab, setActiveTab] = useState<'orders' | 'delivery' | 'customers'>('orders');
  const [refreshing, setRefreshing] = useState(false);
  const [liveTracking, setLiveTracking] = useState(true);
  const [deliveryPartnerLocations, setDeliveryPartnerLocations] = useState<DeliveryPartnerLocation[]>([]);

  // Load delivery partner locations
  const loadDeliveryPartnerLocations = async () => {
    try {
      const locations = await locationService.getEligiblePartners();
      const allLocations = await AsyncStorage.getItem('deliveryPartnerLocations');
      const allLocationData = allLocations ? JSON.parse(allLocations) : [];
      setDeliveryPartnerLocations(allLocationData);
    } catch (error) {
      console.error('Error loading delivery partner locations:', error);
    }
  };

  const orders: Order[] = [
    {
      id: 'BH2024001',
      customerId: 'C001',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 43210',
      deliveryPartnerId: 'D001',
      deliveryPartnerName: 'Rajesh Kumar',
      status: 'on_the_way',
      items: 6,
      totalAmount: 234,
      estimatedTime: 12,
      address: 'Koramangala, Bangalore',
      orderTime: '2:45 PM'
    },
    {
      id: 'BH2024002',
      customerId: 'C002',
      customerName: 'Amit Patel',
      customerPhone: '+91 87654 32109',
      deliveryPartnerId: 'D002',
      deliveryPartnerName: 'Suresh Singh',
      status: 'preparing',
      items: 3,
      totalAmount: 156,
      estimatedTime: 25,
      address: 'Indiranagar, Bangalore',
      orderTime: '3:10 PM'
    },
    {
      id: 'BH2024003',
      customerId: 'C003',
      customerName: 'Sneha Reddy',
      customerPhone: '+91 76543 21098',
      deliveryPartnerId: 'D003',
      deliveryPartnerName: 'Vikram Yadav',
      status: 'nearby',
      items: 8,
      totalAmount: 445,
      estimatedTime: 5,
      address: 'BTM Layout, Bangalore',
      orderTime: '2:30 PM'
    }
  ];

  const deliveryPartners: DeliveryPartner[] = [
    {
      id: 'D001',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      vehicle: 'Motorcycle',
      rating: 4.8,
      status: 'busy',
      currentLocation: 'Koramangala Main Road',
      activeOrderId: 'BH2024001',
      totalDeliveries: 1250,
      earningsToday: 850
    },
    {
      id: 'D002',
      name: 'Suresh Singh',
      phone: '+91 87654 32109',
      vehicle: 'Bicycle',
      rating: 4.6,
      status: 'busy',
      currentLocation: 'Indiranagar Metro Station',
      activeOrderId: 'BH2024002',
      totalDeliveries: 890,
      earningsToday: 650
    },
    {
      id: 'D003',
      name: 'Vikram Yadav',
      phone: '+91 76543 21098',
      vehicle: 'Motorcycle',
      rating: 4.9,
      status: 'busy',
      currentLocation: 'BTM Layout 2nd Stage',
      activeOrderId: 'BH2024003',
      totalDeliveries: 1540,
      earningsToday: 920
    },
    {
      id: 'D004',
      name: 'Arjun Mehta',
      phone: '+91 65432 10987',
      vehicle: 'Bicycle',
      rating: 4.7,
      status: 'available',
      currentLocation: 'HSR Layout',
      totalDeliveries: 650,
      earningsToday: 480
    }
  ];

  const customers: Customer[] = [
    {
      id: 'C001',
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya@email.com',
      totalOrders: 45,
      lastOrderDate: 'Today, 2:45 PM',
      status: 'active',
      location: 'Koramangala'
    },
    {
      id: 'C002',
      name: 'Amit Patel',
      phone: '+91 87654 32109',
      email: 'amit@email.com',
      totalOrders: 23,
      lastOrderDate: 'Today, 3:10 PM',
      status: 'active',
      location: 'Indiranagar'
    },
    {
      id: 'C003',
      name: 'Sneha Reddy',
      phone: '+91 76543 21098',
      email: 'sneha@email.com',
      totalOrders: 67,
      lastOrderDate: 'Today, 2:30 PM',
      status: 'active',
      location: 'BTM Layout'
    }
  ];

  useEffect(() => {
    loadDeliveryPartnerLocations();
    
    if (liveTracking) {
      const interval = setInterval(() => {
        // Simulate real-time updates and reload locations
        setRefreshing(true);
        loadDeliveryPartnerLocations();
        setTimeout(() => setRefreshing(false), 1000);
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [liveTracking]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#3b82f6';
      case 'preparing': return '#f59e0b';
      case 'on_the_way': return '#7c3aed';
      case 'nearby': return '#10b981';
      case 'delivered': return '#059669';
      case 'available': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/(admin)/order-details?id=${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.orderTime}>{item.orderTime}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Ionicons name="person" size={16} color="#6b7280" />
        <Text style={styles.customerName}>{item.customerName}</Text>
        <TouchableOpacity style={styles.callIcon}>
          <Ionicons name="call" size={14} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      <View style={styles.deliveryInfo}>
        <Ionicons name="bicycle" size={16} color="#6b7280" />
        <Text style={styles.partnerName}>{item.deliveryPartnerName}</Text>
        <Text style={styles.estimatedTime}>{item.estimatedTime} mins</Text>
      </View>

      <View style={styles.orderMeta}>
        <Text style={styles.itemCount}>{item.items} items</Text>
        <Text style={styles.amount}>₹{item.totalAmount}</Text>
      </View>

      <View style={styles.addressContainer}>
        <Ionicons name="location" size={14} color="#6b7280" />
        <Text style={styles.address}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDeliveryPartnerCard = ({ item }: { item: DeliveryPartner }) => {
    // Find location data for this partner
    const locationData = deliveryPartnerLocations.find(loc => 
      loc.partnerName === item.name || loc.partnerId === item.id
    );

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/(admin)/partner-details?id=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.partnerHeaderInfo}>
            <Text style={styles.partnerCardName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
        </View>

        <View style={styles.partnerMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="bicycle" size={16} color="#6b7280" />
            <Text style={styles.vehicle}>{item.vehicle}</Text>
          </View>
          <TouchableOpacity style={styles.callIcon}>
            <Ionicons name="call" size={14} color="#7c3aed" />
          </TouchableOpacity>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={styles.currentLocation}>{item.currentLocation}</Text>
        </View>

        {/* Location-based eligibility */}
        {locationData && (
          <View style={styles.locationEligibilityContainer}>
            <View style={styles.distanceInfo}>
              <Ionicons name="navigate" size={14} color="#6b7280" />
              <Text style={styles.distanceText}>
                {locationData.distanceFromStore.toFixed(1)}km from store
              </Text>
            </View>
            <View style={[
              styles.eligibilityBadge,
              { backgroundColor: locationData.isEligibleForOrders ? '#10b981' : '#ef4444' }
            ]}>
              <Text style={styles.eligibilityText}>
                {locationData.isEligibleForOrders ? 'ELIGIBLE' : 'TOO FAR'}
              </Text>
            </View>
          </View>
        )}

        {item.activeOrderId && (
          <View style={styles.activeOrderContainer}>
            <Text style={styles.activeOrderText}>Active Order: #{item.activeOrderId}</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>₹{item.earningsToday}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/(admin)/customer-details?id=${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.customerHeaderInfo}>
          <Text style={styles.customerCardName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callIcon}>
          <Ionicons name="call" size={14} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.contactRow}>
          <Ionicons name="mail" size={14} color="#6b7280" />
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call" size={14} color="#6b7280" />
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <Ionicons name="location" size={14} color="#6b7280" />
        <Text style={styles.customerLocation}>{item.location}</Text>
      </View>

      <View style={styles.customerStatsContainer}>
        <View style={styles.customerStat}>
          <Text style={styles.statValue}>{item.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.customerStat}>
          <Text style={styles.lastOrderText}>{item.lastOrderDate}</Text>
          <Text style={styles.statLabel}>Last Order</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <FlatList
            data={orders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 2000);
            }}
          />
        );
      case 'delivery':
        return (
          <FlatList
            data={deliveryPartners}
            renderItem={renderDeliveryPartnerCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 2000);
            }}
          />
        );
      case 'customers':
        return (
          <FlatList
            data={customers}
            renderItem={renderCustomerCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 2000);
            }}
          />
        );
      default:
        return null;
    }
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
          <Text style={styles.headerTitle}>Live Tracking Dashboard</Text>
          <View style={styles.headerRight}>
            <Switch
              value={liveTracking}
              onValueChange={setLiveTracking}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.8)' }}
              thumbColor={liveTracking ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{orders.length}</Text>
            <Text style={styles.overviewLabel}>Active Orders</Text>
          </View>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{deliveryPartners.filter(p => p.status === 'available').length}</Text>
            <Text style={styles.overviewLabel}>Available Partners</Text>
          </View>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{customers.filter(c => c.status === 'active').length}</Text>
            <Text style={styles.overviewLabel}>Active Customers</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => setActiveTab('orders')}
          >
            <Ionicons name="receipt" size={20} color={activeTab === 'orders' ? '#dc2626' : 'white'} />
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'delivery' && styles.activeTab]}
            onPress={() => setActiveTab('delivery')}
          >
            <Ionicons name="bicycle" size={20} color={activeTab === 'delivery' ? '#dc2626' : 'white'} />
            <Text style={[styles.tabText, activeTab === 'delivery' && styles.activeTabText]}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
            onPress={() => setActiveTab('customers')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'customers' ? '#dc2626' : 'white'} />
            <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>Customers</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#dc2626',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  estimatedTime: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  partnerHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partnerCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 4,
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicle: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  callIcon: {
    padding: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  activeOrderContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  activeOrderText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  customerHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 12,
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  phone: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  customerLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  customerStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  customerStat: {
    alignItems: 'center',
  },
  lastOrderText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  // Location-based styles
  locationEligibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  eligibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eligibilityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 