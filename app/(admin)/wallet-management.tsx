import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { walletService, CustomerWallet, WalletSettings } from '../../services/walletService';

export default function WalletManagementScreen() {
  const [wallets, setWallets] = useState<CustomerWallet[]>([]);
  const [walletSettings, setWalletSettings] = useState<WalletSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWallet | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // Form states
  const [freeCashAmount, setFreeCashAmount] = useState('');
  const [freeCashExpiry, setFreeCashExpiry] = useState('30');
  const [freeCashDescription, setFreeCashDescription] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletsData, settingsData, statsData] = await Promise.all([
        walletService.getAllCustomerWallets(),
        walletService.getWalletSettings(),
        walletService.getWalletStatistics(),
      ]);
      
      setWallets(walletsData);
      setWalletSettings(settingsData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFreeCash = async () => {
    if (!selectedCustomer || !freeCashAmount || !freeCashExpiry) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const amount = parseFloat(freeCashAmount);
      const expiryDays = parseInt(freeCashExpiry);
      
      if (amount <= 0 || expiryDays <= 0) {
        Alert.alert('Error', 'Please enter valid amounts');
        return;
      }

      await walletService.addFreeCash(
        selectedCustomer.customerId,
        amount,
        'admin_001', // In real app, get from logged-in admin
        expiryDays,
        freeCashDescription || 'Free cash added by admin'
      );

      Alert.alert('Success', `₹${amount} free cash added successfully!`);
      setShowAddCashModal(false);
      setFreeCashAmount('');
      setFreeCashExpiry('30');
      setFreeCashDescription('');
      loadWalletData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add free cash');
    }
  };

  const handleAddBalance = async () => {
    if (!selectedCustomer || !balanceAmount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const amount = parseFloat(balanceAmount);
      
      if (amount <= 0) {
        Alert.alert('Error', 'Please enter valid amount');
        return;
      }

      await walletService.addBalance(
        selectedCustomer.customerId,
        amount,
        'admin_001', // In real app, get from logged-in admin
        balanceDescription || 'Balance added by admin'
      );

      Alert.alert('Success', `₹${amount} balance added successfully!`);
      setShowAddBalanceModal(false);
      setBalanceAmount('');
      setBalanceDescription('');
      loadWalletData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add balance');
    }
  };

  const handleSaveSettings = async () => {
    if (!walletSettings) return;

    try {
      await walletService.saveWalletSettings(walletSettings);
      Alert.alert('Success', 'Wallet settings saved successfully!');
      setShowSettingsModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save wallet settings');
    }
  };

  const openAddFreeCash = (customer: CustomerWallet) => {
    setSelectedCustomer(customer);
    setShowAddCashModal(true);
  };

  const openAddBalance = (customer: CustomerWallet) => {
    setSelectedCustomer(customer);
    setShowAddBalanceModal(true);
  };

  const renderWalletCard = ({ item }: { item: CustomerWallet }) => (
    <View style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.customerEmail}>{item.customerEmail}</Text>
        </View>
        <View style={styles.balanceInfo}>
          <Text style={styles.totalBalance}>₹{item.totalBalance}</Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
        </View>
      </View>

      <View style={styles.balanceBreakdown}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceAmount}>₹{item.freeCashBalance}</Text>
          <Text style={styles.balanceType}>Free Cash</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceAmount}>₹{item.addedBalance}</Text>
          <Text style={styles.balanceType}>Added Balance</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceAmount}>{item.transactions.length}</Text>
          <Text style={styles.balanceType}>Transactions</Text>
        </View>
      </View>

      <View style={styles.walletActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.freeCashButton]}
          onPress={() => openAddFreeCash(item)}
        >
          <Ionicons name="gift" size={16} color="white" />
          <Text style={styles.actionButtonText}>Add Free Cash</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.balanceButton]}
          onPress={() => openAddBalance(item)}
        >
          <Ionicons name="add-circle" size={16} color="white" />
          <Text style={styles.actionButtonText}>Add Balance</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.lastUpdated}>
        Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet Management</Text>
          <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Statistics */}
      {statistics && (
        <View style={styles.statisticsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#3b82f6" />
              <Text style={styles.statValue}>{statistics.totalCustomers}</Text>
              <Text style={styles.statLabel}>Total Customers</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="wallet" size={24} color="#10b981" />
              <Text style={styles.statValue}>₹{statistics.totalWalletBalance}</Text>
              <Text style={styles.statLabel}>Total Balance</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="gift" size={24} color="#f59e0b" />
              <Text style={styles.statValue}>₹{statistics.totalFreeCash}</Text>
              <Text style={styles.statLabel}>Free Cash</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="card" size={24} color="#8b5cf6" />
              <Text style={styles.statValue}>{statistics.activeWallets}</Text>
              <Text style={styles.statLabel}>Active Wallets</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Wallet List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading wallets...</Text>
          </View>
        ) : wallets.length > 0 ? (
          <FlatList
            data={wallets}
            renderItem={renderWalletCard}
            keyExtractor={(item) => item.customerId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.walletList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No customer wallets found</Text>
            <Text style={styles.emptySubtext}>Wallets will appear here when customers register</Text>
          </View>
        )}
      </View>

      {/* Add Free Cash Modal */}
      <Modal visible={showAddCashModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Free Cash</Text>
              <TouchableOpacity onPress={() => setShowAddCashModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <Text style={styles.modalSubtitle}>
                For: {selectedCustomer.customerName}
              </Text>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={freeCashAmount}
                onChangeText={setFreeCashAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expiry (Days)</Text>
              <TextInput
                style={styles.input}
                value={freeCashExpiry}
                onChangeText={setFreeCashExpiry}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                value={freeCashDescription}
                onChangeText={setFreeCashDescription}
                placeholder="Reason for adding free cash"
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddCashModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddFreeCash}
              >
                <Text style={styles.confirmButtonText}>Add Free Cash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Balance Modal */}
      <Modal visible={showAddBalanceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Balance</Text>
              <TouchableOpacity onPress={() => setShowAddBalanceModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <Text style={styles.modalSubtitle}>
                For: {selectedCustomer.customerName}
              </Text>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={balanceAmount}
                onChangeText={setBalanceAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                value={balanceDescription}
                onChangeText={setBalanceDescription}
                placeholder="Reason for adding balance"
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddBalanceModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddBalance}
              >
                <Text style={styles.confirmButtonText}>Add Balance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wallet Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {walletSettings && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Default Free Cash Expiry (Days)</Text>
                  <TextInput
                    style={styles.input}
                    value={walletSettings.defaultFreeCashExpiry.toString()}
                    onChangeText={(text) => setWalletSettings({
                      ...walletSettings,
                      defaultFreeCashExpiry: parseInt(text) || 30
                    })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Max Free Cash Amount (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={walletSettings.maxFreeCashAmount.toString()}
                    onChangeText={(text) => setWalletSettings({
                      ...walletSettings,
                      maxFreeCashAmount: parseInt(text) || 500
                    })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Max Wallet Balance (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={walletSettings.maxWalletBalance.toString()}
                    onChangeText={(text) => setWalletSettings({
                      ...walletSettings,
                      maxWalletBalance: parseInt(text) || 10000
                    })}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveSettings}
              >
                <Text style={styles.confirmButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statisticsSection: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 120,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
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
  walletList: {
    padding: 16,
  },
  walletCard: {
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
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  totalBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  balanceType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  freeCashButton: {
    backgroundColor: '#f59e0b',
  },
  balanceButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
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
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 