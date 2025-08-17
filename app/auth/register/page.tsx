'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RegisterPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registrationStep, setRegistrationStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
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

    // Validate password
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
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      if (data.user) {
        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          // Email confirmation required
          setRegistrationStep('confirm')
          toast.success('Registration successful! Please check your email to confirm your account.')
        } else {
          // Email already confirmed or confirmation not required
          await completeRegistration(data.user)
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Provide more specific error messages
      if (error.message?.includes('already registered')) {
        toast.error('An account with this email already exists. Please sign in instead.')
      } else if (error.message?.includes('row-level security')) {
        toast.error('Registration failed due to security policy. Please try again.')
      } else if (error.message?.includes('email not confirmed')) {
        toast.error('Please check your email and click the confirmation link before signing in.')
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const completeRegistration = async (user: any) => {
    try {
      // Step 2: Sign in immediately to get authenticated session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) throw signInError

      // Step 3: Now insert into users table with authenticated session
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: formData.email,
          role: formData.role
        }])

      if (userError) {
        console.error('User insert error:', userError)
        // If insert fails, sign out and show error
        await supabase.auth.signOut()
        throw userError
      }

      // Step 4: If role is delivery_partner, create delivery_partner record
      if (formData.role === 'delivery_partner') {
        const { error: deliveryError } = await supabase
          .from('delivery_partners')
          .insert([{
            user_id: user.id,
            name: formData.email.split('@')[0], // Use email prefix as name
            phone: '', // Will be updated later
            vehicle_number: '', // Will be updated later
            is_available: true
          }])

        if (deliveryError) {
          console.error('Delivery partner insert error:', deliveryError)
          // Don't fail the registration for this, just log it
        }
      }

      toast.success('Registration successful! Welcome to BHARATHI ENTERPRISES!')
      setRegistrationStep('success')
      
      // Redirect after a short delay
      setTimeout(() => {
        switch (formData.role) {
          case 'customer':
            router.replace('/customer/dashboard')
            break
          case 'delivery_partner':
            router.replace('/delivery/dashboard')
            break
          default:
            router.replace('/')
        }
      }, 2000)
    } catch (error: any) {
      console.error('Registration completion error:', error)
      toast.error('Registration completion failed. Please try signing in.')
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

  // Email confirmation step
  if (registrationStep === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">BE</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">BHARATHI ENTERPRISES</h2>
            <p className="mt-2 text-sm text-gray-600">Confirm your email</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
              <p className="text-gray-600 mb-4">
                We've sent a confirmation link to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Click the link in your email to complete your registration and start using BHARATHI ENTERPRISES.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleResendConfirmation}
                className="w-full btn-secondary"
              >
                Resend confirmation email
              </button>
              
              <button
                onClick={() => setRegistrationStep('form')}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to registration
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already confirmed?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success step
  if (registrationStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">BE</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">BHARATHI ENTERPRISES</h2>
            <p className="mt-2 text-sm text-gray-600">Registration successful!</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to BHARATHI ENTERPRISES!</h3>
              <p className="text-gray-600">
                Your account has been created successfully. Redirecting you to your dashboard...
              </p>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <p className="mt-2 text-sm text-gray-600">Create your account</p>
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
