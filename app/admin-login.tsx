import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';

// Predefined admin credentials
const ADMIN_CREDENTIALS = [
  { username: 'admin', password: 'admin123', name: 'Super Admin' },
  { username: 'manager', password: 'manager456', name: 'Store Manager' },
  { username: 'supervisor', password: 'super789', name: 'Supervisor' },
];

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    const user = ADMIN_CREDENTIALS.find(
      cred => cred.username === username && cred.password === password
    );

    if (user) {
      Alert.alert('Success', `Welcome ${user.name}! Admin access granted.`);
    } else {
      Alert.alert('Error', 'Invalid admin credentials. Please check the credentials below.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BHARATHI ENTERPRISES</Text>
      <Text style={styles.subtitle}>Admin Login</Text>
      
      <View style={styles.credentialsBox}>
        <Text style={styles.credentialsTitle}>Admin Credentials:</Text>
        {ADMIN_CREDENTIALS.map((cred, index) => (
          <Text key={index} style={styles.credentialText}>
            {cred.username} / {cred.password} ({cred.name})
          </Text>
        ))}
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Admin Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Admin Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Admin Login</Text>
        </TouchableOpacity>
        
        <Link href="/" style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to Home</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
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
  credentialsBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  credentialText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
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
  loginButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    color: '#FF6B35',
    fontSize: 16,
  },
}); 