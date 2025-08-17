'use client'

import { useAuth } from '@/components/AuthProvider'
import { Settings, User, LogOut, Menu, X, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface CustomerHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
  showProfileMenu?: boolean
}

export default function CustomerHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backUrl = '/',
  showProfileMenu = true 
}: CustomerHeaderProps) {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchCartQuantity()
    }
  }, [user])

  const fetchCartQuantity = async () => {
    try {
      // Get user's cart
      let { data: cartData } = await supabase
        .from('cart')
        .select('id')
        .eq('customer_id', user?.id)
        .single()

      if (cartData) {
        // Get cart items count
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('cart_id', cartData.id)

        if (cartItems) {
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0)
          setCartQuantity(totalQuantity)
        }
      }
    } catch (error) {
      console.error('Error fetching cart quantity:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      // Close the menu first
      setIsMenuOpen(false)
      
      // Sign out from Supabase
      await signOut()
      
      // Use a small delay to ensure the sign-out process completes
      setTimeout(() => {
        // Redirect to login page
        router.replace('/auth/login')
      }, 100)
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect to login page even if there's an error
      setTimeout(() => {
        router.replace('/auth/login')
      }, 100)
    }
  }

  const getDashboardUrl = () => {
    if (!user) return '/auth/login'
    return '/customer/dashboard'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Store name and back button */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link 
                href={backUrl}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            
            <div>
              <Link href={getDashboardUrl()} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BE</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">BHARATHI ENTERPRISES</h1>
                  {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
                </div>
              </Link>
            </div>
          </div>

          {/* Right side - Cart and User menu */}
          {showProfileMenu && user && (
            <div className="flex items-center space-x-4">
              {/* Cart Icon with Quantity */}
              <Link
                href="/customer/dashboard?tab=cart"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {cartQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartQuantity > 99 ? '99+' : cartQuantity}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.email}</span>
                  {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
