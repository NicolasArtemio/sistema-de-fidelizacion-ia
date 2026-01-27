import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables. Check .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function wipeTransactions(): Promise<number> {
  const { data: existing } = await supabase.from('transactions').select('id')
  const count = existing?.length || 0
  if (count === 0) return 0

  const { error } = await supabase
    .from('transactions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
  return count
}

async function wipeAuthUsers(): Promise<number> {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw error

  const users = data.users || []
  for (const u of users) {
    const del = await supabase.auth.admin.deleteUser(u.id)
    if (del.error) throw del.error
  }
  return users.length
}

async function wipeProfiles(): Promise<number> {
  const { data: existing } = await supabase.from('profiles').select('id')
  const count = existing?.length || 0
  if (count === 0) return 0

  const { error } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
  return count
}

async function main() {
  console.log('Starting total cleanup...')

  const removedTx = await wipeTransactions()
  console.log(`Deleted ${removedTx} rows from public.transactions`)

  const removedProfiles = await wipeProfiles()
  console.log(`Deleted ${removedProfiles} rows from public.profiles`)

  const removedUsers = await wipeAuthUsers()
  console.log(`Deleted ${removedUsers} users from auth.users`)

  const { data: usersAfter } = await supabase.auth.admin.listUsers()
  const { data: profilesAfter } = await supabase.from('profiles').select('id')
  const { data: txAfter } = await supabase.from('transactions').select('id')

  console.log('Post-cleanup state:')
  console.log({ authUsers: usersAfter.users?.length || 0, profiles: profilesAfter?.length || 0, transactions: txAfter?.length || 0 })
}

main().catch((e) => {
  console.error('Cleanup failed:', e)
  process.exit(1)
})
