'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSessionUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile
}

export async function requireAdmin() {
    const profile = await getSessionUserProfile()
    if (profile?.role !== 'admin') {
        throw new Error('Unauthorized')
    }
}
