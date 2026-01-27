
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyRanking() {
  console.log('🕵️ Verifying Ranking Logic...')

  const { data: topClients, error } = await supabase
    .from('profiles')
    .select('full_name, monthly_points, total_points_accumulated')
    .neq('role', 'admin')
    .gt('monthly_points', 0) // The new filter
    .order('monthly_points', { ascending: false })
    .order('total_points_accumulated', { ascending: false })
    .limit(5)

  if (error) {
    console.error('❌ Query Error:', error)
    return
  }

  console.log('🏆 Simulated Leaderboard:')
  topClients.forEach((client, idx) => {
    console.log(`${idx + 1}. ${client.full_name} - Monthly: ${client.monthly_points} | Total: ${client.total_points_accumulated}`)
  })

  // specific checks
  const marcos = topClients.find(c => c.full_name.includes('Marcos'))
  const pepe = topClients.find(c => c.full_name.includes('Pepe')) // Assuming Pepe exists and has 0 points

  if (marcos && marcos.monthly_points === 8) {
    console.log('✅ Marcos is correctly ranked with 8 points.')
  } else {
    console.error('❌ Marcos is missing or has wrong points.')
  }

  if (!pepe) {
    console.log('✅ Pepe (0 points) is correctly excluded.')
  } else {
    console.error('❌ Pepe should be excluded but is present.')
  }
}

verifyRanking()
