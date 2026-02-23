-- Add down_since timestamp to track when monitor went down
ALTER TABLE monitor_state ADD COLUMN down_since INTEGER;

-- down_since stores Unix timestamp (seconds) when monitor entered DOWN state
-- NULL when monitor is UP
-- Used to calculate downtime duration when monitor recovers
