import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    employeeId: '',
    username: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = () => {
    // Validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.username || !formData.password || !formData.adminCode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Admin code validation (simple security check)
    if (formData.adminCode !== 'BHARATHI2024') {
      Alert.alert('Error', 'Invalid admin registration code. Please contact your supervisor.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Success message
    Alert.alert(
      'Admin Registration Successful!', 
      `Welcome ${formData.fullName}! Your admin account has been created successfully.\n\nUsername: ${formData.username}\nDepartment: ${formData.department}\n\nYou can now login with your credentials.`,
      [
        {
          text: 'Go to Login',
          onPress: () => {
            Alert.alert('Info', 'Please use the admin login screen with your new credentials');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>BHARATHI ENTERPRISES</Text>
        <Text style={styles.subtitle}>Admin Registration</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Admin Code Required: BHARATHI2024</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email Address *"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Department"
            value={formData.department}
            onChangeText={(value) => handleInputChange('department', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Employee ID"
            value={formData.employeeId}
            onChangeText={(value) => handleInputChange('employeeId', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Choose Username *"
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters) *"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Admin Registration Code *"
            value={formData.adminCode}
            onChangeText={(value) => handleInputChange('adminCode', value)}
            autoCapitalize="characters"
          />
          
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Create Admin Account</Text>
          </TouchableOpacity>
          
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Link href="/admin-login" style={styles.loginLink}>
              <Text style={styles.loginLinkTextBlue}>Login here</Text>
            </Link>
          </View>
          
          <Link href="/" style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to Home</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    minHeight: '100%',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#FF6B35',
    marginBottom: 20,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    // No additional styles needed
  },
  loginLinkTextBlue: {
    color: '#FF6B35',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    color: '#FF6B35',
    fontSize: 16,
  },
}); 