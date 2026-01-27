-- Create table for storing monthly rankings (Top 5)
CREATE TABLE IF NOT EXISTS monthly_winners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month DATE NOT NULL, -- Stored as first day of the month (e.g., 2023-10-01)
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    points INTEGER NOT NULL,
    rank INTEGER NOT NULL, -- 1 to 5
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(month, rank) -- Ensure only one person per rank per month
);

-- RLS Policies (Open for read, Service Role for write)
ALTER TABLE monthly_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON monthly_winners
    FOR SELECT USING (true);

-- No insert policy needed as we use Service Role for snapshotting
