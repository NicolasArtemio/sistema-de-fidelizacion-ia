-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create PROFILES table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  whatsapp text,
  points int default 0,
  role text default 'user' check (role in ('user', 'client', 'admin')),
  pin text,  -- 4-digit PIN for client authentication
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create VISITS table (mapped to transactions)
-- We use 'transactions' to store visits (type='earn') and redemptions (type='redeem')
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text check (type in ('earn', 'redeem')) not null,
  amount int not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

-- 4. Helper Function for Admin Check
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 5. Policies for PROFILES
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- 6. Policies for TRANSACTIONS (Visits)
create policy "Users can view own transactions." on public.transactions
  for select using (auth.uid() = user_id);

create policy "Admins can view all transactions" on public.transactions
  for select using (public.is_admin());

create policy "Users can insert own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Admins can insert transactions for any user" on public.transactions
  for insert with check (public.is_admin());

-- 7. Trigger to auto-create Profile on Signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, whatsapp, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'whatsapp',
    'client' -- Default to client for this app
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Function to safely increment points
create or replace function increment_points(row_id uuid, count int)
returns void as $$
begin
  update public.profiles
  set points = points + count
  where id = row_id;
end;
$$ language plpgsql security definer;
