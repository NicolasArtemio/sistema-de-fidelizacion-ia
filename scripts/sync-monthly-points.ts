
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function syncMonthlyPoints() {
  console.log('🔄 Starting one-time Monthly Points Sync...')

  // 1. Update monthly_points = points for ALL users
  // We can do this with a direct SQL query or iterating. 
  // Since we are using the JS client, iterating might be safer if we don't have a raw SQL endpoint exposed easily or just to be explicit.
  // Actually, we can just run a single update if we had a stored procedure, but client-side iteration is fine for a small user base.
  // BETTER: SQL is way faster and cleaner. Let's try to see if we can use .rpc() or just update.
  // Supabase JS client doesn't support "update col = other_col" directly in .update().
  // So I will fetch and update.

  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, points, monthly_points')
  
  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError.message)
    return
  }

  console.log(`Found ${profiles.length} profiles to sync.`)

  let updatedCount = 0

  for (const profile of profiles) {
    // Only update if they differ (or if monthly_points is 0/null)
    // The user specifically asked to "Update monthly_points to match the current points balance"
    
    if (profile.monthly_points !== profile.points) {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ monthly_points: profile.points })
            .eq('id', profile.id)
        
        if (updateError) {
            console.error(`❌ Failed to update user ${profile.id}:`, updateError.message)
        } else {
            updatedCount++
        }
    }
  }

  console.log(`✅ Synced ${updatedCount} users. 'monthly_points' now matches 'points'.`)
}

syncMonthlyPoints()
