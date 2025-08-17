'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DeliveryPartner } from '@/lib/supabase'
import { Plus, Edit, Trash2, MapPin, Phone, Car, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function DeliveryPartnersPage() {
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_number: '',
    is_available: true
  })

  useEffect(() => {
    fetchDeliveryPartners()
  }, [])

  const fetchDeliveryPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeliveryPartners(data || [])
    } catch (error) {
      console.error('Error fetching delivery partners:', error)
      toast.error('Failed to fetch delivery partners')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.vehicle_number) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingPartner) {
        // Update existing partner
        const { error } = await supabase
          .from('delivery_partners')
          .update({
            name: formData.name,
            phone: formData.phone,
            vehicle_number: formData.vehicle_number,
            is_available: formData.is_available,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPartner.id)

        if (error) throw error
        toast.success('Delivery partner updated successfully')
      } else {
        // Create new partner (this would typically be done through registration)
        toast.error('New delivery partners should register through the registration page')
        return
      }

      setShowForm(false)
      setEditingPartner(null)
      resetForm()
      fetchDeliveryPartners()
    } catch (error) {
      console.error('Error saving delivery partner:', error)
      toast.error('Failed to save delivery partner')
    }
  }

  const handleEdit = (partner: DeliveryPartner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      phone: partner.phone,
      vehicle_number: partner.vehicle_number,
      is_available: partner.is_available
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery partner?')) return

    try {
      const { error } = await supabase
        .from('delivery_partners')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Delivery partner deleted successfully')
      fetchDeliveryPartners()
    } catch (error) {
      console.error('Error deleting delivery partner:', error)
      toast.error('Failed to delete delivery partner')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      vehicle_number: '',
      is_available: true
    })
  }

  const toggleAvailability = async (partner: DeliveryPartner) => {
    try {
      const { error } = await supabase
        .from('delivery_partners')
        .update({
          is_available: !partner.is_available,
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id)

      if (error) throw error
      toast.success(`Partner ${!partner.is_available ? 'activated' : 'deactivated'} successfully`)
      fetchDeliveryPartners()
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Delivery Partners</h1>
              <p className="text-gray-600 mt-2">Manage your delivery partners</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Partner
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingPartner ? 'Edit Delivery Partner' : 'Add Delivery Partner'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="input-field"
                    placeholder="Enter vehicle number"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
                    Available for delivery
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingPartner ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingPartner(null)
                      resetForm()
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delivery Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliveryPartners.map((partner) => (
            <div key={partner.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Phone className="w-4 h-4 mr-1" />
                    {partner.phone}
                  </div>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Car className="w-4 h-4 mr-1" />
                    {partner.vehicle_number}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(partner)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      partner.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {partner.is_available ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>

              {partner.current_location && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{partner.current_location}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(partner)}
                  className="btn-secondary flex items-center gap-1 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(partner.id)}
                  className="btn-secondary flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {deliveryPartners.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Car className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery partners</h3>
            <p className="text-gray-600">Get started by adding your first delivery partner.</p>
          </div>
        )}
      </div>
    </div>
  )
}
