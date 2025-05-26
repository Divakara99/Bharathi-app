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
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_CREDENTIALS, APP_CONFIG } from '../../config/auth';

const ROLE_COLORS = {
  customer: ['#10b981', '#059669'] as const,
  admin: ['#ef4444', '#dc2626'] as const,
  delivery: ['#f59e0b', '#d97706'] as const,
};

const ROLE_ICONS = {
  customer: 'basket',
  admin: 'settings',
  delivery: 'bicycle',
};

type UserRole = 'customer' | 'admin' | 'delivery';

export default function LoginScreen() {
  const { role } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleKey = role as UserRole;
  const colors = ROLE_COLORS[roleKey] || ROLE_COLORS.customer;
  const icon = ROLE_ICONS[roleKey] || ROLE_ICONS.customer;

  const authenticateUser = (email: string, password: string, role: string) => {
    if (role === 'admin') {
      const admin = USER_CREDENTIALS.admin;
      return admin.email === email && admin.password === password ? admin : null;
    } else if (role === 'delivery') {
      return USER_CREDENTIALS.delivery.find(
        user => user.email === email && user.password === password
      );
    } else if (role === 'customer') {
      return USER_CREDENTIALS.customers.find(
        user => user.email === email && user.password === password
      );
    }
    return null;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(async () => {
      const user = authenticateUser(email, password, roleKey);
      
      if (user) {
        // Store user data
        await AsyncStorage.setItem('userRole', roleKey);
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userName', user.name);
        await AsyncStorage.setItem('userPhone', user.phone || '');
        await AsyncStorage.setItem('loginTime', new Date().toISOString());
        
        // Navigate to appropriate dashboard
        router.replace(`/(${roleKey})`);
      } else {
        Alert.alert('Error', 'Invalid email or password');
      }
      
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={colors} style={styles.gradient}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              testID="back-button"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Role Selection Menu Bar */}
            <View style={styles.roleMenuBar}>
              <TouchableOpacity 
                style={[styles.roleTab, roleKey === 'customer' && styles.activeRoleTab]}
                onPress={() => router.push('/(auth)/login?role=customer')}
                testID="customer-role-tab"
                activeOpacity={0.7}
              >
                <Ionicons name="basket" size={18} color={roleKey === 'customer' ? '#1f2937' : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.roleTabText, roleKey === 'customer' && styles.activeRoleTabText]}>
                  Customer
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleTab, roleKey === 'admin' && styles.activeRoleTab]}
                onPress={() => router.push('/(auth)/login?role=admin')}
                testID="admin-role-tab"
                activeOpacity={0.7}
              >
                <Ionicons name="settings" size={18} color={roleKey === 'admin' ? '#1f2937' : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.roleTabText, roleKey === 'admin' && styles.activeRoleTabText]}>
                  Admin
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleTab, roleKey === 'delivery' && styles.activeRoleTab]}
                onPress={() => router.push('/(auth)/login?role=delivery')}
                testID="delivery-role-tab"
                activeOpacity={0.7}
              >
                <Ionicons name="bicycle" size={18} color={roleKey === 'delivery' ? '#1f2937' : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.roleTabText, roleKey === 'delivery' && styles.activeRoleTabText]}>
                  Delivery
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerContent}>
              <Ionicons name={icon as any} size={40} color="white" />
              <Text style={styles.title}>
                {roleKey.charAt(0).toUpperCase() + roleKey.slice(1)} Login
              </Text>
              <Text style={styles.subtitle}>Welcome to BHARATHI ENTERPRISES</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Email"
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
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                testID="toggle-password"
                activeOpacity={0.7}
                style={styles.eyeButton}
              >
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
              testID="login-button"
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.securityText}>
              Secure Login - Contact admin for account access
            </Text>
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
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
  roleMenuBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeRoleTab: {
    backgroundColor: 'white',
  },
  roleTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeRoleTabText: {
    color: '#1f2937',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  securityText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 8,
  },
  eyeButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 