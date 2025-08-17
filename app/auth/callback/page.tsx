'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
          return
        }

        if (data.session) {
          // User is authenticated, check if they have a role
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.session.user.id)
            .single()

          if (userError) {
            console.error('User role fetch error:', userError)
            setStatus('error')
            setMessage('Failed to get user information. Please contact support.')
            return
          }

          setStatus('success')
          setMessage('Email confirmed successfully! Redirecting to your dashboard...')
          
          // Redirect based on role
          setTimeout(() => {
            switch (userData.role) {
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
          }, 2000)
        } else {
          setStatus('error')
          setMessage('No active session found. Please try signing in again.')
        }
      } catch (error) {
        console.error('Callback error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">BE</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">BHARATHI ENTERPRISES</h2>
          <p className="mt-2 text-sm text-gray-600">Authentication</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
                <p className="text-gray-600">Please wait while we verify your email.</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600">{message}</p>
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="btn-primary"
                >
                  Go to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
