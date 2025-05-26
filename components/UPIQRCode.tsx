import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { BANK_DETAILS, COMPANY_INFO } from '../config/auth';

interface UPIQRCodeProps {
  amount: number;
  orderId?: string;
  customerName?: string;
  onPaymentComplete?: () => void;
}

export default function UPIQRCode({ amount, orderId, customerName, onPaymentComplete }: UPIQRCodeProps) {
  // Generate UPI payment URL
  const generateUPIURL = () => {
    const upiId = BANK_DETAILS.upiId;
    const merchantName = COMPANY_INFO.name;
    const transactionNote = orderId ? `Order ${orderId}` : 'Payment';
    
    // UPI URL format: upi://pay?pa=UPI_ID&pn=MERCHANT_NAME&am=AMOUNT&tn=TRANSACTION_NOTE&cu=INR
    const upiURL = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;
    
    return upiURL;
  };

  const handleShare = async () => {
    try {
      const upiURL = generateUPIURL();
      const shareText = `
🏦 BHARATHI ENTERPRISES - UPI Payment

💰 Amount: ₹${amount}
${orderId ? `📦 Order ID: ${orderId}` : ''}
${customerName ? `👤 Customer: ${customerName}` : ''}

📱 Pay using UPI:
${upiURL}

Or scan the QR code to pay instantly!

📞 Contact: ${COMPANY_INFO.phone}
📧 Email: ${COMPANY_INFO.email}
      `;

      await Share.share({
        message: shareText,
        title: 'UPI Payment - BHARATHI ENTERPRISES'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePaymentInstructions = () => {
    Alert.alert(
      'UPI Payment Instructions',
      `1. Scan the QR code with any UPI app (PhonePe, Google Pay, Paytm, etc.)\n\n2. Verify the amount: ₹${amount}\n\n3. Complete the payment\n\n4. Share the payment screenshot with us\n\nUPI ID: ${BANK_DETAILS.upiId}`,
      [
        { text: 'Got it!', style: 'default' },
        { text: 'Share QR', onPress: handleShare }
      ]
    );
  };

  const upiURL = generateUPIURL();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="qr-code" size={24} color="#7c3aed" />
        <Text style={styles.title}>UPI QR Code Payment</Text>
      </View>

      <View style={styles.qrContainer}>
        <QRCode
          value={upiURL}
          size={200}
          color="#1f2937"
          backgroundColor="white"
          logo={require('../assets/images/icon.png')}
          logoSize={40}
          logoBackgroundColor="white"
          logoMargin={2}
          logoBorderRadius={20}
        />
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amount}>₹{amount}</Text>
        
        {orderId && (
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Order ID: {orderId}</Text>
          </View>
        )}

        <View style={styles.merchantInfo}>
          <Text style={styles.merchantName}>{COMPANY_INFO.name}</Text>
          <Text style={styles.upiId}>UPI ID: {BANK_DETAILS.upiId}</Text>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to Pay:</Text>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Open any UPI app (PhonePe, Google Pay, Paytm)</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Scan this QR code</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Verify amount and complete payment</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>4</Text>
          <Text style={styles.stepText}>Share payment screenshot with us</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePaymentInstructions}>
          <Ionicons name="help-circle" size={20} color="#7c3aed" />
          <Text style={styles.actionText}>Instructions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share" size={20} color="#7c3aed" />
          <Text style={styles.actionText}>Share QR</Text>
        </TouchableOpacity>

        {onPaymentComplete && (
          <TouchableOpacity style={styles.primaryButton} onPress={onPaymentComplete}>
            <Text style={styles.primaryButtonText}>Payment Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.alternativePayment}>
        <Text style={styles.alternativeTitle}>Alternative Payment Methods:</Text>
        <Text style={styles.alternativeText}>PhonePe: {BANK_DETAILS.phonePayNumber}</Text>
        <Text style={styles.alternativeText}>Google Pay: {BANK_DETAILS.googlePayNumber}</Text>
        <Text style={styles.alternativeText}>Paytm: {BANK_DETAILS.paytmNumber}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  paymentInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 12,
  },
  orderInfo: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  merchantInfo: {
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  upiId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  instructions: {
    width: '100%',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alternativePayment: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
}); 