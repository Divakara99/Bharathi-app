import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';

// Predefined delivery credentials
const DELIVERY_CREDENTIALS = [
  { username: 'delivery1', password: 'del123', name: 'Ravi Kumar', vehicle: 'Bike-001' },
  { username: 'delivery2', password: 'del456', name: 'Suresh Singh', vehicle: 'Bike-002' },
  { username: 'delivery3', password: 'del789', name: 'Mohan Lal', vehicle: 'Van-001' },
];

export default function DeliveryLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    const user = DELIVERY_CREDENTIALS.find(
      cred => cred.username === username && cred.password === password
    );

    if (user) {
      Alert.alert('Success', `Welcome ${user.name}! Vehicle: ${user.vehicle}. Ready for deliveries!`);
    } else {
      Alert.alert('Error', 'Invalid delivery credentials. Please check the credentials below.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BHARATHI ENTERPRISES</Text>
      <Text style={styles.subtitle}>Delivery Login</Text>
      
      <View style={styles.credentialsBox}>
        <Text style={styles.credentialsTitle}>Delivery Credentials:</Text>
        {DELIVERY_CREDENTIALS.map((cred, index) => (
          <Text key={index} style={styles.credentialText}>
            {cred.username} / {cred.password} ({cred.name} - {cred.vehicle})
          </Text>
        ))}
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Delivery ID"
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
          <Text style={styles.loginButtonText}>Delivery Login</Text>
        </TouchableOpacity>
        
        <View style={styles.registerLinkContainer}>
          <Text style={styles.registerLinkText}>New delivery partner? </Text>
          <Link href="/delivery-register" style={styles.registerLink}>
            <Text style={styles.registerLinkTextBlue}>Register here</Text>
          </Link>
        </View>
        
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
    color: '#28A745',
    marginBottom: 20,
    fontWeight: '600',
  },
  credentialsBox: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28A745',
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
    backgroundColor: '#28A745',
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
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  registerLinkText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    // No additional styles needed
  },
  registerLinkTextBlue: {
    color: '#28A745',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    color: '#28A745',
    fontSize: 16,
  },
}); 