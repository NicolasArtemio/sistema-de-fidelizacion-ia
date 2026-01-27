-- 1. Add the new column for Lifetime Points
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_points_accumulated INTEGER DEFAULT 0;

-- 2. Initialize it with current points (Backfill)
UPDATE profiles 
SET total_points_accumulated = points 
WHERE total_points_accumulated = 0;

-- 3. Update the increment_points function (used by QR Scans) to update BOTH columns
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    points = points + amount,
    total_points_accumulated = total_points_accumulated + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
