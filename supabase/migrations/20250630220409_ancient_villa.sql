-- Drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ai_transformations_status_check' 
    AND table_name = 'ai_transformations'
  ) THEN
    ALTER TABLE ai_transformations DROP CONSTRAINT ai_transformations_status_check;
  END IF;
END $$;

-- Add the corrected constraint with all required status values
ALTER TABLE ai_transformations 
ADD CONSTRAINT ai_transformations_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));