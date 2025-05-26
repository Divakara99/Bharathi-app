import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  inStock: boolean;
  deliveryTime: string;
  weight: string;
  discount?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function CustomerHome() {
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories: Category[] = [
    { id: '1', name: 'Vegetables & Fruits', icon: 'leaf', color: '#00b894' },
    { id: '2', name: 'Dairy & Bakery', icon: 'nutrition', color: '#6c5ce7' },
    { id: '3', name: 'Meat & Fish', icon: 'restaurant', color: '#fd79a8' },
    { id: '4', name: 'Atta, Rice & Dal', icon: 'layers', color: '#fdcb6e' },
    { id: '5', name: 'Packaged Food', icon: 'cube', color: '#e17055' },
    { id: '6', name: 'Instant Food', icon: 'fast-food', color: '#00cec9' },
    { id: '7', name: 'Cold Drinks', icon: 'wine', color: '#74b9ff' },
    { id: '8', name: 'Sweet Cravings', icon: 'heart', color: '#fd79a8' },
  ];

  const featuredProducts: Product[] = [
    {
      id: '1',
      name: 'Bananas',
      price: 45,
      originalPrice: 60,
      category: 'Fruits',
      inStock: true,
      deliveryTime: '8 mins',
      weight: '1 kg',
      discount: 25,
    },
    {
      id: '2',
      name: 'Amul Fresh Milk',
      price: 27,
      category: 'Dairy',
      inStock: true,
      deliveryTime: '6 mins',
      weight: '500 ml',
    },
    {
      id: '3',
      name: 'Tomatoes',
      price: 30,
      originalPrice: 40,
      category: 'Vegetables',
      inStock: true,
      deliveryTime: '7 mins',
      weight: '500 g',
      discount: 25,
    },
    {
      id: '4',
      name: 'Chicken Curry Cut',
      price: 159,
      category: 'Meat',
      inStock: true,
      deliveryTime: '15 mins',
      weight: '500 g',
    },
    {
      id: '5',
      name: 'Coca Cola',
      price: 40,
      originalPrice: 45,
      category: 'Beverages',
      inStock: true,
      deliveryTime: '5 mins',
      weight: '600 ml',
      discount: 11,
    },
    {
      id: '6',
      name: 'Lays Classic',
      price: 20,
      category: 'Snacks',
      inStock: true,
      deliveryTime: '3 mins',
      weight: '52 g',
    },
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/');
          },
        },
      ]
    );
  };

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => router.push(`/(customer)/search?category=${item.name}`)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={20} color="white" />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      {item.discount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}% OFF</Text>
        </View>
      )}
      
      <View style={styles.productImage}>
        <Ionicons name="image" size={60} color="#e5e7eb" />
      </View>
      
      <View style={styles.deliveryTime}>
        <Ionicons name="flash" size={10} color="#7c3aed" />
        <Text style={styles.deliveryText}>{item.deliveryTime}</Text>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productWeight}>{item.weight}</Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            )}
          </View>
          
          {cart[item.id] ? (
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => removeFromCart(item.id)}
              >
                <Ionicons name="remove" size={14} color="#7c3aed" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{cart[item.id]}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => addToCart(item.id)}
              >
                <Ionicons name="add" size={14} color="#7c3aed" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addToCart(item.id)}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <View style={styles.locationInfo}>
            <Text style={styles.deliveryLabel}>Delivery in 30 mins</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#7c3aed" />
              <Text style={styles.locationText}>Koramangala, Bangalore</Text>
              <Ionicons name="chevron-down" size={16} color="#7c3aed" />
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.profileButton}>
            <Ionicons name="person-circle" size={28} color="#7c3aed" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => router.push('/(customer)/search')}
        >
          <Ionicons name="search" size={20} color="#9ca3af" />
          <Text style={styles.searchPlaceholder}>Search "milk"</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Promise Banner */}
        <View style={styles.promiseBanner}>
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            style={styles.promiseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.promiseContent}>
              <Ionicons name="flash" size={24} color="white" />
              <View style={styles.promiseTextContainer}>
                <Text style={styles.promiseTitle}>BHARATHI ENTERPRISES</Text>
                <Text style={styles.promiseSubtitle}>Grocery in 30 minutes</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={4}
            scrollEnabled={false}
            style={styles.categoriesGrid}
          />
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products for you</Text>
          <FlatList
            data={featuredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
            style={styles.productsGrid}
          />
        </View>
      </ScrollView>

      {/* Cart Button */}
      {getCartCount() > 0 && (
        <View style={styles.cartSection}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/(customer)/cart')}
          >
            <LinearGradient 
              colors={['#7c3aed', '#a855f7']} 
              style={styles.cartGradient}
            >
              <View style={styles.cartContent}>
                <Text style={styles.cartCount}>{getCartCount()}</Text>
                <Text style={styles.cartText}>View Cart</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.trackOrderButton}
            onPress={() => router.push('/(customer)/track-order')}
          >
            <View style={styles.trackOrderContent}>
              <Ionicons name="location" size={20} color="#7c3aed" />
              <Text style={styles.trackOrderText}>Track Order</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
    marginRight: 4,
  },
  profileButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchPlaceholder: {
    color: '#9ca3af',
    fontSize: 16,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  promiseBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promiseGradient: {
    padding: 20,
  },
  promiseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promiseTextContainer: {
    marginLeft: 12,
  },
  promiseTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  promiseSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoriesGrid: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    flex: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },
  productsGrid: {
    paddingHorizontal: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: (width - 48) / 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productImage: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '600',
    marginLeft: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    lineHeight: 18,
  },
  productWeight: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  addButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  quantityButton: {
    padding: 6,
  },
  quantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c3aed',
    minWidth: 24,
    textAlign: 'center',
  },
  cartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cartButton: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  cartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  cartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  trackOrderButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  trackOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackOrderText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 