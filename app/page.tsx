'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [roleChecked, setRoleChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !roleChecked) {
      setRoleChecked(true)
      
      if (!user) {
        router.replace('/auth/login')
        return
      }

      // Check user role and redirect accordingly
      const checkUserRole = async () => {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

          if (userData) {
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
                router.replace('/auth/login')
            }
          } else {
            router.replace('/auth/login')
          }
        } catch (error) {
          console.error('Error checking user role:', error)
          router.replace('/auth/login')
        }
      }

      checkUserRole()
    }
  }, [user, loading, roleChecked, router])

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
