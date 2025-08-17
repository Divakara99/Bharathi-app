'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/supabase'
import { Package, MapPin, Clock, User, Truck, CheckCircle, XCircle, ArrowLeft, CreditCard, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface OrderWithDetails extends Order {
  customer_email?: string
  delivery_partner_name?: string
  order_items?: any[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
    setupRealtimeSubscription()
  }, [selectedStatus])

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          users!orders_customer_id_fkey(email),
          delivery_partners(name)
        `)
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error

      const ordersWithDetails = data?.map(order => ({
        ...order,
        customer_email: order.users?.email,
        delivery_partner_name: order.delivery_partners?.name
      })) || []

      setOrders(ordersWithDetails)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => subscription.unsubscribe()
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
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const assignDeliveryPartner = async (orderId: string, partnerId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_partner_id: partnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      toast.success('Delivery partner assigned successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error assigning delivery partner:', error)
      toast.error('Failed to assign delivery partner')
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

  const getPaymentMethodDisplay = (order: OrderWithDetails) => {
    if (!order.payment_method || order.payment_method === 'pending') {
      return { text: 'Pending', color: 'text-gray-500', icon: null }
    }
    
    switch (order.payment_method) {
      case 'cash':
        return { text: 'Cash', color: 'text-green-600', icon: <CreditCard className="w-4 h-4" /> }
      case 'upi':
        return { text: 'UPI', color: 'text-blue-600', icon: <QrCode className="w-4 h-4" /> }
      default:
        return { text: 'Unknown', color: 'text-gray-500', icon: null }
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/owner/dashboard" className="btn-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
              <p className="text-gray-600 mt-2">Monitor and manage all orders</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id.slice(0, 8)}...
                  </h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <User className="w-4 h-4 mr-1" />
                    {order.customer_email}
                  </div>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
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
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-medium">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                    {order.delivery_partner_name && (
                      <div className="flex justify-between">
                        <span>Delivery Partner:</span>
                        <span className="font-medium">{order.delivery_partner_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>Payment Method:</span>
                      <div className="flex items-center space-x-1">
                        {getPaymentMethodDisplay(order).icon}
                        <span className={`font-medium ${getPaymentMethodDisplay(order).color}`}>
                          {getPaymentMethodDisplay(order).text}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status || 'pending')}`}>
                        {(order.payment_status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    {order.payment_collected_at && (
                      <div className="flex justify-between">
                        <span>Payment Collected:</span>
                        <span className="font-medium">{formatDate(order.payment_collected_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="btn-primary text-sm"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="btn-secondary text-sm text-red-600 hover:text-red-700"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="btn-primary text-sm"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    className="btn-primary text-sm"
                  >
                    Ready for Delivery
                  </button>
                )}
                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="btn-primary text-sm"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? 'Orders will appear here once customers place them.'
                : `No ${selectedStatus} orders found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
