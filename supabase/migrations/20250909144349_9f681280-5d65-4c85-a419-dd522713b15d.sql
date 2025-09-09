-- Add missing columns and tables to support comprehensive functionality

-- Add project_vendors table to track vendor selections per project
CREATE TABLE IF NOT EXISTS public.project_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(user_id) ON DELETE CASCADE,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  removed_at TIMESTAMP WITH TIME ZONE NULL,
  selection_status TEXT NOT NULL DEFAULT 'selected' CHECK (selection_status IN ('selected', 'removed')),
  UNIQUE(project_id, vendor_id)
);

-- Enable RLS on project_vendors
ALTER TABLE public.project_vendors ENABLE ROW LEVEL SECURITY;

-- Create policies for project_vendors
CREATE POLICY "Users can view their project vendors" 
ON public.project_vendors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_vendors.project_id 
    AND projects.client_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their project vendors" 
ON public.project_vendors 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_vendors.project_id 
    AND projects.client_id = auth.uid()
  )
);

CREATE POLICY "Users can update their project vendors" 
ON public.project_vendors 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_vendors.project_id 
    AND projects.client_id = auth.uid()
  )
);

-- Add soft delete support to quote_requests with audit trail
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;

-- Add project name column to projects if missing
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT 'Untitled Project',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create audit log table for tracking actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs - users can only see their own
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (user_id = auth.uid());

-- Create function to log quote request deletions
CREATE OR REPLACE FUNCTION public.log_quote_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a soft delete (setting deleted_at)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'soft_delete',
      'quote_requests',
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for quote request audit logging
CREATE TRIGGER quote_request_audit_trigger
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_quote_deletion();

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for password reset tokens
CREATE POLICY "Users can view their own reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_vendors_project_id ON public.project_vendors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_vendors_vendor_id ON public.project_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_project_vendors_status ON public.project_vendors(selection_status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_deleted_at ON public.quote_requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- Update the projects table to ensure it has the right structure
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS vendor_selections JSONB DEFAULT '[]'::jsonb;