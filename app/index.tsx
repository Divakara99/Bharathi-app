import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function LandingScreen() {
  const handleRoleSelection = (role: string) => {
    if (role === 'customer') {
      router.push('/(auth)/customer-login');
    } else if (role === 'admin') {
      router.push('/(auth)/admin-login');
    } else if (role === 'delivery') {
      router.push('/(auth)/delivery-login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="flash" size={40} color="white" />
            <Text style={styles.title}>BHARATHI ENTERPRISES</Text>
            <Text style={styles.subtitle}>30-minute delivery promise</Text>
            
            {/* Hidden Admin/Delivery Access */}
            <View style={styles.hiddenAccessContainer}>
              <TouchableOpacity 
                style={styles.hiddenAccess}
                onPress={() => router.push('/(auth)/admin-login')}
              >
                <Text style={styles.hiddenAccessText}>Admin Access</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.hiddenAccess}
                onPress={() => router.push('/(auth)/delivery-login')}
              >
                <Text style={styles.hiddenAccessText}>Delivery Access</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.roleContainer}>
            <Text style={styles.sectionTitle}>Welcome to Our Store</Text>
            
            <TouchableOpacity 
              style={[styles.roleCard, styles.customerCard]}
              onPress={() => handleRoleSelection('customer')}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.roleGradient}
              >
                <Ionicons name="basket" size={32} color="white" />
                <Text style={styles.roleTitle}>Start Shopping</Text>
                <Text style={styles.roleDescription}>Shop fresh groceries with all essential Daily Needs</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="time" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.featureText}>30-min delivery</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.featureText}>Fresh quality</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.featureText}>Safe delivery</Text>
            </View>
          </View>
        </View>
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
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  roleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  roleGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  customerCard: {},
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  hiddenAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  hiddenAccess: {
    padding: 5,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 5,
  },
  hiddenAccessText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 