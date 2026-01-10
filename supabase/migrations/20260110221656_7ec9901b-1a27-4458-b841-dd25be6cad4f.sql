-- Mark old pending records from pre-release testing as abandoned
UPDATE paid_forecasts 
SET generation_status = 'abandoned', 
    generation_error = 'Historical pending from pre-release testing'
WHERE generation_status = 'pending' 
  AND created_at < '2026-01-07 00:00:00';