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

export default function CustomerLoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('=== HANDLE LOGIN STARTED ===');
    console.log('Phone Number:', phoneNumber);
    console.log('Password:', password);
    console.log('Current loading state:', loading);
    
    if (!phoneNumber || !password) {
      console.log('ERROR: Missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic phone number validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log('ERROR: Invalid phone number format');
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    console.log('Validation passed, setting loading to true');
    setLoading(true);

    // Simulate API call
    setTimeout(async () => {
      console.log('=== API CALL SIMULATION ===');
      console.log('Checking credentials...');
      console.log('Expected phone: 9876543210');
      console.log('Expected password: customer123');
      console.log('Actual phone:', phoneNumber);
      console.log('Actual password:', password);
      
      if (phoneNumber === '9876543210' && password === 'customer123') {
        console.log('✅ Credentials match! Proceeding with login...');
        try {
          // Store user data
          await AsyncStorage.setItem('userRole', 'customer');
          await AsyncStorage.setItem('userPhone', phoneNumber);
          console.log('✅ Data stored in AsyncStorage');
          
          // Navigate to customer dashboard
          console.log('🚀 Navigating to customer dashboard...');
          router.replace('/(customer)');
        } catch (error) {
          console.error('❌ Error during login process:', error);
          Alert.alert('Error', 'Login failed. Please try again.');
        }
      } else {
        console.log('❌ Credentials do not match!');
        Alert.alert('Error', 'Invalid phone number or password');
      }
      
      console.log('Setting loading to false');
      setLoading(false);
    }, 1000);
  };

  const fillDemoCredentials = () => {
    console.log('Demo credentials button clicked!');
    setPhoneNumber('9876543210');
    setPassword('customer123');
    console.log('Demo credentials filled');
  };

  const testLogin = () => {
    console.log('=== BUTTON CLICKED ===');
    console.log('Phone Number:', phoneNumber);
    console.log('Password:', password);
    console.log('Loading state:', loading);
    
    if (!phoneNumber || !password) {
      console.log('Missing fields detected');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('Calling handleLogin...');
    handleLogin();
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
              <Text style={styles.title}>Customer Login</Text>
              <Text style={styles.subtitle}>Welcome to BHARATHI ENTERPRISES</Text>
              <Text style={styles.tagline}>Shop Fresh Groceries with all Essential Daily Needs</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
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
              style={styles.demoButton}
              onPress={fillDemoCredentials}
            >
              <Text style={styles.demoButtonText}>Use Demo Credentials</Text>
            </TouchableOpacity>

            {/* Main Login Button */}
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 10
              }}
              onPress={() => {
                console.log('🚀 LOGIN BUTTON CLICKED!');
                console.log('Phone:', phoneNumber);
                console.log('Password:', password);
                
                if (phoneNumber === '9876543210' && password === 'customer123') {
                  console.log('✅ Login successful!');
                  router.replace('/(customer)');
                } else {
                  console.log('❌ Wrong credentials');
                  alert('Please use: Phone: 9876543210, Password: customer123');
                }
              }}
            >
              <Text style={{ color: '#059669', fontSize: 18, fontWeight: 'bold' }}>
                🛒 START SHOPPING
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Info */}
          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoText}>Phone: 9876543210</Text>
            <Text style={styles.demoText}>Password: customer123</Text>
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
  demoButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  demoInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
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