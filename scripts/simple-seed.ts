import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

// Initialize Supabase Admin Client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const CLIENTS = [
    { name: 'Juan Perez', whatsapp: '5512345678' },
    { name: 'Maria Gomez', whatsapp: '5587654321' },
    { name: 'Carlos Ruiz', whatsapp: '5511223344' },
    { name: 'Ana Torres', whatsapp: '5544332211' },
    { name: 'Luis Hernandez', whatsapp: '5599887766' }
];

async function simpleSeed() {
    console.log('🌱 Starting Simple Seed...');

    for (const client of CLIENTS) {
        const fakeEmail = `${client.whatsapp}@dummy.com`;
        const pin = '1234';
        
        console.log(`\nProcessing: ${client.name} (${client.whatsapp})`);

        // 1. Create Auth User (Necessary due to FK constraint)
        // Using Admin API bypasses public rate limits and email verification
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: fakeEmail,
            password: 'dummyPassword123!',
            email_confirm: true,
            user_metadata: {
                full_name: client.name,
                whatsapp: client.whatsapp
            }
        });

        if (authError) {
            console.error(`❌ Failed to create auth user for ${client.name}:`, authError.message);
            continue;
        }

        const userId = authData.user.id;
        console.log(`   ✅ Auth User Created: ${userId}`);

        // 2. Ensure Profile is Correct (Trigger might have run, but we force update to be sure)
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: client.name,
            whatsapp: client.whatsapp,
            role: 'client',
            points: 3, // Starting with 3 points from history
            pin: pin
        });

        if (profileError) {
            console.error(`   ❌ Failed to update profile:`, profileError.message);
        } else {
            console.log(`   ✅ Profile Synced`);
        }

        // 3. Insert Visit History (Transactions)
        const visits = [
            { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), desc: 'Corte Clásico' }, // 30 days ago
            { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), desc: 'Barba y Corte' }, // 14 days ago
            { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), desc: 'Mantenimiento' }   // 2 days ago
        ];

        for (const visit of visits) {
            const { error: txError } = await supabase.from('transactions').insert({
                user_id: userId,
                type: 'earn',
                amount: 1,
                description: visit.desc,
                created_at: visit.date
            });
            
            if (txError) console.error(`      ⚠️ Transaction error:`, txError.message);
        }
        console.log(`   ✅ 3 Visits added`);
    }

    console.log('\n✨ Seed Completed!');
}

simpleSeed().catch(console.error);
