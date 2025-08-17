import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  role: 'owner' | 'customer' | 'delivery_partner'
  full_name?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  notifications_enabled: boolean
  email_notifications: boolean
  dark_mode: boolean
  language: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  delivery_partner_id?: string
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  total_amount: number
  delivery_address: string
  delivery_instructions?: string
  estimated_delivery_time?: string
  actual_delivery_time?: string
  payment_method?: 'cash' | 'upi' | 'pending'
  payment_status?: 'pending' | 'completed' | 'failed'
  payment_collected_at?: string
  payment_collected_by?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
}

export interface DeliveryPartner {
  id: string
  user_id: string
  name: string
  phone: string
  vehicle_number: string
  is_available: boolean
  current_location?: string
  created_at: string
  updated_at: string
}
