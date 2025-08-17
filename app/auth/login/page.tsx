'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    if (user && !redirecting) {
      // User is already logged in, automatically redirect to appropriate dashboard
      setRedirecting(true)
      getUserRole()
    }
  }, [user, redirecting])

  const getUserRole = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user role:', error)
        // If user role not found, redirect to home page
        router.replace('/')
        return
      }

      // Redirect based on role
      switch (data.role) {
        case 'owner':
          router.replace('/owner/dashboard')
          break
        case 'customer':
          router.replace('/customer/dashboard')
          break
        case 'delivery_partner':
          router.replace('/delivery/dashboard')
          break
        default:
          router.replace('/')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      router.replace('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.')
        } else if (error.message?.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.')
        } else if (error.message?.includes('Too many requests')) {
          toast.error('Too many login attempts. Please wait a moment and try again.')
        } else {
          toast.error(error.message || 'Login failed. Please try again.')
        }
        return
      }

      if (data.user) {
        // Check if user exists in our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          console.error('User role fetch error:', userError)
          toast.error('Failed to get user information. Please contact support.')
          return
        }

        toast.success('Login successful! Welcome to BHARATHI ENTERPRISES!')

        // Redirect based on role
        switch (userData.role) {
          case 'owner':
            router.replace('/owner/dashboard')
            break
          case 'customer':
            router.replace('/customer/dashboard')
            break
          case 'delivery_partner':
            router.replace('/delivery/dashboard')
            break
          default:
            router.replace('/')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
      })

      if (error) throw error

      toast.success('Confirmation email sent! Please check your inbox.')
    } catch (error: any) {
      console.error('Resend error:', error)
      toast.error('Failed to resend confirmation email. Please try again.')
    }
  }

  // If user is already logged in, show loading while redirecting
  if (user && redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">BE</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">BHARATHI ENTERPRISES</h2>
            <p className="mt-2 text-sm text-gray-600">Redirecting to your dashboard...</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Please wait...</p>
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
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
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
                  autoComplete="current-password"
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
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleResendConfirmation}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto"
              >
                <AlertCircle className="w-4 h-4" />
                Need confirmation email?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
