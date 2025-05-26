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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BANK_DETAILS, COMPANY_INFO } from '../../config/auth';
import UPIQRCode from '../../components/UPIQRCode';
import { deliveryTimeService, DeliveryTimeCalculation } from '../../services/deliveryTimeService';
import { walletService, CustomerWallet } from '../../services/walletService';

export default function CartScreen() {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'bank' | 'wallet'>('cod');
  const [deliveryAddress, setDeliveryAddress] = useState('Koramangala, Bangalore');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryTimeCalculation | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);

  const cartItems = [
    { id: '1', name: 'Bananas', price: 45, quantity: 2, weight: '1 kg' },
    { id: '2', name: 'Amul Fresh Milk', price: 27, quantity: 1, weight: '500 ml' },
    { id: '3', name: 'Tomatoes', price: 30, quantity: 1, weight: '500 g' },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryCalculation?.deliveryCharges || 0;
  const orderTotal = subtotal + deliveryFee;
  const walletDeduction = useWallet ? Math.min(walletAmount, orderTotal) : 0;
  const remainingAmount = orderTotal - walletDeduction;

  // Mock customer ID - in real app, get from auth context
  const customerId = 'customer_001';

  // Calculate delivery time when component mounts or address changes
  useEffect(() => {
    calculateDeliveryTime();
    loadWallet();
  }, [deliveryAddress]);

  const loadWallet = async () => {
    try {
      const customerWallet = await walletService.getCustomerWallet(customerId);
      setWallet(customerWallet);
      if (customerWallet) {
        setWalletAmount(customerWallet.totalBalance);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const calculateDeliveryTime = async () => {
    if (!deliveryAddress.trim()) return;
    
    setIsCalculating(true);
    setDeliveryError(null);
    
    try {
      const calculation = await deliveryTimeService.calculateDeliveryTime(deliveryAddress, subtotal);
      setDeliveryCalculation(calculation);
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'Unable to calculate delivery time');
      setDeliveryCalculation(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setDeliveryAddress(newAddress);
  };

  const handleAddressSubmit = () => {
    setIsEditingAddress(false);
    if (deliveryAddress.trim()) {
      calculateDeliveryTime();
    }
  };

  const handlePlaceOrder = () => {
    Alert.alert(
      'Order Confirmation',
      'Your order has been placed successfully!',
      [
        {
          text: 'Track Order',
          onPress: () => {
            setOrderPlaced(true);
            router.push('/(customer)/track-order');
          },
        },
        {
          text: 'Continue Shopping',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemImage}>
                <Ionicons name="image" size={40} color="#e5e7eb" />
              </View>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemWeight}>{item.weight}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              
              <View style={styles.quantitySection}>
                <Text style={styles.quantity}>Qty: {item.quantity}</Text>
                <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery Fee
              {deliveryCalculation?.isFreeDelivery && (
                <Text style={styles.freeDeliveryText}> (FREE)</Text>
              )}
            </Text>
            <Text style={[
              styles.summaryValue,
              deliveryCalculation?.isFreeDelivery && styles.strikethrough
            ]}>
              ₹{deliveryCalculation?.deliveryCharges || deliveryFee}
            </Text>
          </View>
          
          {/* Wallet Payment Section */}
          {wallet && wallet.totalBalance > 0 && (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.walletToggle}>
                  <TouchableOpacity 
                    style={styles.walletCheckbox}
                    onPress={() => setUseWallet(!useWallet)}
                  >
                    <Ionicons 
                      name={useWallet ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={useWallet ? "#7c3aed" : "#6b7280"} 
                    />
                    <Text style={styles.walletLabel}>Use Wallet Balance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(customer)/wallet')}>
                    <Text style={styles.walletViewText}>View Wallet</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {useWallet && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Wallet Deduction</Text>
                  <Text style={[styles.summaryValue, styles.walletDeduction]}>
                    -₹{walletDeduction}
                  </Text>
                </View>
              )}
            </>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              {useWallet && walletDeduction > 0 ? 'Remaining Amount' : 'Total'}
            </Text>
            <Text style={styles.totalValue}>₹{useWallet ? remainingAmount : orderTotal}</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.deliverySection}>
          <View style={styles.deliveryHeader}>
            <Ionicons name="location" size={20} color="#7c3aed" />
            <Text style={styles.deliveryTitle}>Delivery Address</Text>
            <TouchableOpacity 
              onPress={() => setIsEditingAddress(!isEditingAddress)}
              style={styles.editAddressButton}
            >
              <Ionicons 
                name={isEditingAddress ? "checkmark" : "create"} 
                size={16} 
                color="#7c3aed" 
              />
            </TouchableOpacity>
          </View>
          
          {isEditingAddress ? (
            <View style={styles.addressInputContainer}>
              <TextInput
                style={styles.addressInput}
                value={deliveryAddress}
                onChangeText={handleAddressChange}
                onSubmitEditing={handleAddressSubmit}
                placeholder="Enter your delivery address"
                multiline
                autoFocus
              />
              <TouchableOpacity 
                onPress={handleAddressSubmit}
                style={styles.addressSubmitButton}
              >
                <Text style={styles.addressSubmitText}>Update</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingAddress(true)}>
              <Text style={styles.deliveryAddress}>{deliveryAddress}</Text>
            </TouchableOpacity>
          )}
          
          {/* Delivery Time Display */}
          {isCalculating ? (
            <View style={styles.calculatingContainer}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.calculatingText}>Calculating delivery time...</Text>
            </View>
          ) : deliveryError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{deliveryError}</Text>
            </View>
          ) : deliveryCalculation ? (
            <View style={styles.deliveryInfoContainer}>
              <View style={styles.deliveryTimeRow}>
                <Ionicons name="time" size={16} color="#10b981" />
                <Text style={styles.deliveryTime}>
                  Estimated delivery: {deliveryTimeService.formatDeliveryTime(deliveryCalculation)}
                </Text>
              </View>
              
              {deliveryCalculation.isFreeDelivery ? (
                <View style={styles.freeDeliveryBadge}>
                  <Ionicons name="gift" size={14} color="#10b981" />
                  <Text style={styles.freeDeliveryText}>Free delivery on this order!</Text>
                </View>
              ) : (
                <View style={styles.deliveryChargeBadge}>
                  <Ionicons name="cash" size={14} color="#f59e0b" />
                  <Text style={styles.deliveryChargeText}>
                    ₹{deliveryCalculation.deliveryCharges} delivery charge
                  </Text>
                </View>
              )}
              
              <Text style={styles.deliveryDetails}>
                Base time: {deliveryCalculation.baseTime} mins + {deliveryCalculation.additionalTime} mins for {deliveryCalculation.distance.toFixed(1)}km
              </Text>
              
              {subtotal >= 2000 ? (
                <Text style={styles.globalFreeText}>
                  🎉 Free delivery for orders above ₹2000!
                </Text>
              ) : deliveryCalculation.distance <= 5 && subtotal < 200 ? (
                <Text style={styles.upgradeText}>
                  💡 Add ₹{200 - subtotal} more for free delivery within 5km
                </Text>
              ) : deliveryCalculation.distance <= 10 && subtotal < 500 ? (
                <Text style={styles.upgradeText}>
                  💡 Add ₹{500 - subtotal} more for free delivery within 10km
                </Text>
              ) : subtotal < 2000 ? (
                <Text style={styles.upgradeText}>
                  💡 Add ₹{2000 - subtotal} more for free delivery to any location
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.deliveryTime}>Enter address to calculate delivery time</Text>
          )}
        </View>

        {/* Payment Method Selection */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <Ionicons name="card" size={20} color="#7c3aed" />
            <Text style={styles.paymentTitle}>Payment Method</Text>
          </View>
          
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'cod' && styles.selectedOption]}
              onPress={() => setPaymentMethod('cod')}
            >
              <Ionicons name="cash" size={20} color={paymentMethod === 'cod' ? '#7c3aed' : '#6b7280'} />
              <Text style={[styles.optionText, paymentMethod === 'cod' && styles.selectedText]}>
                Cash on Delivery
              </Text>
              {paymentMethod === 'cod' && <Ionicons name="checkmark-circle" size={20} color="#7c3aed" />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'upi' && styles.selectedOption]}
              onPress={() => setPaymentMethod('upi')}
            >
              <Ionicons name="qr-code" size={20} color={paymentMethod === 'upi' ? '#7c3aed' : '#6b7280'} />
              <Text style={[styles.optionText, paymentMethod === 'upi' && styles.selectedText]}>
                UPI Payment
              </Text>
              {paymentMethod === 'upi' && <Ionicons name="checkmark-circle" size={20} color="#7c3aed" />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'bank' && styles.selectedOption]}
              onPress={() => setPaymentMethod('bank')}
            >
              <Ionicons name="card" size={20} color={paymentMethod === 'bank' ? '#7c3aed' : '#6b7280'} />
              <Text style={[styles.optionText, paymentMethod === 'bank' && styles.selectedText]}>
                Bank Transfer
              </Text>
              {paymentMethod === 'bank' && <Ionicons name="checkmark-circle" size={20} color="#7c3aed" />}
            </TouchableOpacity>
          </View>

          {/* UPI QR Code */}
          {paymentMethod === 'upi' && (
            <View style={styles.qrCodeSection}>
              <UPIQRCode 
                amount={useWallet ? remainingAmount : orderTotal}
                orderId="BH2024001"
                customerName="Customer"
                onPaymentComplete={() => {
                  Alert.alert('Payment Confirmed', 'Thank you! Your payment has been received.');
                }}
              />
            </View>
          )}

          {/* Bank Transfer Details */}
          {paymentMethod === 'bank' && (
            <View style={styles.paymentMethods}>
              <Text style={styles.paymentSubtitle}>💳 Bank Transfer Details</Text>
              <View style={styles.bankDetails}>
                <Text style={styles.bankText}>Account: {BANK_DETAILS.accountName}</Text>
                <Text style={styles.bankText}>Number: {BANK_DETAILS.accountNumber}</Text>
                <Text style={styles.bankText}>IFSC: {BANK_DETAILS.ifscCode}</Text>
                <Text style={styles.bankText}>Bank: {BANK_DETAILS.bankName}</Text>
              </View>
              
              <View style={styles.paymentNote}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={styles.noteText}>
                  Please transfer ₹{useWallet ? remainingAmount : orderTotal} and share payment screenshot with us
                </Text>
              </View>
            </View>
          )}

          {/* Cash on Delivery Info */}
          {paymentMethod === 'cod' && (
            <View style={styles.codInfo}>
              <View style={styles.codHeader}>
                <Ionicons name="cash" size={24} color="#10b981" />
                <Text style={styles.codTitle}>Cash on Delivery</Text>
              </View>
              <Text style={styles.codText}>Pay ₹{useWallet ? remainingAmount : orderTotal} when your order arrives</Text>
              <Text style={styles.codSubtext}>Our delivery partner will collect the payment</Text>
              
              <View style={styles.codNote}>
                <Ionicons name="information-circle" size={16} color="#3b82f6" />
                <Text style={styles.codNoteText}>
                  You can also pay via UPI to our delivery partner using the QR code they'll show
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Order Button */}
      <View style={styles.orderSection}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handlePlaceOrder}
        >
          <LinearGradient 
            colors={['#7c3aed', '#a855f7']} 
            style={styles.orderGradient}
          >
            <Text style={styles.orderButtonText}>
              {paymentMethod === 'cod' ? 'Place Order (COD)' : 
               paymentMethod === 'upi' ? 'Place Order (UPI)' : 
               paymentMethod === 'wallet' ? 'Place Order (Wallet)' :
               'Place Order (Bank)'} - ₹{useWallet ? remainingAmount : orderTotal}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => router.push('/(customer)/track-order')}
        >
          <View style={styles.trackButtonContent}>
            <Ionicons name="location" size={18} color="#7c3aed" />
            <Text style={styles.trackButtonText}>Track Previous Order</Text>
          </View>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  itemsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemWeight: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  quantitySection: {
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summarySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  deliverySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  orderSection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderButton: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 12,
  },
  orderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trackButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
  },
  trackButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  bankDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bankText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  upiDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  upiText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    lineHeight: 16,
  },
  paymentOptions: {
    gap: 12,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  selectedOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#7c3aed',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  selectedText: {
    color: '#7c3aed',
  },
  qrCodeSection: {
    marginTop: 16,
  },
  codInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  codHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  codTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  codText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 4,
  },
  codSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  codNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  codNoteText: {
    fontSize: 12,
    color: '#1e40af',
    flex: 1,
    lineHeight: 16,
  },
  // New styles for delivery time calculation
  freeDeliveryText: {
    color: '#10b981',
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  editAddressButton: {
    padding: 4,
  },
  addressInputContainer: {
    marginBottom: 12,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: 'white',
    marginBottom: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addressSubmitButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
  },
  addressSubmitText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  calculatingText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },
  deliveryInfoContainer: {
    marginTop: 8,
    gap: 6,
  },
  deliveryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  deliveryDetails: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  deliveryChargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  deliveryChargeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  globalFreeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  upgradeText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Wallet styles
  walletToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  walletCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  walletViewText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  walletDeduction: {
    color: '#10b981',
    fontWeight: '600',
  },
}); 