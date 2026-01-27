
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env (not .env.local as it doesn't exist on disk apparently or tool failed)
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables. Please check .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function seedInactiveUser() {
  console.log('🌱 Seeding "Marcos Inactivo"...')

  const fakeWhatsapp = '9999999999'
  const fakeEmail = `${fakeWhatsapp}@tulook.com`
  const fakePassword = `LP$_1234` // PIN 1234
  
  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: fakeEmail,
    password: fakePassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Marcos Inactivo',
      whatsapp: fakeWhatsapp
    }
  })

  if (authError) {
    console.error('❌ Auth Creation Error:', authError.message)
    return
  }

  const userId = authData.user.id
  console.log('✅ Auth User Created:', userId)

  // 2. Create Profile (Manually to ensure fields)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: 'Marcos Inactivo',
    whatsapp: fakeWhatsapp,
    points: 8,
    total_points_accumulated: 8,
    monthly_points: 0, // Inactive this month
    role: 'client',
    pin: '1234'
  })

  if (profileError) {
    console.error('❌ Profile Creation Error:', profileError.message)
    return
  }
  console.log('✅ Profile Created with 8 points.')

  // 3. Create Backdated Transaction (35 days ago)
  const date = new Date()
  date.setDate(date.getDate() - 35)
  const backdatedIso = date.toISOString()

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: userId,
    type: 'earn',
    amount: 8,
    description: 'Old Visit',
    created_at: backdatedIso
  })

  if (txError) {
    console.error('❌ Transaction Error:', txError.message)
    return
  }

  console.log(`✅ Backdated Transaction Created: ${backdatedIso}`)
  console.log('🎉 "Marcos Inactivo" is ready to trigger alerts!')
}

seedInactiveUser()
