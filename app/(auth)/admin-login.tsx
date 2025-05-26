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

export default function AdminLoginScreen() {
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

    // Simulate API call
    setTimeout(async () => {
      try {
        let adminFound = false;
        let adminName = '';

        // Check registered admins first
        const existingAdmins = await AsyncStorage.getItem('adminAccounts');
        if (existingAdmins) {
          const adminList = JSON.parse(existingAdmins);
          const registeredAdmin = adminList.find(
            (admin: any) => admin.email === email.toLowerCase() && admin.password === password && admin.isActive
          );
          
          if (registeredAdmin) {
            adminFound = true;
            adminName = registeredAdmin.name;
          }
        }

        // Fallback to default admin credentials
        if (!adminFound) {
          const admin = USER_CREDENTIALS.admin;
          if (email === admin.email && password === admin.password) {
            adminFound = true;
            adminName = admin.name;
          }
        }

        if (adminFound) {
          // Store user data
          await AsyncStorage.setItem('userRole', 'admin');
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('userName', adminName);
          await AsyncStorage.setItem('loginTime', new Date().toISOString());
          
          // Navigate to admin dashboard
          router.replace('/(admin)');
        } else {
          Alert.alert('Error', 'Invalid admin credentials');
        }
      } catch (error) {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
      
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.gradient}>
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
                <Ionicons name="shield-checkmark" size={50} color="white" />
              </View>
              <Text style={styles.title}>Admin Portal</Text>
              <Text style={styles.subtitle}>BHARATHI ENTERPRISES</Text>
              <Text style={styles.tagline}>Secure Administrative Access</Text>
              
              {/* Security Notice */}
              <View style={styles.securityNotice}>
                <Ionicons name="warning" size={16} color="#dc2626" />
                <Text style={styles.securityText}>Authorized Access Only</Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Admin Email"
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
                {loading ? 'Authenticating...' : 'Access Dashboard'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Admin Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="analytics" size={20} color="white" />
              <Text style={styles.featureText}>Analytics</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="people" size={20} color="white" />
              <Text style={styles.featureText}>User Management</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="settings" size={20} color="white" />
              <Text style={styles.featureText}>System Control</Text>
            </View>
          </View>





          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Need Help?</Text>
            <Text style={styles.contactText}>Contact: admin@bharathienterprises.com</Text>
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
    fontWeight: '600',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  securityText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  contactInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  contactTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactText: {
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