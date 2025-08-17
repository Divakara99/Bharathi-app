'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Product, Order } from '@/lib/supabase'
import { ShoppingCart, Plus, Minus, Package, Search, Filter, Star, Heart, Eye, User } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomerHeader from '@/components/CustomerHeader'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface CartItem {
  id: string
  product: Product
  quantity: number
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'cart' | 'orders'>('products')
  const [showViewCart, setShowViewCart] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // Hide view cart button after 5 seconds
  useEffect(() => {
    if (showViewCart) {
      const timer = setTimeout(() => {
        setShowViewCart(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showViewCart])

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)

      if (productsData) setProducts(productsData)

      // Fetch user's cart
      await fetchCart()

      // Fetch user's orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })

      if (ordersData) setOrders(ordersData)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCart = async () => {
    try {
      // Get or create cart
      let { data: cartData } = await supabase
        .from('cart')
        .select('id')
        .eq('customer_id', user?.id)
        .single()

      if (!cartData) {
        const { data: newCart } = await supabase
          .from('cart')
          .insert([{ customer_id: user?.id }])
          .select()
          .single()
        cartData = newCart
      }

      if (cartData) {
        // Fetch cart items with product details
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            products (*)
          `)
          .eq('cart_id', cartData.id)

        if (cartItems) {
          setCart(cartItems.map((item: any) => ({
            id: item.id,
            product: item.products as Product,
            quantity: item.quantity
          })))
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  const addToCart = async (product: Product) => {
    try {
      // Get or create cart
      let { data: cartData } = await supabase
        .from('cart')
        .select('id')
        .eq('customer_id', user?.id)
        .single()

      if (!cartData) {
        const { data: newCart } = await supabase
          .from('cart')
          .insert([{ customer_id: user?.id }])
          .select()
          .single()
        cartData = newCart
      }

      if (cartData) {
        // Check if product already in cart
        const existingItem = cart.find(item => item.product.id === product.id)

        if (existingItem) {
          // Update quantity
          const newQuantity = existingItem.quantity + 1
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', existingItem.id)

          if (error) throw error
          
          toast.success(`${product.name} quantity updated to ${newQuantity}!`)
        } else {
          // Add new item
          const { error } = await supabase
            .from('cart_items')
            .insert([{
              cart_id: cartData.id,
              product_id: product.id,
              quantity: 1
            }])

          if (error) throw error
          
          toast.success(`${product.name} added to cart! (Quantity: 1)`)
        }

        fetchCart()
        setShowViewCart(true)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    }
  }

  const updateProductQuantity = async (product: Product, newQuantity: number) => {
    try {
      // Get or create cart
      let { data: cartData } = await supabase
        .from('cart')
        .select('id')
        .eq('customer_id', user?.id)
        .single()

      if (!cartData) {
        const { data: newCart } = await supabase
          .from('cart')
          .insert([{ customer_id: user?.id }])
          .select()
          .single()
        cartData = newCart
      }

      if (cartData) {
        const existingItem = cart.find(item => item.product.id === product.id)

        if (newQuantity <= 0) {
          if (existingItem) {
            // Remove item
            const { error } = await supabase
              .from('cart_items')
              .delete()
              .eq('id', existingItem.id)

            if (error) throw error
            toast.success(`${product.name} removed from cart`)
          }
        } else {
          if (existingItem) {
            // Update quantity
            const { error } = await supabase
              .from('cart_items')
              .update({ quantity: newQuantity })
              .eq('id', existingItem.id)

            if (error) throw error
            toast.success(`${product.name} quantity updated to ${newQuantity}`)
          } else {
            // Add new item
            const { error } = await supabase
              .from('cart_items')
              .insert([{
                cart_id: cartData.id,
                product_id: product.id,
                quantity: newQuantity
              }])

            if (error) throw error
            toast.success(`${product.name} added to cart! (Quantity: ${newQuantity})`)
          }
        }

        fetchCart()
        setShowViewCart(true)
      }
    } catch (error) {
      console.error('Error updating product quantity:', error)
      toast.error('Failed to update quantity')
    }
  }

  const updateCartQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        // Remove item
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId)

        if (error) throw error
        toast.success('Item removed from cart')
      } else {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', itemId)

        if (error) throw error
        toast.success(`Quantity updated to ${newQuantity}`)
      }

      fetchCart()
    } catch (error) {
      console.error('Error updating cart:', error)
      toast.error('Failed to update cart')
    }
  }

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    try {
      // Calculate total
      const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: user?.id,
          total_amount: total,
          delivery_address: 'Default Address', // In real app, get from user profile
          status: 'pending'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .in('id', cart.map(item => item.id))

      if (clearError) throw clearError

      toast.success('Order placed successfully!')
      setCart([])
      fetchData()
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to place order')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate total cart quantity
  const totalCartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader title="Customer Dashboard" subtitle="Welcome back" />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader title="Customer Dashboard" subtitle="Welcome back" />

      {/* View Cart Floating Button */}
      {showViewCart && totalCartQuantity > 0 && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => {
              setActiveTab('cart')
              setShowViewCart(false)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Cart ({totalCartQuantity})</span>
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cart'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="h-4 w-4 inline mr-2" />
              Cart ({totalCartQuantity} items)
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              My Orders
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const cartItem = cart.find(item => item.product.id === product.id)
              const currentQuantity = cartItem ? cartItem.quantity : 0
              
              return (
                <div key={product.id} className="card relative">
                  {product.image_url && (
                    <div className="relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      {/* Quantity Controls Overlay */}
                      {currentQuantity > 0 && (
                        <div className="absolute bottom-4 right-4">
                          <div className="bg-pink-500 text-white rounded-lg px-3 py-1 flex items-center space-x-2 shadow-lg">
                            <button
                              onClick={() => updateProductQuantity(product, currentQuantity - 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-pink-600 rounded transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-medium">{currentQuantity}</span>
                            <button
                              onClick={() => updateProductQuantity(product, currentQuantity + 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-pink-600 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                      <span className="text-sm text-gray-500 ml-2">1 pc</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {currentQuantity === 0 ? (
                        <button
                          onClick={() => updateProductQuantity(product, 1)}
                          className="btn-primary"
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="bg-pink-500 text-white rounded-lg px-3 py-1 flex items-center space-x-2">
                          <button
                            onClick={() => updateProductQuantity(product, currentQuantity - 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-pink-600 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-medium">{currentQuantity}</span>
                          <button
                            onClick={() => updateProductQuantity(product, currentQuantity + 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-pink-600 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'cart' && (
          <div>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600">Add some products to get started!</p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="mt-4 btn-primary"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="card flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {item.product.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-gray-600">₹{item.product.price} per item</p>
                        <p className="text-sm text-gray-500">Total: ₹{(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-pink-500 text-white rounded-lg px-3 py-1 flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-pink-600 rounded transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium text-lg">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-pink-600 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="card">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium text-gray-900">Total ({totalCartQuantity} items)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setActiveTab('products')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Continue Shopping
                      </button>
                      <button
                        onClick={placeOrder}
                        className="btn-primary"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}...</h4>
                    <p className="text-gray-600">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600">Your order history will appear here.</p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="mt-4 btn-primary"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
