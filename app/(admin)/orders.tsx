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
import { StatusBar } from 'expo-status-bar';

interface Order {
  id: string;
  customerName: string;
  items: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered';
  orderTime: string;
  address: string;
}

export default function AdminOrdersScreen() {
  const [orders] = useState<Order[]>([
    {
      id: '1001',
      customerName: 'Priya Sharma',
      items: 12,
      total: 850,
      status: 'preparing',
      orderTime: '2 min ago',
      address: 'Sector 15, Noida',
    },
    {
      id: '1002',
      customerName: 'Rajesh Kumar',
      items: 8,
      total: 620,
      status: 'pending',
      orderTime: '5 min ago',
      address: 'Connaught Place, Delhi',
    },
    {
      id: '1003',
      customerName: 'Anita Gupta',
      items: 15,
      total: 1200,
      status: 'ready',
      orderTime: '8 min ago',
      address: 'Gurgaon Sector 21',
    },
    {
      id: '1004',
      customerName: 'Vikram Singh',
      items: 6,
      total: 480,
      status: 'out-for-delivery',
      orderTime: '12 min ago',
      address: 'Dwarka, New Delhi',
    },
    {
      id: '1005',
      customerName: 'Sunita Devi',
      items: 10,
      total: 750,
      status: 'pending',
      orderTime: '15 min ago',
      address: 'Lajpat Nagar, Delhi',
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

  const handleOrderAction = (orderId: string, action: string) => {
    Alert.alert(
      'Order Action',
      `${action} order #${orderId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert('Success', `Order #${orderId} has been ${action.toLowerCase()}`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="bag" size={28} color="white" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Order Management</Text>
              <Text style={styles.headerSubtitle}>{orders.length} active orders</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Orders List */}
      <ScrollView style={styles.ordersContainer} showsVerticalScrollIndicator={false}>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderIdText}>Order #{order.id}</Text>
                <Text style={styles.customerName}>{order.customerName}</Text>
                <Text style={styles.addressText}>{order.address}</Text>
              </View>
              <View style={styles.orderAmount}>
                <Text style={styles.amountText}>₹{order.total}</Text>
                <Text style={styles.itemsText}>{order.items} items</Text>
              </View>
            </View>
            
            <View style={styles.orderStatus}>
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

            <View style={styles.orderActions}>
              {order.status === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleOrderAction(order.id, 'Accept')}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleOrderAction(order.id, 'Reject')}
                  >
                    <Ionicons name="close" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {order.status === 'preparing' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.readyButton]}
                  onPress={() => handleOrderAction(order.id, 'Mark Ready')}
                >
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Mark Ready</Text>
                </TouchableOpacity>
              )}
              
              {order.status === 'ready' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.dispatchButton]}
                  onPress={() => handleOrderAction(order.id, 'Dispatch')}
                >
                  <Ionicons name="send" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Dispatch</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => Alert.alert('Order Details', `Viewing details for order #${order.id}`)}
              >
                <Ionicons name="eye" size={16} color="#374151" />
                <Text style={[styles.actionButtonText, { color: '#374151' }]}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ordersContainer: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
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
  orderStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  readyButton: {
    backgroundColor: '#3b82f6',
  },
  dispatchButton: {
    backgroundColor: '#8b5cf6',
  },
  viewButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
}); 