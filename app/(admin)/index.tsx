import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Order {
  id: string;
  customerName: string;
  items: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered';
  orderTime: string;
}

export default function AdminDashboard() {
  const [todayStats] = useState({
    revenue: 45670,
    orders: 134,
    avgOrderValue: 341,
    activeUsers: 89,
  });

  const [recentOrders] = useState<Order[]>([
    {
      id: '1001',
      customerName: 'Priya Sharma',
      items: 12,
      total: 850,
      status: 'preparing',
      orderTime: '2 min ago',
    },
    {
      id: '1002',
      customerName: 'Rajesh Kumar',
      items: 8,
      total: 620,
      status: 'pending',
      orderTime: '5 min ago',
    },
    {
      id: '1003',
      customerName: 'Anita Gupta',
      items: 15,
      total: 1200,
      status: 'ready',
      orderTime: '8 min ago',
    },
    {
      id: '1004',
      customerName: 'Vikram Singh',
      items: 6,
      total: 480,
      status: 'out-for-delivery',
      orderTime: '12 min ago',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'out-for-delivery': return '#8b5cf6';
      case 'delivered': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'out-for-delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
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
            await AsyncStorage.clear();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Live Tracking':
        router.push('/(admin)/track-all');
        break;
      case 'Add Product':
        router.push('/(admin)/products?action=add');
        break;
      case 'Manage Inventory':
        router.push('/(admin)/products');
        break;
      case 'View Reports':
        router.push('/(admin)/analytics');
        break;
      case 'Settings':
        router.push('/(admin)/settings');
        break;
      case 'User Management':
        router.push('/(admin)/user-management');
        break;
      case 'Payment History':
        Alert.alert('Payment History', 'Payment history feature will be implemented soon!');
        break;
      default:
        Alert.alert('Quick Action', `${action} feature will be implemented soon!`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Section */}
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={28} color="white" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>BHARATHI ENTERPRISES</Text>
              <Text style={styles.headerSubtitle}>Admin Dashboard</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>₹{todayStats.revenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="bag" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{todayStats.orders}</Text>
            <Text style={styles.statLabel}>Orders Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="analytics" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>₹{todayStats.avgOrderValue}</Text>
            <Text style={styles.statLabel}>Avg Order Value</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>{todayStats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Live Tracking')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#10b981' }]}>
                <Ionicons name="location" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Live Tracking</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Add Product')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="add-circle" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Manage Inventory')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="cube" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Inventory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('View Reports')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="bar-chart" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Settings')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#6b7280' }]}>
                <Ionicons name="cog" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('User Management')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#ef4444' }]}>
                <Ionicons name="people" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/(admin)/bank-details')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#10b981' }]}>
                <Ionicons name="card" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Bank Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Payment History')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="receipt" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Payments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/(admin)/delivery-zones')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#0891b2' }]}>
                <Ionicons name="map" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Delivery Zones</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersSectionHeader}>
            <Text style={styles.sectionTitle}>📋 Recent Orders</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(admin)/orders')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
          
          {recentOrders.map((order) => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.orderCard}
              onPress={() => router.push(`/(admin)/orders?orderId=${order.id}`)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderIdText}>Order #{order.id}</Text>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                <View style={styles.orderAmount}>
                  <Text style={styles.amountText}>₹{order.total}</Text>
                  <Text style={styles.itemsText}>{order.items} items</Text>
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
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
                <Text style={styles.timeText}>{order.orderTime}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statsContainer: {
    paddingLeft: 20,
  },
  statsContent: {
    paddingRight: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    minWidth: 160,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#1f2937',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  ordersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderIdText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
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
    color: '#ef4444',
  },
  itemsText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
}); 