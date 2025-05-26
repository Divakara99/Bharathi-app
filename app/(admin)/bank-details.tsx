import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BANK_DETAILS, COMPANY_INFO } from '../../config/auth';

export default function BankDetailsScreen() {
  const [editMode, setEditMode] = useState(false);
  const [bankDetails, setBankDetails] = useState(BANK_DETAILS);

  const handleSave = () => {
    Alert.alert('Success', 'Bank details updated successfully!');
    setEditMode(false);
  };

  const handleShare = async () => {
    try {
      const shareText = `
🏦 BHARATHI ENTERPRISES - Payment Details

💳 Bank Transfer:
Account Name: ${bankDetails.accountName}
Account Number: ${bankDetails.accountNumber}
Bank: ${bankDetails.bankName}
Branch: ${bankDetails.branchName}
IFSC Code: ${bankDetails.ifscCode}

📱 UPI Payments:
UPI ID: ${bankDetails.upiId}
PhonePe: ${bankDetails.phonePayNumber}
Google Pay: ${bankDetails.googlePayNumber}
Paytm: ${bankDetails.paytmNumber}

📞 Contact: ${COMPANY_INFO.phone}
📧 Email: ${COMPANY_INFO.email}
      `;

      await Share.share({
        message: shareText,
        title: 'BHARATHI ENTERPRISES - Payment Details'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    // For web, we'll show an alert with the text
    Alert.alert(`${label} Copied`, text);
  };

  const renderBankField = (label: string, value: string, key: keyof typeof bankDetails, icon: string) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Ionicons name={icon as any} size={20} color="#dc2626" />
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity 
          style={styles.copyButton}
          onPress={() => copyToClipboard(value, label)}
        >
          <Ionicons name="copy" size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
      
      {editMode ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setBankDetails(prev => ({ ...prev, [key]: text }))}
          placeholder={label}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.gradient}>
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
              <Ionicons name="card" size={40} color="white" />
              <Text style={styles.title}>Bank Details</Text>
              <Text style={styles.subtitle}>Payment Collection Information</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setEditMode(!editMode)}
              >
                <Ionicons name={editMode ? "close" : "create"} size={20} color="white" />
                <Text style={styles.actionText}>{editMode ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Ionicons name="share" size={20} color="white" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bank Details Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>🏦 Bank Account Details</Text>
            
            {renderBankField('Account Name', bankDetails.accountName, 'accountName', 'person')}
            {renderBankField('Account Number', bankDetails.accountNumber, 'accountNumber', 'card')}
            {renderBankField('Bank Name', bankDetails.bankName, 'bankName', 'business')}
            {renderBankField('Branch Name', bankDetails.branchName, 'branchName', 'location')}
            {renderBankField('IFSC Code', bankDetails.ifscCode, 'ifscCode', 'code-slash')}
            {renderBankField('Account Type', bankDetails.accountType, 'accountType', 'briefcase')}

            <Text style={styles.sectionTitle}>📱 Digital Payment Options</Text>
            
            {renderBankField('UPI ID', bankDetails.upiId, 'upiId', 'phone-portrait')}
            {renderBankField('PhonePe Number', bankDetails.phonePayNumber, 'phonePayNumber', 'call')}
            {renderBankField('Google Pay Number', bankDetails.googlePayNumber, 'googlePayNumber', 'logo-google')}
            {renderBankField('Paytm Number', bankDetails.paytmNumber, 'paytmNumber', 'wallet')}

            {editMode && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="analytics" size={24} color="#dc2626" />
              <Text style={styles.quickActionTitle}>Payment Analytics</Text>
              <Text style={styles.quickActionDesc}>View payment statistics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="receipt" size={24} color="#dc2626" />
              <Text style={styles.quickActionTitle}>Transaction History</Text>
              <Text style={styles.quickActionDesc}>View all transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="settings" size={24} color="#dc2626" />
              <Text style={styles.quickActionTitle}>Payment Settings</Text>
              <Text style={styles.quickActionDesc}>Configure payment options</Text>
            </TouchableOpacity>
          </View>

          {/* Company Info */}
          <View style={styles.companyInfo}>
            <Text style={styles.sectionTitle}>🏢 Company Information</Text>
            <Text style={styles.companyText}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyText}>{COMPANY_INFO.address}</Text>
            <Text style={styles.companyText}>GST: {COMPANY_INFO.gst}</Text>
            <Text style={styles.companyText}>Phone: {COMPANY_INFO.phone}</Text>
            <Text style={styles.companyText}>Email: {COMPANY_INFO.email}</Text>
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
    marginBottom: 20,
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 10,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  input: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  saveButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  quickActionDesc: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  companyInfo: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  companyText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
}); 