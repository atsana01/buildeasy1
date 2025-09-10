-- Ensure soft delete columns exist and are properly configured
DO $$ 
BEGIN
  -- Check if deleted_at column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_requests' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.quote_requests ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Check if deletion_reason column exists, if not add it  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_requests' AND column_name = 'deletion_reason') THEN
    ALTER TABLE public.quote_requests ADD COLUMN deletion_reason TEXT;
  END IF;
END $$;

-- Update RLS policy to ensure clients can update their own quote requests for soft deletion
DROP POLICY IF EXISTS "Clients can update their quote requests" ON public.quote_requests;

CREATE POLICY "Clients can update their quote requests"
  ON public.quote_requests
  FOR UPDATE
  USING (auth.uid() = client_id);

-- Create index for better performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_quote_requests_deleted_at ON public.quote_requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quote_requests_client_project ON public.quote_requests(client_id, project_id) WHERE deleted_at IS NULL;

-- Add trigger for audit logging if not exists
DROP TRIGGER IF EXISTS quote_soft_delete_audit ON public.quote_requests;

CREATE TRIGGER quote_soft_delete_audit
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.log_quote_deletion();