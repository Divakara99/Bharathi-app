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

const DEMO_CREDENTIALS = {
  customer: { email: 'customer@quickmart.com', password: 'customer123' },
  admin: { email: 'admin@quickmart.com', password: 'admin123' },
  delivery: { email: 'delivery@quickmart.com', password: 'delivery123' },
};

const ROLE_COLORS = {
  customer: ['#10b981', '#059669'],
  admin: ['#ef4444', '#dc2626'],
  delivery: ['#f59e0b', '#d97706'],
};

const ROLE_ICONS = {
  customer: 'basket',
  admin: 'settings',
  delivery: 'bicycle',
};

export default function LoginScreen() {
  const { role } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleKey = role as keyof typeof DEMO_CREDENTIALS;
  const colors = ROLE_COLORS[roleKey] || ROLE_COLORS.customer;
  const icon = ROLE_ICONS[roleKey] || ROLE_ICONS.customer;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(async () => {
      const credentials = DEMO_CREDENTIALS[roleKey];
      
      if (email === credentials.email && password === credentials.password) {
        // Store user data
        await AsyncStorage.setItem('userRole', roleKey);
        await AsyncStorage.setItem('userEmail', email);
        
        // Navigate to appropriate dashboard
        router.replace(`/(${roleKey})`);
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
      
      setLoading(false);
    }, 1000);
  };

  const fillDemoCredentials = () => {
    const credentials = DEMO_CREDENTIALS[roleKey];
    setEmail(credentials.email);
    setPassword(credentials.password);
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
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Role Selection Menu Bar */}
            <View style={styles.roleMenuBar}>
              <TouchableOpacity 
                style={[styles.roleTab, roleKey === 'customer' && styles.activeRoleTab]}
                onPress={() => router.push('/(auth)/login?role=customer')}
              >
                <Ionicons name="basket" size={18} color={roleKey === 'customer' ? '#1f2937' : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.roleTabText, roleKey === 'customer' && styles.activeRoleTabText]}>
                  Customer
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleTab, roleKey === 'admin' && styles.activeRoleTab]}
                onPress={() => router.push('/(auth)/login?role=admin')}
              >
                <Ionicons name="settings" size={18} color={roleKey === 'admin' ? '#1f2937' : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.roleTabText, roleKey === 'admin' && styles.activeRoleTabText]}>
                  Admin
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleTab, roleKey === 'delivery' && styles.activeRoleTab]}
                onPress={() => router.push('/(auth)/login?role=delivery')}
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
              <Text style={styles.subtitle}>Welcome to BHATHI ENTERPRISES</Text>
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

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Info */}
          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoText}>Email: {DEMO_CREDENTIALS[roleKey].email}</Text>
            <Text style={styles.demoText}>Password: {DEMO_CREDENTIALS[roleKey].password}</Text>
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
}); 