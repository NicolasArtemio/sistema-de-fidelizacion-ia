-- 1. Add monthly_points column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS monthly_points INTEGER DEFAULT 0;

-- 2. Initialize with 0 (New logic starts fresh) or copy current points if desired.
-- User requested "monthly_points" logic. Let's assume we start at 0 for fairness if mid-month, 
-- OR backfill if we want to count current month's progress.
-- Given it's a "Fairness" request, starting fresh or backfilling depends on interpretation.
-- However, since we track lifetime separately, let's init monthly_points with 0 to be safe, 
-- OR update it to match points if we assume current points = this month's points (risky).
-- Safer: Default 0. But if we want to test, maybe 0 is bad.
-- Decision: Set to 0. The admin can manually adjust if needed, or we just start tracking from now.
-- Actually, if we are in the middle of the month, users might be annoyed.
-- But since we just added 'total_points_accumulated', maybe we can assume 'points' (spendable) 
-- is NOT a good proxy for monthly activity (since they spend it).
-- So 0 is the only logical starting point for a new metric.
UPDATE profiles SET monthly_points = 0 WHERE monthly_points IS NULL;

-- 3. Update increment_points function to update monthly_points too
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    points = points + amount,
    total_points_accumulated = total_points_accumulated + amount,
    monthly_points = monthly_points + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
