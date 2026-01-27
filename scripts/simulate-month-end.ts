
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables.')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function simulateMonthEnd() {
  console.log('⏳ Starting Manual Month-End Simulation (Time Travel to Feb 1st)...')

  // 1. Define the "Month" we are closing. 
  // User said "Save current Top 5 as winners of Enero 2026".
  // So the snapshot month is '2026-01-01'.
  const targetMonthStr = '2026-01-01'

  // 2. Check if already exists (optional, but good for idempotency)
  const { data: existing } = await supabaseAdmin
    .from('monthly_winners')
    .select('id')
    .eq('month', targetMonthStr)
  
  if (existing && existing.length > 0) {
    console.log(`⚠️ Winners for ${targetMonthStr} already exist. Deleting them to re-run simulation...`)
    await supabaseAdmin.from('monthly_winners').delete().eq('month', targetMonthStr)
  }

  // 3. Fetch Current Rankings (based on monthly_points)
  const { data: topClients } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, monthly_points, total_points_accumulated')
    .neq('role', 'admin')
    .gt('monthly_points', 0)
    .order('monthly_points', { ascending: false })
    .order('total_points_accumulated', { ascending: false })
    .limit(5)

  if (!topClients || topClients.length === 0) {
    console.log('⚠️ No users with points found. Snapshot will be empty.')
  } else {
    console.log(`📸 Found ${topClients.length} winners. Taking snapshot...`)
    
    const winnersToInsert = topClients.map((client, index) => ({
      month: targetMonthStr,
      user_id: client.id,
      full_name: client.full_name,
      points: client.monthly_points ?? 0,
      rank: index + 1
    }))

    const { error: insertError } = await supabaseAdmin
      .from('monthly_winners')
      .insert(winnersToInsert)

    if (insertError) {
      console.error('❌ Failed to insert winners:', insertError)
      process.exit(1)
    }
    console.log(`✅ Snapshot saved for ${targetMonthStr}`)
  }

  // 4. RESET monthly_points for ALL users
  console.log('🧹 Resetting ALL monthly_points to 0...')
  const { error: resetError } = await supabaseAdmin
    .from('profiles')
    .update({ monthly_points: 0 })
    .neq('role', 'admin')

  if (resetError) {
    console.error('❌ Failed to reset points:', resetError)
  } else {
    console.log('✨ monthly_points have been reset. Welcome to Febrero!')
  }
}

simulateMonthEnd()
