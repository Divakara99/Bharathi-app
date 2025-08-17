'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const { user, loading } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      checkUserData()
    }
  }, [user])

  const checkUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setUserData(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? 'Yes' : 'No'}</p>
          {user && (
            <>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
            </>
          )}
        </div>

        {userData && (
          <div className="bg-green-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">User Data from Database</h2>
            <pre className="whitespace-pre-wrap">{JSON.stringify(userData, null, 2)}</pre>
          </div>
        )}

        {error && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <button 
            onClick={checkUserData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh User Data
          </button>
        </div>
      </div>
    </div>
  )
}
