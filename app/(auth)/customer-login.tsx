import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_CREDENTIALS } from '../../config/auth';

export default function CustomerLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    console.log('Login attempt:', { email, password: '***' });

    // Simulate API call
    setTimeout(async () => {
      try {
        const customer = USER_CREDENTIALS.customers.find(
          user => user.email === email && user.password === password
        );
        
        console.log('Customer found:', customer ? 'Yes' : 'No');
        
        if (customer) {
          // Store user data
          await AsyncStorage.setItem('userRole', 'customer');
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('userName', customer.name);
          await AsyncStorage.setItem('userPhone', customer.phone);
          await AsyncStorage.setItem('userAddress', customer.address);
          await AsyncStorage.setItem('loginTime', new Date().toISOString());
          
          console.log('User data stored, navigating to dashboard...');
          
          // Navigate to customer dashboard
          router.replace('/(customer)');
        } else {
          console.log('Login failed - invalid credentials');
          Alert.alert('Error', 'Invalid email or password');
        }
      } catch (error) {
        console.error('Login error:', error);
        Alert.alert('Error', 'Login failed. Please try again.');
      }
      
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#10b981', '#059669']} style={styles.gradient}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="basket" size={50} color="white" />
              </View>
              <Text style={styles.title}>Customer Portal</Text>
              <Text style={styles.subtitle}>BHARATHI ENTERPRISES</Text>
              <Text style={styles.tagline}>Your Shopping Experience</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="rgba(255,255,255,0.7)" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Start Shopping'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="storefront" size={20} color="white" />
              <Text style={styles.featureText}>Browse Products</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.featureText}>Easy Payments</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="bicycle" size={20} color="white" />
              <Text style={styles.featureText}>Fast Delivery</Text>
            </View>
          </View>



          {/* Registration Info */}
          <View style={styles.registrationInfo}>
            <Text style={styles.registrationTitle}>New Customer?</Text>
            <Text style={styles.registrationText}>Contact us to create your account</Text>
            <Text style={styles.registrationText}>📞 +91 80 1234 5678</Text>
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
  },
  header: {
    paddingTop: 20,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  loginButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  loginButtonText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: 'bold'
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  registrationInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  registrationTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  registrationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  demoInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  demoTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  demoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
}); 