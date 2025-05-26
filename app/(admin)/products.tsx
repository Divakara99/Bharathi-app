import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: 'active' | 'inactive' | 'out-of-stock';
  image?: string;
  description?: string;
  weight?: string;
  discount?: number;
}

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Fresh Bananas',
      category: 'Fruits',
      price: 45,
      originalPrice: 60,
      stock: 150,
      status: 'active',
      weight: '1 kg',
      description: 'Fresh yellow bananas, rich in potassium',
      discount: 25,
    },
    {
      id: 'P002',
      name: 'Amul Fresh Milk',
      category: 'Dairy',
      price: 27,
      stock: 80,
      status: 'active',
      weight: '500 ml',
      description: 'Fresh full cream milk from Amul',
    },
    {
      id: 'P003',
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      price: 30,
      originalPrice: 40,
      stock: 0,
      status: 'out-of-stock',
      weight: '500 g',
      description: 'Fresh red tomatoes, perfect for cooking',
      discount: 25,
    },
    {
      id: 'P004',
      name: 'Basmati Rice',
      category: 'Grains',
      price: 120,
      stock: 45,
      status: 'active',
      weight: '1 kg',
      description: 'Premium quality basmati rice',
    },
    {
      id: 'P005',
      name: 'Organic Apples',
      category: 'Fruits',
      price: 180,
      stock: 25,
      status: 'active',
      weight: '1 kg',
      description: 'Organic red apples, pesticide-free',
    },
  ]);

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: '',
    weight: '',
    description: '',
    image: '',
  });

  // Categories for dropdown
  const categories = [
    'Fruits', 'Vegetables', 'Dairy', 'Grains', 'Meat & Fish', 
    'Beverages', 'Snacks', 'Packaged Food', 'Instant Food'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'out-of-stock': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'out-of-stock': return 'Out of Stock';
      default: return status;
    }
  };

  const handleProductAction = (productId: string, action: string) => {
    if (action === 'Update Stock') {
      handleUpdateStock(productId);
      return;
    }

    if (action === 'Edit') {
      Alert.alert('Edit Product', 'Edit product feature will be implemented soon!');
      return;
    }

    Alert.alert(
      'Product Action',
      `${action} product ${productId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            if (action === 'Activate' || action === 'Deactivate') {
              const newStatus = action === 'Activate' ? 'active' : 'inactive';
              setProducts(prev => prev.map(product => 
                product.id === productId ? { ...product, status: newStatus } : product
              ));
            }
            Alert.alert('Success', `Product ${productId} has been ${action.toLowerCase()}`);
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewProduct(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const productId = `P${String(products.length + 1).padStart(3, '0')}`;
    const discount = newProduct.originalPrice && newProduct.price ? 
      Math.round(((parseFloat(newProduct.originalPrice) - parseFloat(newProduct.price)) / parseFloat(newProduct.originalPrice)) * 100) : 0;

    const product: Product = {
      id: productId,
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : undefined,
      stock: parseInt(newProduct.stock),
      status: 'active',
      weight: newProduct.weight,
      description: newProduct.description,
      image: newProduct.image,
      discount: discount > 0 ? discount : undefined,
    };

    setProducts(prev => [...prev, product]);
    setNewProduct({
      name: '',
      category: '',
      price: '',
      originalPrice: '',
      stock: '',
      weight: '',
      description: '',
      image: '',
    });
    setShowAddModal(false);
    Alert.alert('Success', 'Product added successfully!');
  };

  const handleUpdateStock = (productId: string) => {
    Alert.prompt(
      'Update Stock',
      'Enter new stock quantity:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (value) => {
            if (value && !isNaN(parseInt(value))) {
              setProducts(prev => prev.map(product => 
                product.id === productId 
                  ? { ...product, stock: parseInt(value), status: parseInt(value) > 0 ? 'active' : 'out-of-stock' }
                  : product
              ));
              Alert.alert('Success', 'Stock updated successfully!');
            } else {
              Alert.alert('Error', 'Please enter a valid number');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Ionicons name="cube" size={28} color="white" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Product Management</Text>
              <Text style={styles.headerSubtitle}>{products.length} products</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Products List */}
      <ScrollView style={styles.productsContainer} showsVerticalScrollIndicator={false}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={styles.productImageContainer}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="image" size={40} color="#9ca3af" />
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productIdText}>#{product.id}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.categoryText}>{product.category}</Text>
                {product.weight && (
                  <Text style={styles.weightText}>{product.weight}</Text>
                )}
                {product.description && (
                  <Text style={styles.descriptionText} numberOfLines={2}>{product.description}</Text>
                )}
              </View>
              <View style={styles.productPrice}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>₹{product.price}</Text>
                  {product.originalPrice && (
                    <Text style={styles.originalPriceText}>₹{product.originalPrice}</Text>
                  )}
                </View>
                {product.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{product.discount}% OFF</Text>
                  </View>
                )}
                <Text style={styles.stockText}>Stock: {product.stock}</Text>
              </View>
            </View>
            
            <View style={styles.productStatus}>
              <View style={styles.statusContainer}>
                <View 
                  style={[
                    styles.statusDot, 
                    { backgroundColor: getStatusColor(product.status) }
                  ]} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(product.status) }]}>
                  {getStatusText(product.status)}
                </Text>
              </View>
              
              <View style={styles.stockIndicator}>
                {product.stock < 20 && product.stock > 0 && (
                  <View style={styles.lowStockWarning}>
                    <Ionicons name="warning" size={12} color="#f59e0b" />
                    <Text style={styles.lowStockText}>Low Stock</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.productActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleProductAction(product.id, 'Edit')}
              >
                <Ionicons name="pencil" size={16} color="white" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.stockButton]}
                onPress={() => handleProductAction(product.id, 'Update Stock')}
              >
                <Ionicons name="cube" size={16} color="white" />
                <Text style={styles.actionButtonText}>Stock</Text>
              </TouchableOpacity>
              
              {product.status === 'active' ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deactivateButton]}
                  onPress={() => handleProductAction(product.id, 'Deactivate')}
                >
                  <Ionicons name="pause" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Deactivate</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.activateButton]}
                  onPress={() => handleProductAction(product.id, 'Activate')}
                >
                  <Ionicons name="play" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Activate</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleProductAction(product.id, 'Delete')}
              >
                <Ionicons name="trash" size={16} color="white" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <TouchableOpacity onPress={handleSaveProduct}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Image Picker */}
            <View style={styles.imageSection}>
              <Text style={styles.sectionLabel}>Product Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={handleImagePicker}>
                {newProduct.image ? (
                  <Image source={{ uri: newProduct.image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="camera" size={40} color="#9ca3af" />
                    <Text style={styles.imagePickerText}>Tap to add image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Product Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newProduct.name}
                onChangeText={(text) => setNewProduct(prev => ({ ...prev, name: text }))}
                placeholder="Enter product name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Category */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      newProduct.category === category && styles.selectedCategoryChip
                    ]}
                    onPress={() => setNewProduct(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      newProduct.category === category && styles.selectedCategoryChipText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Price */}
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Price *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newProduct.price}
                  onChangeText={(text) => setNewProduct(prev => ({ ...prev, price: text }))}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Original Price</Text>
                <TextInput
                  style={styles.textInput}
                  value={newProduct.originalPrice}
                  onChangeText={(text) => setNewProduct(prev => ({ ...prev, originalPrice: text }))}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Stock and Weight */}
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newProduct.stock}
                  onChangeText={(text) => setNewProduct(prev => ({ ...prev, stock: text }))}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Weight/Size</Text>
                <TextInput
                  style={styles.textInput}
                  value={newProduct.weight}
                  onChangeText={(text) => setNewProduct(prev => ({ ...prev, weight: text }))}
                  placeholder="1 kg, 500 ml, etc."
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newProduct.description}
                onChangeText={(text) => setNewProduct(prev => ({ ...prev, description: text }))}
                placeholder="Enter product description"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
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
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  productsContainer: {
    flex: 1,
    padding: 20,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productIdText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
  },
  productPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  stockText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  productStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  lowStockText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  stockButton: {
    backgroundColor: '#10b981',
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  deactivateButton: {
    backgroundColor: '#6b7280',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  // New styles for enhanced product management
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPriceText: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  discountBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  selectedImage: {
    width: 116,
    height: 116,
    borderRadius: 10,
  },
  imagePickerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#ef4444',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 