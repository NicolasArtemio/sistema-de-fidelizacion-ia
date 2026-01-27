
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyReset() {
  console.log('🕵️ Verifying Monthly Points Reset...')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('full_name, monthly_points')
    .neq('role', 'admin')
    .limit(5)

  if (error) {
    console.error('❌ Query Error:', error)
    return
  }

  const allZero = profiles.every(p => p.monthly_points === 0)
  
  if (allZero) {
    console.log('✅ All checked users have 0 monthly_points.')
    profiles.forEach(p => console.log(`   - ${p.full_name}: ${p.monthly_points}`))
  } else {
    console.error('❌ Some users still have points!')
    profiles.forEach(p => console.log(`   - ${p.full_name}: ${p.monthly_points}`))
  }
}

verifyReset()
