'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import jwt from 'jsonwebtoken'
import { getSessionUserProfile, requireAdmin } from './auth-actions'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key'

export async function loginOrRegister(formData: FormData) {
    let redirectPath = '/dashboard'

    try {
        const supabase = await createClient()

        const name = formData.get('name') as string
        const rawWhatsapp = formData.get('whatsapp') as string
        const providedPassword = formData.get('password') as string
        const secretKey = formData.get('secret_key') as string
        const pin = formData.get('pin') as string
        const forceLogin = formData.get('force_login') === 'true'

        if (!rawWhatsapp) {
            return { error: 'El WhatsApp es obligatorio' }
        }

        // Normalize WhatsApp (remove spaces, dashes, parentheses)
        const whatsapp = rawWhatsapp.replace(/\D/g, '')
        
        console.log(`📝 [LOGIN] Attempting login for: ${whatsapp} (Raw: ${rawWhatsapp})`)

        if (whatsapp.length < 10) {
             return { error: 'El número de WhatsApp parece inválido (muy corto)' }
        }

        const email = `${whatsapp}@tulook.com`
        const isAdminNumber = process.env.ADMIN_WHATSAPP && whatsapp === process.env.ADMIN_WHATSAPP

        // ═══════════════════════════════════════════════════════════
        // ADMIN LOGIN PATH
        // ═══════════════════════════════════════════════════════════
        if (isAdminNumber) {
            
            // Verify Device Secret OR Database PIN
            let isDeviceAuthorized = false;

            // 1. Check Environment Variable (Primary Security)
            if (secretKey && secretKey === process.env.ADMIN_DEVICE_SECRET) {
                isDeviceAuthorized = true;
            }

            // 2. Fallback: Check Database PIN (User Convenience)
            if (!isDeviceAuthorized && secretKey) {
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                if (serviceRoleKey) {
                    const supabaseAdmin = createAdminClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        serviceRoleKey
                    )
                    const { data: profile } = await supabaseAdmin
                        .from('profiles')
                        .select('pin')
                        .eq('whatsapp', whatsapp)
                        .single()
                    
                    if (profile?.pin === secretKey) {
                        isDeviceAuthorized = true;
                    }
                }
            }

            if (!secretKey || !isDeviceAuthorized) {
                return { error: 'Dispositivo no autorizado: Clave de seguridad inválida' }
            }

            // Verify Password provided
            if (!providedPassword || providedPassword.trim() === '') {
                return { error: 'La contraseña es obligatoria para la cuenta de Admin' }
            }

            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: providedPassword,
            })

            if (signInError) {
                return { error: 'Credenciales de administrador inválidas.' }
            }

            // Verify role in database
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', signInData.user?.id)
                .single()

            if (profile?.role !== 'admin') {
                await supabase.auth.signOut()
                return { error: 'Esta cuenta no tiene privilegios de administrador' }
            }

            redirectPath = '/admin'

        } else {
            // ═══════════════════════════════════════════════════════════
            // CLIENT LOGIN PATH (PIN-based)
            // ═══════════════════════════════════════════════════════════
            
            // Validate PIN format
            if (!pin || !/^\d{4}$/.test(pin)) {
                return { error: 'Por favor ingresá un PIN válido de 4 dígitos' }
            }

            const PIN_SECRET_PREFIX = 'LP$_'
            const paddedPassword = `${PIN_SECRET_PREFIX}${pin}`

            // Check if user already exists by trying to sign in
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: paddedPassword,
            })

            if (!signInError && signInData.user) {
                // Login successful
                if (name) {
                    await supabase
                        .from('profiles')
                        .update({ full_name: name })
                        .eq('id', signInData.user.id)
                        .neq('full_name', name)
                }
            }

            if (signInError) {
                // If force_login is true, DO NOT attempt to register or check existence.
                // Just fail if the password/PIN was wrong.
                if (forceLogin) {
                    console.log(`🔒 [LOGIN] Force Login failed for ${whatsapp}. Wrong PIN.`)
                    return { error: 'PIN incorrecto. Por favor intentá de nuevo.' }
                }

                if (signInError.message.includes('Invalid login credentials')) {
                    // Check if user exists with a different password
                    // Use Admin Client to bypass RLS for existence check
                    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                    let existingProfile = null
                    
                    if (serviceRoleKey) {
                         const supabaseAdmin = createAdminClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            serviceRoleKey
                        )
                        const { data, error: adminSearchError } = await supabaseAdmin
                            .from('profiles')
                            .select('id, pin')
                            .eq('whatsapp', whatsapp)
                            .single()
                        
                        if (adminSearchError && adminSearchError.code !== 'PGRST116') { // PGRST116 = Not found
                            console.error('⚠️ [LOGIN] Admin search error:', adminSearchError)
                        }

                        existingProfile = data
                    } else {
                        console.error('❌ [LOGIN] Missing SUPABASE_SERVICE_ROLE_KEY! Cannot verify user existence reliably.')
                    }

                    if (existingProfile) {
                        console.log('👤 [LOGIN] User exists but password/PIN failed. ID:', existingProfile.id)
                        return { error: 'Este número ya está registrado. Ingresá tu PIN para continuar', code: 'USER_EXISTS' }
                    }

                    console.log('🆕 [LOGIN] User does not exist. Proceeding to CreateUser (Admin)...')

                    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                        console.error('❌ [LOGIN] Missing SUPABASE_SERVICE_ROLE_KEY for user creation.')
                        return { error: 'Error de configuración del servidor. Contactá soporte.' }
                    }

                    const supabaseAdmin = createAdminClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY
                    )

                    // Create new user with Admin Client to bypass email verification
                    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                        email,
                        password: paddedPassword,
                        email_confirm: true, // Auto-confirm email
                        user_metadata: {
                            full_name: name || whatsapp,
                            whatsapp,
                        },
                    })

                    if (signUpError) {
                        if (signUpError.message.includes('already registered') || signUpError.status === 422) {
                             return { error: 'Este número ya está registrado. Ingresá tu PIN para continuar', code: 'USER_EXISTS' }
                        }
                        return { error: `Registration failed: ${signUpError.message}` }
                    }

                    if (signUpData.user) {
                        // Use Admin Client to ensure Profile is created (Bypasses RLS)
                        // Note: supabaseAdmin is already initialized above

                        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
                            id: signUpData.user.id,
                            full_name: name || whatsapp,
                            whatsapp: whatsapp,
                            points: 0,
                            role: 'user',
                            pin: pin,
                        })

                        if (profileError) {
                            console.error('❌ [LOGIN] Failed to create profile:', profileError)
                            return { error: 'Error creating user profile.' }
                        }

                        // Auto-login after creation
                        const { error: signInError } = await supabase.auth.signInWithPassword({
                            email,
                            password: paddedPassword,
                        })

                        if (signInError) {
                            console.error('❌ [LOGIN] Auto-login failed:', signInError)
                            return { error: 'Registro exitoso, pero falló el inicio de sesión automático.' }
                        }
                    }

                } else {
                    return { error: 'Error al iniciar sesión. Por favor intentá de nuevo.' }
                }
            }
        }

    } catch (err: any) {
        // Handle Next.js redirect - Silent Success
        if (err.message === 'NEXT_REDIRECT' || err?.digest?.includes('NEXT_REDIRECT')) {
            throw err
        }
        
        console.error('🔥 DETAILED_ERROR [loginOrRegister]:', err)
        console.error('Stack:', err.stack)
        
        return { error: `Error interno: ${err.message || 'Error desconocido'}` }
    }

    revalidatePath('/', 'layout')
    return { success: true, redirectUrl: redirectPath }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}

export async function validateQRCode(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const now = Date.now()
        if (now - decoded.timestamp > 60000) {
            return { error: 'QR Code Expired' }
        }

        const { error: txError } = await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'earn',
            amount: 1,
            description: 'QR Scan'
        })

        if (txError) return { error: 'Transaction failed' }

        const { error: updateError } = await supabase.rpc('increment_points', { user_id: user.id, amount: 1 })

        if (updateError) {
            return { error: 'Update failed' }
        }

        return { success: true, newTotal: '?' }

    } catch (err) {
        return { error: 'Invalid Token' }
    }
}

export async function generateQRToken() {
    await requireAdmin()
    
    const payload = {
        timestamp: Date.now(),
        type: 'point_increment'
    }

    const token = jwt.sign(payload, JWT_SECRET)
    return token
}

export async function adjustPoints(userId: string, amount: number) {
    // 1. Verify Admin (Security)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    if (adminProfile?.role !== 'admin') {
        return { error: 'Forbidden: Admins only' }
    }

    // 2. Use Service Role to bypass RLS
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    // LOG: Connection Test
    console.log('[SERVER ACTION] Connecting to Supabase:', { 
        url: supabaseUrl ? 'Defined' : 'Missing',
        hasServiceKey: !!serviceRoleKey 
    })

    if (!serviceRoleKey) {
        console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables')
        return { error: 'Server configuration error: Missing Service Key' }
    }

    const supabaseAdmin = createAdminClient(
        supabaseUrl!,
        serviceRoleKey
    )

    try {
        // DEBUG: Verify User Existence & Get Current Points
        const { data: targetUser, error: targetError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, points, total_points_accumulated, monthly_points')
            .eq('id', userId)
            .single()
        
        if (targetError || !targetUser) {
            console.error('❌ [SERVER ACTION] User not found:', userId, targetError)
            return { error: `Usuario no encontrado en la BD. ID: ${userId}` }
        }

        // 3. Numeric Conversion & Validation
        const pointsValue = Number(amount)
        if (isNaN(pointsValue)) {
            return { error: 'Invalid points amount (NaN)' }
        }

        // 4. Update Strategy: Direct Update ONLY (RPC is unreliable)
        
        // Default Points: Ensure valid math
        const currentPointsVal = Number(targetUser.points)
        const currentPointsSafe = isNaN(currentPointsVal) ? 0 : currentPointsVal
        const newTotal = currentPointsSafe + pointsValue

        // Lifetime Points Logic: Only increment on positive addition (Earn)
        // If spending (negative), we do NOT touch accumulated points OR monthly points.
        const currentAccumulatedVal = Number(targetUser.total_points_accumulated)
        const currentAccumulatedSafe = isNaN(currentAccumulatedVal) ? 0 : currentAccumulatedVal
        
        // Monthly Points Logic
        const currentMonthlyVal = Number(targetUser.monthly_points)
        const currentMonthlySafe = isNaN(currentMonthlyVal) ? 0 : currentMonthlyVal

        // If pointsValue > 0, we add to accumulated and monthly.
        const newAccumulated = pointsValue > 0 
            ? currentAccumulatedSafe + pointsValue 
            : currentAccumulatedSafe
            
        const newMonthly = pointsValue > 0
            ? currentMonthlySafe + pointsValue
            : currentMonthlySafe

        // UUID Casting: Trim one last time
        const safeId = userId.trim()

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ 
                points: newTotal,
                total_points_accumulated: newAccumulated,
                monthly_points: newMonthly
            })
            .eq('id', safeId)
            .select() // Return updated rows

        if (error) {
            console.error('Supabase Error:', error)
            return { error: `Update Failed: ${error.message} (Code: ${error.code})` }
        }

        // Row Count Check
        if (!data || data.length === 0) {
            console.error('❌ [SERVER ACTION] Update ran but affected 0 rows.')
            return { error: 'Update succeeded but NO rows were changed. ID mismatch likely.' }
        }

        // Verify final state
        const { data: finalUser } = await supabaseAdmin
            .from('profiles')
            .select('points')
            .eq('id', safeId)
            .single()

        console.log('✅ [SERVER ACTION] Success. New Balance:', finalUser?.points)

        revalidatePath('/admin')
        return { success: true, message: 'Puntos actualizados correctamente' }

    } catch (err) {
        console.error('CRITICAL ERROR in adjustPoints:', err)
        return { error: 'Critical System Error during point adjustment' }
    }
}

export async function resetUserPin(userId: string, newPin: string) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }
    
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
    if (adminProfile?.role !== 'admin') {
        return { error: 'No tenés permisos de administrador' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ pin: newPin })
        .eq('id', userId)

    if (error) {
        console.error('Error resetting PIN:', error)
        return { error: 'Error al restablecer el PIN' }
    }

    return { success: true }
}

export async function getRecentTransactions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    return data || []
}

export async function getAtRiskClientCount() {
    const supabase = await createClient()
    
    // Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
    if (adminProfile?.role !== 'admin') return 0

    // Fetch Users
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at')
        .in('role', ['client', 'user'])

    if (!profiles || profiles.length === 0) return 0

    // Fetch Last Transactions (Earn type implies a visit)
    const { data: transactions } = await supabase
        .from('transactions')
        .select('user_id, created_at')
        .eq('type', 'earn')

    const now = new Date()
    let atRiskCount = 0

    profiles.forEach(user => {
        const userTx = transactions?.filter(t => t.user_id === user.id) || []
        
        // Find latest transaction date
        let lastVisit = new Date(user.created_at) // Default to creation date
        if (userTx.length > 0) {
            // Sort to find newest
            userTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            lastVisit = new Date(userTx[0].created_at)
        }

        const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24))

        if (daysSinceLastVisit > 21) {
            atRiskCount++
        }
    })

    return atRiskCount
}

export async function getAdminStats() {
  const supabase = await createClient()

  // 1. Total Clients (excluding admins)
  const { count: totalClients } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .neq('role', 'admin')

  // 2. Visits Today (Transactions of type 'earn' created today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: visitsToday } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'earn')
    .gte('created_at', today.toISOString())

  // 3. Ready for Reward (Clients with >= 15 points)
  const { count: readyForReward } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('points', 15)
    .neq('role', 'admin')

  return {
    totalClients: totalClients || 0,
    visitsToday: visitsToday || 0,
    readyForReward: readyForReward || 0
  }
}

export async function getTopLoyaltyRanking(currentUserId: string): Promise<{ top: Array<{ id: string; full_name: string; points: number }>; userRank: number }> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return { top: [], userRank: 0 }
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  // Fetch Top 5 based on Monthly Points (Tie-breaker: Lifetime Points)
  const { data: topClients } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, monthly_points, total_points_accumulated')
    .neq('role', 'admin')
    .gt('monthly_points', 0) // Only show users with > 0 points
    .order('monthly_points', { ascending: false })
    .order('total_points_accumulated', { ascending: false }) // Tie-breaker
    .limit(5)

  // Map 'monthly_points' to 'points' for the UI
  const formattedTop = topClients?.map(client => ({
    id: client.id,
    full_name: client.full_name,
    points: client.monthly_points ?? 0 // Display Monthly Points
  })) || []

  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, monthly_points')
    .eq('id', currentUserId)
    .single()

  let userRank = 0
  if (userProfile) {
    const userScore = userProfile.monthly_points ?? 0
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin')
      .gt('monthly_points', userScore)
    
    userRank = (count || 0) + 1
  }

  return { top: formattedTop, userRank }
}

export async function checkAndSnapshotMonthlyWinners() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  const now = new Date()
  // "Previous Month" is what we want to snapshot.
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = prevMonthDate.toISOString().split('T')[0] // YYYY-MM-01

  // 1. Check if snapshot already exists
  const { data: existing } = await supabaseAdmin
    .from('monthly_winners')
    .select('id')
    .eq('month', prevMonthStr)
    .limit(1)

  if (existing && existing.length > 0) {
    return // Already snapshotted
  }

  console.log(`📸 [SNAPSHOT] Initiating monthly snapshot for ${prevMonthStr}...`)

  // 2. Fetch Top 5 based on LAST MONTH'S activity
  // Since we reset monthly_points on the 1st, we need to be careful.
  // Assumption: This code runs on the FIRST user interaction of the new month.
  // At this moment, 'monthly_points' SHOULD still contain the accumulated points from last month
  // because we haven't reset them yet.
  
  const { data: topClients } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, monthly_points, total_points_accumulated')
    .neq('role', 'admin')
    .order('monthly_points', { ascending: false })
    .limit(5)

  if (!topClients || topClients.length === 0) return

  // 3. Insert into monthly_winners
  const winnersToInsert = topClients.map((client, index) => ({
    month: prevMonthStr,
    user_id: client.id,
    full_name: client.full_name,
    points: client.monthly_points ?? 0, // Store the monthly score
    rank: index + 1
  }))

  const { error: insertError } = await supabaseAdmin
    .from('monthly_winners')
    .insert(winnersToInsert)

  if (insertError) {
    console.error('❌ Failed to snapshot monthly winners:', insertError)
    return
  }

  console.log(`✅ Monthly Snapshot created for ${prevMonthStr}`)

  // 4. RESET monthly_points for ALL users
  // This ensures the new month starts fresh.
  const { error: resetError } = await supabaseAdmin
    .from('profiles')
    .update({ monthly_points: 0 })
    .neq('role', 'admin') // Reset everyone except admin (though admin shouldn't have points anyway)
  
  if (resetError) {
     console.error('❌ Failed to reset monthly_points:', resetError)
  } else {
     console.log('🔄 Monthly points reset to 0 for all users.')
  }
}

export async function getPreviousMonthWinners() {
  const supabase = await createClient()
  
  // Instead of strict "previous month", let's get the "latest available snapshot"
  // This handles the simulation case and is generally more useful (shows last known winners).
  
  const { data } = await supabase
    .from('monthly_winners')
    .select('*')
    .order('month', { ascending: false }) // Newest month first
    .order('rank', { ascending: true })
    .limit(5) // Get top 5 of the latest month

  // We need to filter by the very latest month found
  if (!data || data.length === 0) return []

  const latestMonth = data[0].month
  return data.filter(w => w.month === latestMonth)
}

export async function getMonthlyWinnerStatus(userId: string) {
  const supabase = await createClient()
  
  const now = new Date()
  // Check if we are in the first 7 days
  if (now.getDate() > 7) return null

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = prevMonthDate.toISOString().split('T')[0]

  const { data } = await supabase
    .from('monthly_winners')
    .select('rank')
    .eq('month', prevMonthStr)
    .eq('user_id', userId)
    .eq('rank', 1) // Only return if they were #1
    .single()

  return data // Will be { rank: 1 } or null
}
