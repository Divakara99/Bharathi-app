const { createClient } = require('@supabase/supabase-js')

// This script sets up the owner account in Supabase
// Run this after setting up your database schema

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupOwner() {
  try {
    console.log('Setting up owner account...')

    // Create the owner user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'Akhildivakara@gmail.com',
      password: '9959827826Dd@',
      email_confirm: true
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Owner account already exists in auth.users')
      } else {
        throw authError
      }
    } else {
      console.log('Created owner account in auth.users')
    }

    // Insert owner record in public.users table
    const { error: userError } = await supabase
      .from('users')
      .upsert([{
        id: authUser?.user?.id || '00000000-0000-0000-0000-000000000001',
        email: 'Akhildivakara@gmail.com',
        role: 'owner'
      }], { onConflict: 'id' })

    if (userError) {
      if (userError.message.includes('duplicate key')) {
        console.log('Owner account already exists in public.users')
      } else {
        throw userError
      }
    } else {
      console.log('Created owner record in public.users')
    }

    console.log('✅ Owner account setup complete!')
    console.log('Email: Akhildivakara@gmail.com')
    console.log('Password: 9959827826Dd@')
    console.log('Role: owner')

  } catch (error) {
    console.error('Error setting up owner account:', error)
    process.exit(1)
  }
}

setupOwner()
