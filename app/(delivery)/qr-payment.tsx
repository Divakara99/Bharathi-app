import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import UPIQRCode from '../../components/UPIQRCode';

export default function DeliveryQRPaymentScreen() {
  const [orderAmount, setOrderAmount] = useState('147');
  const [orderId, setOrderId] = useState('BH2024001');
  const [customerName, setCustomerName] = useState('Priya Sharma');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);

  const handlePaymentReceived = () => {
    Alert.alert(
      'Payment Confirmation',
      `Confirm that you received ₹${orderAmount} from ${customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setPaymentReceived(true);
            Alert.alert(
              'Payment Confirmed!',
              'Payment has been marked as received. You can now complete the delivery.',
              [
                {
                  text: 'Complete Delivery',
                  onPress: () => router.back(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleCashPayment = () => {
    Alert.alert(
      'Cash Payment',
      `Confirm cash payment of ₹${orderAmount} received from ${customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Cash',
          onPress: () => {
            setPaymentReceived(true);
            Alert.alert('Cash Payment Confirmed!', 'Delivery can now be completed.');
          },
        },
      ]
    );
  };

  const handleAmountEdit = () => {
    setEditingAmount(true);
  };

  const handleAmountSave = () => {
    if (!orderAmount || isNaN(Number(orderAmount)) || Number(orderAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    setEditingAmount(false);
    Alert.alert('Amount Updated', `QR code updated for ₹${orderAmount}`);
  };

  const generateNewQR = () => {
    Alert.alert(
      'Generate New QR Code',
      'This will create a new QR code with the current order amount. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: () => {
            Alert.alert('QR Code Generated', `New QR code created for ₹${orderAmount}`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.gradient}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Ionicons name="qr-code" size={40} color="white" />
              <Text style={styles.title}>Collect Payment</Text>
              <Text style={styles.subtitle}>Show QR code to customer</Text>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.orderSection}>
            <Text style={styles.sectionTitle}>📦 Order Details</Text>
            
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Order ID:</Text>
                <Text style={styles.orderValue}>{orderId}</Text>
              </View>
              
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Customer:</Text>
                <Text style={styles.orderValue}>{customerName}</Text>
              </View>
              
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Amount:</Text>
                <View style={styles.amountContainer}>
                  {editingAmount ? (
                    <View style={styles.amountEditContainer}>
                      <Text style={styles.rupeeSymbol}>₹</Text>
                      <TextInput
                        style={styles.amountInput}
                        value={orderAmount}
                        onChangeText={setOrderAmount}
                        keyboardType="numeric"
                        placeholder="Enter amount"
                        autoFocus
                      />
                      <TouchableOpacity style={styles.saveButton} onPress={handleAmountSave}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.amountDisplayContainer}>
                      <Text style={styles.amountValue}>₹{orderAmount}</Text>
                      <TouchableOpacity style={styles.editButton} onPress={handleAmountEdit}>
                        <Ionicons name="create" size={16} color="#f59e0b" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Payment Status:</Text>
                <Text style={[styles.statusValue, paymentReceived && styles.paidStatus]}>
                  {paymentReceived ? 'PAID ✓' : 'PENDING'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Amount Presets */}
          <View style={styles.presetsSection}>
            <Text style={styles.sectionTitle}>⚡ Quick Amount Presets</Text>
            <View style={styles.presetButtons}>
              <TouchableOpacity 
                style={styles.presetButton} 
                onPress={() => setOrderAmount('100')}
              >
                <Text style={styles.presetText}>₹100</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetButton} 
                onPress={() => setOrderAmount('200')}
              >
                <Text style={styles.presetText}>₹200</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetButton} 
                onPress={() => setOrderAmount('500')}
              >
                <Text style={styles.presetText}>₹500</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetButton} 
                onPress={() => setOrderAmount('1000')}
              >
                <Text style={styles.presetText}>₹1000</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Options */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>💳 Payment Collection</Text>
            
            <View style={styles.paymentOptions}>
              <TouchableOpacity 
                style={styles.paymentOptionCard}
                onPress={handleCashPayment}
                disabled={paymentReceived}
              >
                <Ionicons name="cash" size={32} color="#10b981" />
                <Text style={styles.optionTitle}>Cash Payment</Text>
                <Text style={styles.optionDesc}>Collect cash from customer</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <Text style={styles.dividerText}>OR</Text>
              </View>

              <View style={styles.upiOptionCard}>
                <Ionicons name="qr-code" size={32} color="#7c3aed" />
                <Text style={styles.optionTitle}>UPI Payment</Text>
                <Text style={styles.optionDesc}>Customer scans QR code to pay</Text>
              </View>
            </View>
          </View>

          {/* UPI QR Code */}
          {!paymentReceived && (
            <View style={styles.qrSection}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrTitle}>📱 UPI QR Code - ₹{orderAmount}</Text>
                <TouchableOpacity style={styles.regenerateButton} onPress={generateNewQR}>
                  <Ionicons name="refresh" size={16} color="#7c3aed" />
                  <Text style={styles.regenerateText}>Refresh QR</Text>
                </TouchableOpacity>
              </View>
              
              <UPIQRCode 
                amount={parseInt(orderAmount)}
                orderId={orderId}
                customerName={customerName}
                onPaymentComplete={handlePaymentReceived}
              />
              
              <View style={styles.qrFooter}>
                <View style={styles.qrInfo}>
                  <Ionicons name="information-circle" size={16} color="#3b82f6" />
                  <Text style={styles.qrInfoText}>
                    QR code automatically updates when amount is changed
                  </Text>
                </View>
                
                <View style={styles.qrActions}>
                  <TouchableOpacity style={styles.qrActionButton}>
                    <Ionicons name="download" size={16} color="#6b7280" />
                    <Text style={styles.qrActionText}>Save QR</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.qrActionButton}>
                    <Ionicons name="share" size={16} color="#6b7280" />
                    <Text style={styles.qrActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Payment Received Confirmation */}
          {paymentReceived && (
            <View style={styles.successSection}>
              <View style={styles.successCard}>
                <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                <Text style={styles.successTitle}>Payment Received!</Text>
                <Text style={styles.successText}>
                  ₹{orderAmount} has been collected from {customerName}
                </Text>
                
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.completeButtonText}>Complete Delivery</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>📋 Instructions</Text>
            
            <View style={styles.instructionCard}>
              <View style={styles.instruction}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Show this QR code to the customer for UPI payment
                </Text>
              </View>
              
              <View style={styles.instruction}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  Or collect cash payment and confirm manually
                </Text>
              </View>
              
              <View style={styles.instruction}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  Confirm payment received before completing delivery
                </Text>
              </View>
              
              <View style={styles.instruction}>
                <Text style={styles.instructionNumber}>4</Text>
                <Text style={styles.instructionText}>
                  Take a photo of payment confirmation if needed
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingTop: 20,
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  orderSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  orderValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  amountValue: {
    fontSize: 18,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  paidStatus: {
    color: '#10b981',
  },
  paymentSection: {
    marginBottom: 20,
  },
  paymentOptions: {
    gap: 16,
  },
  paymentOptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  upiOptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  optionDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'bold',
  },
  qrSection: {
    marginBottom: 20,
  },
  successSection: {
    marginBottom: 20,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 16,
  },
  successText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  amountContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  rupeeSymbol: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  amountInput: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 4,
    padding: 4,
  },
  amountDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  regenerateText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  qrFooter: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  qrInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  qrInfoText: {
    fontSize: 12,
    color: '#1e40af',
    flex: 1,
    lineHeight: 16,
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  qrActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  qrActionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  presetButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  presetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 