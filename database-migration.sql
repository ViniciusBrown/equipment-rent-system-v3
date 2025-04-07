-- Database Migration Script for Role-Based Workflow Implementation

-- 1. Update rental_requests table with workflow tracking fields
ALTER TABLE public.rental_requests
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS contract_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS initial_inspection_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS final_inspection_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Create equipment_inspections table
CREATE TABLE IF NOT EXISTS public.equipment_inspections (
  id SERIAL PRIMARY KEY,
  rental_request_id INTEGER REFERENCES public.rental_requests(id),
  equipment_id INTEGER REFERENCES public.equipments(id),
  inspection_type VARCHAR(20) NOT NULL, -- 'initial' or 'final'
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inspector_id UUID REFERENCES auth.users(id),
  notes TEXT,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create rental_documents table
CREATE TABLE IF NOT EXISTS public.rental_documents (
  id SERIAL PRIMARY KEY,
  rental_request_id INTEGER REFERENCES public.rental_requests(id),
  document_type VARCHAR(50) NOT NULL, -- 'contract', 'payment_proof', 'inspection_report', etc.
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rental_requests_user_id ON public.rental_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inspections_rental_request_id ON public.equipment_inspections(rental_request_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inspections_equipment_id ON public.equipment_inspections(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inspections_inspector_id ON public.equipment_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_rental_documents_rental_request_id ON public.rental_documents(rental_request_id);
CREATE INDEX IF NOT EXISTS idx_rental_documents_uploaded_by ON public.rental_documents(uploaded_by);

-- 5. Create RLS policies for role-based access control

-- Rental Requests policies
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;

-- Policy for clients: can only see their own requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rental_requests_client_select') THEN
    ALTER POLICY rental_requests_client_select ON public.rental_requests
      USING (auth.uid() = user_id AND auth.jwt() -> 'user_metadata' ->> 'role' = 'client');
  ELSE
    CREATE POLICY rental_requests_client_select ON public.rental_requests
      FOR SELECT
      USING (auth.uid() = user_id AND auth.jwt() -> 'user_metadata' ->> 'role' = 'client');
  END IF;
END
$$;

-- Policy for equipment inspectors: can see all requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rental_requests_inspector_select') THEN
    ALTER POLICY rental_requests_inspector_select ON public.rental_requests
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  ELSE
    CREATE POLICY rental_requests_inspector_select ON public.rental_requests
      FOR SELECT
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  END IF;
END
$$;

-- Policy for equipment inspectors: can update inspection status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rental_requests_inspector_update') THEN
    ALTER POLICY rental_requests_inspector_update ON public.rental_requests
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'))
      WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager') AND
         (initial_inspection_status IS DISTINCT FROM OLD.initial_inspection_status OR
          final_inspection_status IS DISTINCT FROM OLD.final_inspection_status))
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role' IN ('financial_inspector', 'manager') AND
         (payment_status IS DISTINCT FROM OLD.payment_status OR
          status IS DISTINCT FROM OLD.status))
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'manager' AND
         contract_status IS DISTINCT FROM OLD.contract_status)
      );
  ELSE
    CREATE POLICY rental_requests_inspector_update ON public.rental_requests
      FOR UPDATE
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'))
      WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager') AND
         (initial_inspection_status IS DISTINCT FROM OLD.initial_inspection_status OR
          final_inspection_status IS DISTINCT FROM OLD.final_inspection_status))
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role' IN ('financial_inspector', 'manager') AND
         (payment_status IS DISTINCT FROM OLD.payment_status OR
          status IS DISTINCT FROM OLD.status))
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'manager' AND
         contract_status IS DISTINCT FROM OLD.contract_status)
      );
  END IF;
END
$$;

-- Policy for clients: can insert their own requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rental_requests_client_insert') THEN
    ALTER POLICY rental_requests_client_insert ON public.rental_requests
      WITH CHECK (auth.uid() = user_id);
  ELSE
    CREATE POLICY rental_requests_client_insert ON public.rental_requests
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Equipment Inspections policies
ALTER TABLE public.equipment_inspections ENABLE ROW LEVEL SECURITY;

-- Policy for equipment inspectors: can insert and select inspections
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'equipment_inspections_inspector_select') THEN
    ALTER POLICY equipment_inspections_inspector_select ON public.equipment_inspections
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  ELSE
    CREATE POLICY equipment_inspections_inspector_select ON public.equipment_inspections
      FOR SELECT
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'equipment_inspections_inspector_insert') THEN
    ALTER POLICY equipment_inspections_inspector_insert ON public.equipment_inspections
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  ELSE
    CREATE POLICY equipment_inspections_inspector_insert ON public.equipment_inspections
      FOR INSERT
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'equipment_inspections_inspector_update') THEN
    ALTER POLICY equipment_inspections_inspector_update ON public.equipment_inspections
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager') AND
             inspector_id = auth.uid())
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  ELSE
    CREATE POLICY equipment_inspections_inspector_update ON public.equipment_inspections
      FOR UPDATE
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager') AND
             inspector_id = auth.uid())
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  END IF;
END
$$;

-- Rental Documents policies
ALTER TABLE public.rental_documents ENABLE ROW LEVEL SECURITY;

-- Policy for clients: can see documents for their own requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rental_documents_client_select') THEN
    ALTER POLICY rental_documents_client_select ON public.rental_documents
      USING (
        EXISTS (
          SELECT 1 FROM public.rental_requests rr
          WHERE rr.id = rental_request_id AND rr.user_id = auth.uid()
        ) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'client'
      );
  ELSE
    CREATE POLICY rental_documents_client_select ON public.rental_documents
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.rental_requests rr
          WHERE rr.id = rental_request_id AND rr.user_id = auth.uid()
        ) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'client'
      );
  END IF;
END
$$;

-- Policy for staff: can see all documents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rental_documents_staff_select') THEN
    ALTER POLICY rental_documents_staff_select ON public.rental_documents
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  ELSE
    CREATE POLICY rental_documents_staff_select ON public.rental_documents
      FOR SELECT
      USING (auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'));
  END IF;
END
$$;

-- Policy for document upload: based on role
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rental_documents_insert') THEN
    ALTER POLICY rental_documents_insert ON public.rental_documents
      WITH CHECK (
        (document_type = 'client_document' AND auth.jwt() -> 'user_metadata' ->> 'role' = 'client' AND
         EXISTS (
           SELECT 1 FROM public.rental_requests rr
           WHERE rr.id = rental_request_id AND rr.user_id = auth.uid()
         ))
        OR
        (document_type = 'inspection_report' AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'))
        OR
        (document_type = 'payment_proof' AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('financial_inspector', 'manager'))
        OR
        (document_type = 'contract' AND auth.jwt() -> 'user_metadata' ->> 'role' = 'manager')
      );
  ELSE
    CREATE POLICY rental_documents_insert ON public.rental_documents
      FOR INSERT
      WITH CHECK (
        (document_type = 'client_document' AND auth.jwt() -> 'user_metadata' ->> 'role' = 'client' AND
         EXISTS (
           SELECT 1 FROM public.rental_requests rr
           WHERE rr.id = rental_request_id AND rr.user_id = auth.uid()
         ))
        OR
        (document_type = 'inspection_report' AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('equipment_inspector', 'financial_inspector', 'manager'))
        OR
        (document_type = 'payment_proof' AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('financial_inspector', 'manager'))
        OR
        (document_type = 'contract' AND auth.jwt() -> 'user_metadata' ->> 'role' = 'manager')
      );
  END IF;
END
$$;

-- 6. Create function to update user roles (for admin use)
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if the executing user is a manager
  IF (SELECT auth.jwt() -> 'user_metadata' ->> 'role') = 'manager' THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', new_role)
    WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only managers can update user roles';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;
