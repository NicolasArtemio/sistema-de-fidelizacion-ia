-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  whatsapp text,
  points int default 0,
  role text default 'user' check (role in ('user', 'client', 'admin')),
  pin text,  -- 4-digit PIN for client authentication
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text check (type in ('earn', 'redeem')) not null,
  amount int not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

-- Policies for profiles
-- Helper to check if user is admin (security definer to bypass RLS during check)
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

-- Policies for profiles
-- Drop old if exists (commented out as this is a fresh schema file usually, but for updates:)
-- drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Policies for transactions
create policy "Users can view own transactions." on public.transactions
  for select using (auth.uid() = user_id);

-- Admin can view all transactions
create policy "Admins can view all transactions" on public.transactions
  for select using (public.is_admin());

-- Users can insert their own transactions (for QR scanning)
create policy "Users can insert own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

-- Admin can insert transactions for ANY user (for manual adjustments)
create policy "Admins can insert transactions for any user" on public.transactions
  for insert with check (public.is_admin());

-- Admin bootstrapping trigger function
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, whatsapp, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'whatsapp',
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'client' end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC for incrementing points 안전하게
create or replace function increment_points(row_id uuid, count int)
returns void as $$
begin
  update public.profiles
  set points = points + count
  where id = row_id;
end;
$$ language plpgsql security definer;
