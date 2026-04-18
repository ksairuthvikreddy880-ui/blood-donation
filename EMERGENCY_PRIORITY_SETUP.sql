-- Emergency Priority System Setup
-- Run this in Supabase SQL Editor

-- 1. Add priority_value column to requests table (if not exists)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS priority_value INTEGER DEFAULT 1;

-- 2. Update existing requests to have priority values based on urgency
UPDATE requests 
SET priority_value = CASE 
  WHEN urgency = 'critical' THEN 3
  WHEN urgency = 'urgent' THEN 2
  ELSE 1
END
WHERE priority_value IS NULL OR priority_value = 0;

-- 3. Create function to automatically set priority_value
CREATE OR REPLACE FUNCTION set_priority_value()
RETURNS TRIGGER AS $$
BEGIN
  NEW.priority_value := CASE 
    WHEN NEW.urgency = 'critical' THEN 3
    WHEN NEW.urgency = 'urgent' THEN 2
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-set priority_value on insert/update
DROP TRIGGER IF EXISTS trg_set_priority_value ON requests;
CREATE TRIGGER trg_set_priority_value
  BEFORE INSERT OR UPDATE OF urgency ON requests
  FOR EACH ROW
  EXECUTE FUNCTION set_priority_value();

-- 5. Create index for faster priority-based queries
CREATE INDEX IF NOT EXISTS idx_requests_priority_created 
ON requests(priority_value DESC, created_at DESC);

-- 6. Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_requests_location 
ON requests(latitude, longitude) 
WHERE status IN ('pending', 'accepted');

-- Verify setup
SELECT 
  urgency,
  priority_value,
  COUNT(*) as count
FROM requests
GROUP BY urgency, priority_value
ORDER BY priority_value DESC;
