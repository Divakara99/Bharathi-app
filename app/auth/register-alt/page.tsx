'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RegisterAltPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  })

  useEffect(() => {
    if (user) {
      getUserRole()
    }
  }, [user])

  const getUserRole = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) throw error

      switch (data.role) {
        case 'owner':
          router.push('/owner/dashboard')
          break
        case 'customer':
          router.push('/customer/dashboard')
          break
        case 'delivery_partner':
          router.push('/delivery/dashboard')
          break
        default:
          router.push('/')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      router.push('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      if (data.user) {
        // Step 2: Use the database function to create user profile
        const { error: functionError } = await supabase.rpc('create_user_profile', {
          user_id: data.user.id,
          user_email: formData.email,
          user_role: formData.role
        })

        if (functionError) {
          console.error('Function error:', functionError)
          // If function fails, try manual insert as fallback
          const { error: manualError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: formData.email,
              role: formData.role
            }])

          if (manualError) {
            console.error('Manual insert error:', manualError)
            await supabase.auth.signOut()
            throw manualError
          }
        }

        toast.success('Registration successful! Welcome to BHARATHI ENTERPRISES!')
        
        // Redirect based on role
        switch (formData.role) {
          case 'customer':
            router.push('/customer/dashboard')
            break
          case 'delivery_partner':
            router.push('/delivery/dashboard')
            break
          default:
            router.push('/')
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      if (error.message?.includes('already registered')) {
        toast.error('An account with this email already exists. Please sign in instead.')
      } else if (error.message?.includes('row-level security')) {
        toast.error('Registration failed due to security policy. Please try again.')
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">BE</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">BHARATHI ENTERPRISES</h2>
            <p className="mt-2 text-sm text-gray-600">You are already logged in</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={getUserRole}
                className="w-full btn-primary"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full btn-secondary flex items-center justify-center gap-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">BE</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">BHARATHI ENTERPRISES</h2>
          <p className="mt-2 text-sm text-gray-600">Create your account (Alternative Method)</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field pl-10"
                >
                  <option value="customer">Customer</option>
                  <option value="delivery_partner">Delivery Partner</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
