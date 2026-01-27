import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables. Check .env');
    console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('Service Key:', serviceRoleKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupAdmin() {
    // Configuration from User Request + Server Actions match
    const whatsapp = '2284716778';
    const email = `${whatsapp}@tulook.com`; // Matching the new app/server-actions.ts logic
    const password = 'admin1234';
    const fullName = 'AdminNico';
    const pin = '1234';

    console.log(`\n🚀 Starting Admin Setup Script`);
    console.log(`Target User: ${email}`);
    console.log(`Target Phone: ${whatsapp}`);

    // 1. Check if user exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
       console.error('❌ Error listing users:', listError);
       return;
    }

    const existingUser = users.find(u => u.email === email);
    let userId;

    if (existingUser) {
        console.log('ℹ️  User already exists in Auth. Updating credentials...');
        const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: password,
            user_metadata: { whatsapp, full_name: fullName }
        });

        if (error) {
            console.error('❌ Error updating user:', error);
            throw error;
        }
        console.log('✅ Auth Credentials updated.');
        userId = existingUser.id;
    } else {
        console.log('✨ Creating new Auth user...');
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { whatsapp, full_name: fullName }
        });

        if (error) {
            console.error('❌ Error creating user:', error);
            throw error;
        }
        console.log('✅ Auth User created.');
        userId = data.user.id;
    }

    console.log(`🆔 User ID: ${userId}`);

    // 2. Upsert into public.profiles to ensure Admin Role
    console.log('💾 Updating public.profiles...');
    
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        whatsapp: whatsapp,
        full_name: fullName,
        role: 'admin', // KEY: This enables admin access
        points: 1000,  // Bonus points for the admin
        pin: pin       // Ensuring PIN matches the secret key backup
    });

    if (profileError) {
        console.error('❌ Error updating profile:', profileError);
    } else {
        console.log('✅ Profile updated successfully.');
        console.log('\n🎉 SETUP COMPLETE!');
        console.log(`You can now log in with:`);
        console.log(`   WhatsApp: ${whatsapp}`);
        console.log(`   Password: ${password}`);
        console.log(`   Secret Key / PIN: ${pin}`);
    }
}

setupAdmin().catch(console.error);
