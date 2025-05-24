import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    if (action === 'Live Tracking') {
      router.push('/(admin)/track-all');
    } else {
      Alert.alert('Quick Action', `${action} feature will be implemented soon!`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="settings" size={24} color="white" />
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{todayStats.revenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
            <Ionicons name="trending-up" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayStats.orders}</Text>
            <Text style={styles.statLabel}>Orders Today</Text>
            <Ionicons name="bag" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{todayStats.avgOrderValue}</Text>
            <Text style={styles.statLabel}>Avg Order Value</Text>
            <Ionicons name="analytics" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayStats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
            <Ionicons name="people" size={20} color="rgba(255,255,255,0.8)" />
          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Live Tracking')}
            >
              <Ionicons name="location" size={24} color="white" />
              <Text style={styles.actionText}>Live Tracking</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Add Product')}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Manage Inventory')}
            >
              <Ionicons name="cube" size={24} color="white" />
              <Text style={styles.actionText}>Inventory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('View Reports')}
            >
              <Ionicons name="bar-chart" size={24} color="white" />
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('Settings')}
            >
              <Ionicons name="cog" size={24} color="white" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => handleQuickAction('User Management')}
            >
              <Ionicons name="people" size={24} color="white" />
              <Text style={styles.actionText}>Users</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Recent Orders */}
      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitleDark}>Recent Orders</Text>
        
        <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
          {recentOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderIdText}>#{order.id}</Text>
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
                  <Text style={styles.statusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
                <Text style={styles.timeText}>{order.orderTime}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
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
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
    width: '31%',
    marginBottom: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  ordersSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitleDark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  ordersList: {
    flex: 1,
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
    color: '#ef4444',
  },
  itemsText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  statusText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
}); 