'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Order, DeliveryPartner } from '@/lib/supabase'
import { Truck, Package, MapPin, Clock, CheckCircle, XCircle, Calendar, BarChart3, TrendingUp, DollarSign, X, Navigation, CreditCard, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '@/components/Header'

interface OrderWithDetails extends Order {
  customer_email?: string
  order_items?: any[]
}

interface OrderStats {
  totalDelivered: number
  totalEarnings: number
  thisMonthDelivered: number
  thisMonthEarnings: number
  thisWeekDelivered: number
  thisWeekEarnings: number
}

interface LocationData {
  latitude: number
  longitude: number
  address?: string
}

export default function DeliveryDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [allOrders, setAllOrders] = useState<OrderWithDetails[]>([])
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartner | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(true)
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [filterType, setFilterType] = useState<'all' | 'date' | 'month'>('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [stats, setStats] = useState<OrderStats>({
    totalDelivered: 0,
    totalEarnings: 0,
    thisMonthDelivered: 0,
    thisMonthEarnings: 0,
    thisWeekDelivered: 0,
    thisWeekEarnings: 0
  })
  
  // Location modal states
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | null>(null)

  useEffect(() => {
    fetchData()
    setupRealtimeSubscription()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [allOrders])

  const fetchData = async () => {
    try {
      // Fetch delivery partner profile
      const { data: partnerData } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (partnerData) {
        setDeliveryPartner(partnerData)
        setIsAvailable(partnerData.is_available)
      }

      // Fetch all orders (current and delivered)
      await fetchAllOrders()

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllOrders = async () => {
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_customer_id_fkey(email)
        `)
        .eq('delivery_partner_id', user?.id)
        .order('created_at', { ascending: false })

      if (ordersData) {
        const ordersWithDetails = ordersData.map(order => ({
          ...order,
          customer_email: order.users?.email
        }))
        
        setAllOrders(ordersWithDetails)
        
        // Set current orders (non-delivered)
        const currentOrders = ordersWithDetails.filter(order => 
          order.status !== 'delivered' && order.status !== 'cancelled'
        )
        setOrders(currentOrders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const calculateStats = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    const deliveredOrders = allOrders.filter(order => order.status === 'delivered')
    
    const thisMonthOrders = deliveredOrders.filter(order => 
      new Date(order.created_at) >= startOfMonth
    )
    
    const thisWeekOrders = deliveredOrders.filter(order => 
      new Date(order.created_at) >= startOfWeek
    )

    const totalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.total_amount * 0.1), 0) // 10% commission
    const thisMonthEarnings = thisMonthOrders.reduce((sum, order) => sum + (order.total_amount * 0.1), 0)
    const thisWeekEarnings = thisWeekOrders.reduce((sum, order) => sum + (order.total_amount * 0.1), 0)

    setStats({
      totalDelivered: deliveredOrders.length,
      totalEarnings,
      thisMonthDelivered: thisMonthOrders.length,
      thisMonthEarnings,
      thisWeekDelivered: thisWeekOrders.length,
      thisWeekEarnings
    })
  }

  const getFilteredOrders = () => {
    let filtered = allOrders.filter(order => order.status === 'delivered')

    if (filterType === 'date' && selectedDate) {
      const selectedDateObj = new Date(selectedDate)
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.toDateString() === selectedDateObj.toDateString()
      })
    } else if (filterType === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-')
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getFullYear() === parseInt(year) && 
               orderDate.getMonth() === parseInt(month) - 1
      })
    }

    return filtered
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `delivery_partner_id=eq.${user?.id}`
      }, () => {
        fetchAllOrders()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const updateAvailability = async (available: boolean) => {
    try {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ is_available: available })
        .eq('user_id', user?.id)

      if (error) throw error

      setIsAvailable(available)
      setDeliveryPartner(prev => prev ? { ...prev, is_available: available } : null)
      toast.success(`You are now ${available ? 'available' : 'unavailable'} for deliveries`)
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability')
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      toast.success(`Order status updated to ${status}`)
      fetchAllOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const getCurrentLocation = async (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Try to get address from coordinates using reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            )
            const data = await response.json()
            
            resolve({
              latitude,
              longitude,
              address: data.display_name || `${latitude}, ${longitude}`
            })
          } catch (error) {
            // If reverse geocoding fails, just return coordinates
            resolve({
              latitude,
              longitude,
              address: `${latitude}, ${longitude}`
            })
          }
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const openLocationModal = async () => {
    setLocationLoading(true)
    setShowLocationModal(true)
    
    try {
      const location = await getCurrentLocation()
      setCurrentLocation(location)
    } catch (error) {
      console.error('Error getting location:', error)
      toast.error('Unable to get current location')
      setShowLocationModal(false)
    } finally {
      setLocationLoading(false)
    }
  }

  const updateLocation = async () => {
    if (!currentLocation) return

    try {
      const locationString = `${currentLocation.latitude}, ${currentLocation.longitude}`

      const { error } = await supabase
        .from('delivery_partners')
        .update({ 
          current_location: locationString,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)

      if (error) throw error

      setDeliveryPartner(prev => prev ? { ...prev, current_location: locationString } : null)
      toast.success('Location updated successfully')
      setShowLocationModal(false)
      setCurrentLocation(null)
    } catch (error) {
      console.error('Error updating location:', error)
      toast.error('Failed to update location')
    }
  }

  const showPaymentCollection = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setPaymentMethod(null)
    setShowPaymentModal(true)
  }

  const collectPayment = async () => {
    if (!selectedOrder || !paymentMethod) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_method: paymentMethod,
          payment_status: 'completed',
          payment_collected_at: new Date().toISOString(),
          payment_collected_by: user?.id,
          status: 'delivered',
          actual_delivery_time: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      toast.success(`Payment collected via ${paymentMethod.toUpperCase()}`)
      setShowPaymentModal(false)
      setSelectedOrder(null)
      setPaymentMethod(null)
      fetchAllOrders()
    } catch (error) {
      console.error('Error collecting payment:', error)
      toast.error('Failed to collect payment')
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Delivery Dashboard" subtitle="Welcome back" />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
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
      <Header title="Delivery Dashboard" subtitle="Welcome back" />

      {/* Status Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Availability Status</h3>
              <p className="text-gray-600">
                {isAvailable ? 'You are currently available for deliveries' : 'You are currently unavailable'}
              </p>
              {deliveryPartner?.current_location && (
                <p className="text-sm text-gray-500 mt-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Last location: {deliveryPartner.current_location}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={openLocationModal}
                className="btn-secondary flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Update Location
              </button>
              <button
                onClick={() => updateAvailability(!isAvailable)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isAvailable 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {isAvailable ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
              <button
                onClick={() => {
                  setShowLocationModal(false)
                  setCurrentLocation(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {locationLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Getting your current location...</p>
              </div>
            ) : currentLocation ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Navigation className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">Location Found</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Coordinates:</span>
                      <p className="text-gray-600">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Address:</span>
                      <p className="text-gray-600">{currentLocation.address}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowLocationModal(false)
                      setCurrentLocation(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateLocation}
                    className="flex-1 btn-primary"
                  >
                    Update Location
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-600">Unable to get location</p>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="mt-4 btn-primary"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Collect Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedOrder(null)
                  setPaymentMethod(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                <p className="text-sm text-gray-600">Order #{selectedOrder.id.slice(0, 8)}...</p>
                <p className="text-lg font-bold text-gray-900">₹{selectedOrder.total_amount.toFixed(2)}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Select Payment Method</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      paymentMethod === 'cash' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Cash Payment</p>
                          <p className="text-sm text-gray-600">Collect cash from customer</p>
                        </div>
                      </div>
                      {paymentMethod === 'cash' && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      paymentMethod === 'upi' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <QrCode className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">UPI Payment</p>
                          <p className="text-sm text-gray-600">Show QR code to customer</p>
                        </div>
                      </div>
                      {paymentMethod === 'upi' && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
              
              {paymentMethod === 'upi' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="bg-white rounded-lg p-4 inline-block mb-3">
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-lg">पे</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">PhonePe</p>
                          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded mt-1">
                            BHARATHI ENTERPRISES
                          </div>
                          <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded mt-2 mx-auto flex items-center justify-center">
                            <QrCode className="w-16 h-16 text-gray-400" />
                          </div>
                          <div className="flex items-center justify-center mt-2">
                            <div className="text-xs text-gray-600">BHIM UPI</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Terminal 2-Q66235291</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Scan this QR code to pay ₹{selectedOrder.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedOrder(null)
                    setPaymentMethod(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={collectPayment}
                  disabled={!paymentMethod}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    paymentMethod 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDelivered}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonthDelivered}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeekDelivered}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Truck className="h-4 w-4 inline mr-2" />
              Current Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Order History ({allOrders.filter(o => o.status === 'delivered').length})
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'current' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Orders</h2>
            
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(0, 8)}...
                      </h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Package className="w-4 h-4 mr-1" />
                        ₹{order.total_amount.toFixed(2)}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm">{order.delivery_address}</p>
                        {order.delivery_instructions && (
                          <p className="text-sm mt-1">Note: {order.delivery_instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => showPaymentCollection(order)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Collect Payment & Deliver
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Pick Up Order
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No current orders</h3>
                  <p className="text-gray-600">
                    {isAvailable 
                      ? 'Orders will be assigned to you when they are ready for delivery.'
                      : 'Go online to receive delivery assignments.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
              
              {/* Filter Controls */}
              <div className="flex items-center space-x-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'date' | 'month')}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="date">Specific Date</option>
                  <option value="month">Specific Month</option>
                </select>
                
                {filterType === 'date' && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                )}
                
                {filterType === 'month' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {getFilteredOrders().map((order) => (
                <div key={order.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(0, 8)}...
                      </h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Package className="w-4 h-4 mr-1" />
                        ₹{order.total_amount.toFixed(2)} (Earnings: {formatCurrency(order.total_amount * 0.1)})
                      </div>
                      {order.actual_delivery_time && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Delivered: {new Date(order.actual_delivery_time).toLocaleDateString()} at {new Date(order.actual_delivery_time).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm">{order.delivery_address}</p>
                        {order.delivery_instructions && (
                          <p className="text-sm mt-1">Note: {order.delivery_instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredOrders().length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No delivered orders found</h3>
                  <p className="text-gray-600">
                    {filterType === 'all' 
                      ? 'You haven\'t delivered any orders yet.'
                      : 'No orders found for the selected filter.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
