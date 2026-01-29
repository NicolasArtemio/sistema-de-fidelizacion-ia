-- Create redemption_requests table
create table if not exists public.redemption_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  reward_id text not null,
  reward_name text not null,
  cost int not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.redemption_requests enable row level security;

-- Policies
create policy "Users can view own requests" on public.redemption_requests
  for select using (auth.uid() = user_id);

create policy "Users can insert own requests" on public.redemption_requests
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all requests" on public.redemption_requests
  for select using (public.is_admin());

create policy "Admins can update all requests" on public.redemption_requests
  for update using (public.is_admin());
