import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
  isActive: boolean;
  isMainAdmin?: boolean;
}

export default function UserManagementScreen() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      // Load existing admin accounts
      const existingAdmins = await AsyncStorage.getItem('adminAccounts');
      const adminList = existingAdmins ? JSON.parse(existingAdmins) : [];
      
      // Add main admin to the list
      const mainAdmin: AdminUser = {
        id: 'MAIN_ADMIN',
        name: 'Main Administrator',
        email: 'admin@bharathienterprises.com',
        role: 'Main Admin',
        permissions: ['all'],
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true,
        isMainAdmin: true,
      };

      setAdminUsers([mainAdmin, ...adminList]);
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleAddAdmin = async () => {
    // Validation
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !newAdmin.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(newAdmin.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(newAdmin.password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Check if email already exists
    const emailExists = adminUsers.some(admin => admin.email.toLowerCase() === newAdmin.email.toLowerCase());
    if (emailExists) {
      Alert.alert('Error', 'An admin with this email already exists');
      return;
    }

    setLoading(true);

    try {
      // Get existing admins from storage
      const existingAdmins = await AsyncStorage.getItem('adminAccounts');
      const adminList = existingAdmins ? JSON.parse(existingAdmins) : [];

      // Create new admin
      const adminToAdd: AdminUser = {
        id: `ADMIN${String(adminList.length + 1).padStart(3, '0')}`,
        name: newAdmin.name,
        email: newAdmin.email.toLowerCase(),
        role: 'Admin',
        permissions: ['products', 'orders', 'analytics'],
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      // Add password (in production, this should be hashed)
      const adminWithPassword = { ...adminToAdd, password: newAdmin.password };

      // Update storage
      adminList.push(adminWithPassword);
      await AsyncStorage.setItem('adminAccounts', JSON.stringify(adminList));

      // Update local state
      setAdminUsers(prev => [...prev, adminToAdd]);

      // Reset form
      setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
      setShowAddModal(false);

      Alert.alert('Success', `Admin ${newAdmin.name} has been added successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add admin. Please try again.');
    }

    setLoading(false);
  };

  const handleToggleStatus = async (adminId: string) => {
    if (adminId === 'MAIN_ADMIN') {
      Alert.alert('Error', 'Cannot deactivate the main admin account');
      return;
    }

    try {
      const existingAdmins = await AsyncStorage.getItem('adminAccounts');
      const adminList = existingAdmins ? JSON.parse(existingAdmins) : [];
      
      const updatedList = adminList.map((admin: any) => {
        if (admin.id === adminId) {
          return { ...admin, isActive: !admin.isActive };
        }
        return admin;
      });

      await AsyncStorage.setItem('adminAccounts', JSON.stringify(updatedList));
      
      setAdminUsers(prev => prev.map(admin => {
        if (admin.id === adminId) {
          return { ...admin, isActive: !admin.isActive };
        }
        return admin;
      }));

      Alert.alert('Success', 'Admin status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update admin status');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (adminId === 'MAIN_ADMIN') {
      Alert.alert('Error', 'Cannot delete the main admin account');
      return;
    }

    Alert.alert(
      'Delete Admin',
      'Are you sure you want to delete this admin? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const existingAdmins = await AsyncStorage.getItem('adminAccounts');
              const adminList = existingAdmins ? JSON.parse(existingAdmins) : [];
              
              const updatedList = adminList.filter((admin: any) => admin.id !== adminId);
              await AsyncStorage.setItem('adminAccounts', JSON.stringify(updatedList));
              
              setAdminUsers(prev => prev.filter(admin => admin.id !== adminId));
              
              Alert.alert('Success', 'Admin deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete admin');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Management</Text>
          <TouchableOpacity 
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
          >
            <Ionicons name="person-add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Admin List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Users ({adminUsers.length})</Text>
          
          {adminUsers.map((admin) => (
            <View key={admin.id} style={styles.adminCard}>
              <View style={styles.adminInfo}>
                <View style={styles.adminHeader}>
                  <View style={styles.adminDetails}>
                    <Text style={styles.adminName}>{admin.name}</Text>
                    <Text style={styles.adminEmail}>{admin.email}</Text>
                    <Text style={styles.adminRole}>{admin.role}</Text>
                  </View>
                  <View style={styles.adminStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: admin.isActive ? '#10b981' : '#ef4444' }
                    ]}>
                      <Text style={styles.statusText}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.adminMeta}>
                  <Text style={styles.metaText}>
                    ID: {admin.id} • Created: {new Date(admin.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.permissionsText}>
                    Permissions: {admin.permissions.join(', ')}
                  </Text>
                </View>
              </View>

              {!admin.isMainAdmin && (
                <View style={styles.adminActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => handleToggleStatus(admin.id)}
                  >
                    <Ionicons 
                      name={admin.isActive ? "pause" : "play"} 
                      size={16} 
                      color="white" 
                    />
                    <Text style={styles.actionButtonText}>
                      {admin.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAdmin(admin.id)}
                  >
                    <Ionicons name="trash" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Admin Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity 
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Admin</Text>
              <View style={styles.placeholder} />
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.name}
                  onChangeText={(text) => setNewAdmin(prev => ({ ...prev, name: text }))}
                  placeholder="Enter admin's full name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.email}
                  onChangeText={(text) => setNewAdmin(prev => ({ ...prev, email: text }))}
                  placeholder="Enter admin's email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.password}
                  onChangeText={(text) => setNewAdmin(prev => ({ ...prev, password: text }))}
                  placeholder="Enter password (min 8 characters)"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.confirmPassword}
                  onChangeText={(text) => setNewAdmin(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm password"
                  secureTextEntry
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                  New admins will have access to products, orders, and analytics. 
                  They cannot manage other users or system settings.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddAdmin}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding Admin...' : 'Add Admin'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  adminCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminInfo: {
    marginBottom: 12,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  adminRole: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  adminStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  adminMeta: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  permissionsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  toggleButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
  },
  submitButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 