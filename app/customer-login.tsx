import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';

// Predefined customer credentials
const CUSTOMER_CREDENTIALS = [
  { username: 'customer1', password: 'pass123', name: 'Rajesh Kumar' },
  { username: 'customer2', password: 'pass456', name: 'Priya Sharma' },
  { username: 'customer3', password: 'pass789', name: 'Amit Patel' },
];

export default function CustomerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    const user = CUSTOMER_CREDENTIALS.find(
      cred => cred.username === username && cred.password === password
    );

    if (user) {
      Alert.alert('Success', `Welcome ${user.name}! Customer login successful.`);
    } else {
      Alert.alert('Error', 'Invalid username or password. Please check the credentials below.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BHARATHI ENTERPRISES</Text>
      <Text style={styles.subtitle}>Customer Login</Text>
      
      <View style={styles.credentialsBox}>
        <Text style={styles.credentialsTitle}>Test Credentials:</Text>
        {CUSTOMER_CREDENTIALS.map((cred, index) => (
          <Text key={index} style={styles.credentialText}>
            {cred.username} / {cred.password} ({cred.name})
          </Text>
        ))}
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
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
    color: '#007AFF',
    marginBottom: 20,
    fontWeight: '600',
  },
  credentialsBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
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
    backgroundColor: '#007AFF',
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
    color: '#007AFF',
    fontSize: 16,
  },
}); 