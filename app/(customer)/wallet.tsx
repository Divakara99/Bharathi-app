import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { walletService, CustomerWallet, WalletTransaction } from '../../services/walletService';

export default function CustomerWalletScreen() {
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  // Mock customer ID - in real app, get from auth context
  const customerId = 'customer_001';
  const customerName = 'John Doe';
  const customerEmail = 'john@example.com';

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      let customerWallet = await walletService.getCustomerWallet(customerId);
      
      // Create wallet if it doesn't exist
      if (!customerWallet) {
        customerWallet = await walletService.createCustomerWallet(
          customerId,
          customerName,
          customerEmail
        );
      }
      
      setWallet(customerWallet);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const getExpiringFreeCash = () => {
    if (!wallet) return [];
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    return wallet.transactions
      .filter(t => 
        t.source === 'admin_free_cash' && 
        t.expiryDate && 
        new Date(t.expiryDate) > now &&
        new Date(t.expiryDate) <= threeDaysFromNow
      )
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (transaction: WalletTransaction) => {
    switch (transaction.source) {
      case 'admin_free_cash':
        return 'gift';
      case 'admin_add_balance':
        return 'add-circle';
      case 'order_payment':
        return 'bag';
      case 'refund':
        return 'return-up-back';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (transaction: WalletTransaction) => {
    if (transaction.type === 'credit') {
      return transaction.source === 'admin_free_cash' ? '#f59e0b' : '#10b981';
    }
    return '#ef4444';
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item) + '20' }]}>
          <Ionicons 
            name={getTransactionIcon(item) as any} 
            size={20} 
            color={getTransactionColor(item)} 
          />
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.timestamp)} • {formatTime(item.timestamp)}
          </Text>
          {item.expiryDate && (
            <Text style={styles.expiryDate}>
              Expires: {formatDate(item.expiryDate)}
            </Text>
          )}
        </View>
        
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            { color: item.type === 'credit' ? '#10b981' : '#ef4444' }
          ]}>
            {item.type === 'credit' ? '+' : '-'}₹{item.amount}
          </Text>
        </View>
      </View>
    </View>
  );

  const expiringFreeCash = getExpiringFreeCash();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading wallet...</Text>
          </View>
        ) : wallet ? (
          <>
            {/* Wallet Balance Card */}
            <View style={styles.balanceCard}>
              <LinearGradient 
                colors={['#7c3aed', '#a855f7']} 
                style={styles.balanceGradient}
              >
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceLabel}>Total Wallet Balance</Text>
                  <Ionicons name="wallet" size={24} color="white" />
                </View>
                
                <Text style={styles.totalBalance}>₹{wallet.totalBalance}</Text>
                
                <View style={styles.balanceBreakdown}>
                  <View style={styles.balanceItem}>
                    <Ionicons name="gift" size={16} color="white" />
                    <Text style={styles.balanceItemText}>Free Cash: ₹{wallet.freeCashBalance}</Text>
                  </View>
                  <View style={styles.balanceItem}>
                    <Ionicons name="add-circle" size={16} color="white" />
                    <Text style={styles.balanceItemText}>Added: ₹{wallet.addedBalance}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Expiring Free Cash Alert */}
            {expiringFreeCash.length > 0 && (
              <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <Text style={styles.alertTitle}>Free Cash Expiring Soon!</Text>
                </View>
                
                {expiringFreeCash.map((transaction, index) => (
                  <View key={transaction.id} style={styles.expiringItem}>
                    <Text style={styles.expiringAmount}>₹{transaction.amount}</Text>
                    <Text style={styles.expiringDate}>
                      Expires on {formatDate(transaction.expiryDate!)}
                    </Text>
                  </View>
                ))}
                
                <Text style={styles.alertMessage}>
                  Use your free cash before it expires to avoid losing it!
                </Text>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/(customer)/cart')}
                >
                  <LinearGradient 
                    colors={['#10b981', '#059669']} 
                    style={styles.actionGradient}
                  >
                    <Ionicons name="bag" size={20} color="white" />
                    <Text style={styles.actionText}>Use in Order</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowTransactions(!showTransactions)}
                >
                  <LinearGradient 
                    colors={['#3b82f6', '#2563eb']} 
                    style={styles.actionGradient}
                  >
                    <Ionicons name="list" size={20} color="white" />
                    <Text style={styles.actionText}>
                      {showTransactions ? 'Hide' : 'Show'} History
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transaction History */}
            {showTransactions && (
              <View style={styles.transactionsSection}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                
                {wallet.transactions.length > 0 ? (
                  <FlatList
                    data={wallet.transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyTransactions}>
                    <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>No transactions yet</Text>
                    <Text style={styles.emptySubtext}>
                      Your wallet transactions will appear here
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Wallet Info */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>How Wallet Works</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                  <Ionicons name="gift" size={20} color="#f59e0b" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoTitle}>Free Cash</Text>
                    <Text style={styles.infoDescription}>
                      Added by admin as rewards. Has expiry date.
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="add-circle" size={20} color="#10b981" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoTitle}>Added Balance</Text>
                    <Text style={styles.infoDescription}>
                      Regular balance added by admin. No expiry.
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="bag" size={20} color="#3b82f6" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoTitle}>Order Payment</Text>
                    <Text style={styles.infoDescription}>
                      Use wallet balance to pay for orders. Free cash used first.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="wallet-outline" size={64} color="#9ca3af" />
            <Text style={styles.errorText}>Unable to load wallet</Text>
            <TouchableOpacity onPress={loadWallet} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
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
  balanceCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  totalBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  balanceBreakdown: {
    gap: 8,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceItemText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  alertCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
  },
  expiringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expiringAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
  },
  expiringDate: {
    fontSize: 12,
    color: '#92400e',
  },
  alertMessage: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  expiryDate: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  infoSection: {
    marginBottom: 40,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 