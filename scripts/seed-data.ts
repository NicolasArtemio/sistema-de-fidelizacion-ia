import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyUsers = [
  {
    email: 'client1@test.com',
    password: 'password123',
    full_name: 'Carlos Rodriguez',
    whatsapp: '5551010101',
    visits: [
      { type: 'earn', amount: 10, description: 'Haircut', created_at: new Date('2023-11-01').toISOString() },
      { type: 'earn', amount: 10, description: 'Beard Trim', created_at: new Date('2023-12-15').toISOString() },
    ]
  },
  {
    email: 'client2@test.com',
    password: 'password123',
    full_name: 'Ana Smith',
    whatsapp: '5552020202',
    visits: [
      { type: 'earn', amount: 10, description: 'Haircut', created_at: new Date('2024-01-10').toISOString() },
      { type: 'earn', amount: 10, description: 'Styling', created_at: new Date('2024-02-20').toISOString() },
    ]
  },
  {
    email: 'client3@test.com',
    password: 'password123',
    full_name: 'Miguel Johnson',
    whatsapp: '5553030303',
    visits: [
      { type: 'earn', amount: 10, description: 'Haircut', created_at: new Date('2023-09-01').toISOString() }, // Churn risk
    ]
  },
  {
    email: 'client4@test.com',
    password: 'password123',
    full_name: 'Sofia Davis',
    whatsapp: '5554040404',
    visits: [
      { type: 'earn', amount: 10, description: 'Haircut', created_at: new Date('2024-02-25').toISOString() },
      { type: 'earn', amount: 20, description: 'Premium Service', created_at: new Date('2024-03-01').toISOString() },
      { type: 'earn', amount: 10, description: 'Haircut', created_at: new Date('2024-03-10').toISOString() },
    ]
  },
  {
    email: 'client5@test.com',
    password: 'password123',
    full_name: 'Javier Wilson',
    whatsapp: '5555050505',
    visits: [
      { type: 'earn', amount: 10, description: 'Haircut', created_at: new Date('2023-10-05').toISOString() }, // Churn risk
      { type: 'earn', amount: 10, description: 'Beard Trim', created_at: new Date('2023-10-25').toISOString() },
    ]
  }
];

async function seed() {
  console.log('🌱 Starting seed process...');

  for (const user of dummyUsers) {
    console.log(`Processing ${user.email}...`);

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.full_name,
          whatsapp: user.whatsapp,
        }
      }
    });

    if (authError) {
      console.error(`Error creating user ${user.email}:`, authError.message);
      // Continue if user already exists
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.warn(`Skipping transactions for ${user.email} (no user ID)`);
      continue;
    }

    // 2. Sign In to get session (needed for RLS policies if inserting as user)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    });

    if (signInError || !signInData.session) {
       console.error(`Error signing in ${user.email}:`, signInError?.message);
       continue;
    }
    
    // Use the user's client
    const userClient = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${signInData.session.access_token}`
            }
        }
    });

    // 3. Insert Visits (Transactions)
    // Note: 'created_at' might be ignored by default 'default now()' in schema unless we explicitly allow it or if Supabase accepts it.
    // The schema I wrote uses `default timezone('utc'::text, now())`.
    // Postgres usually allows overriding default if value is provided.
    
    for (const visit of user.visits) {
      const { error: visitError } = await userClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: visit.type,
          amount: visit.amount,
          description: visit.description,
          created_at: visit.created_at
        });

      if (visitError) {
        console.error(`Error inserting visit for ${user.email}:`, visitError.message);
      }
    }
    
    // 4. Update points in profile
    const totalPoints = user.visits.reduce((acc, v) => acc + v.amount, 0);
    // Since we are logged in as user, we can update our own profile based on the policy "Users can update own profile."
    const { error: profileError } = await userClient
        .from('profiles')
        .update({ points: totalPoints })
        .eq('id', userId);

    if (profileError) {
         console.error(`Error updating points for ${user.email}:`, profileError.message);
    }

    console.log(`✅ ${user.full_name} seeded with ${user.visits.length} visits.`);
  }

  console.log('🎉 Seed completed!');
}

seed();
