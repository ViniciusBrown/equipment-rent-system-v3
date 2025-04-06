# Implementation Steps for Role-Based Rent Order Workflow

This document provides a step-by-step guide for implementing the role-based workflow for the Equipment Rental System.

## Phase 1: Database Schema Updates

### Step 1: Update Rental Requests Table
- Add workflow tracking fields to the rental_requests table
- Add user_id field to link requests to users

```sql
ALTER TABLE public.rental_requests 
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN contract_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN initial_inspection_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN final_inspection_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

### Step 2: Create Equipment Inspections Table
- Create a new table to store equipment inspection details

```sql
CREATE TABLE public.equipment_inspections (
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
```

### Step 3: Create Rental Documents Table
- Create a new table to store documents related to rent orders

```sql
CREATE TABLE public.rental_documents (
  id SERIAL PRIMARY KEY,
  rental_request_id INTEGER REFERENCES public.rental_requests(id),
  document_type VARCHAR(50) NOT NULL, -- 'contract', 'payment_proof', 'inspection_report', etc.
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Phase 2: Type Definitions and Authentication Updates

### Step 1: Update User Types
- Update the AuthUser type to include role information
- Create a UserRole type

```typescript
// lib/auth.tsx
export type UserRole = 'client' | 'equipment_inspector' | 'financial_inspector' | 'manager';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  metadata: {
    name?: string;
  };
};
```

### Step 2: Update Rental Request Types
- Update the RentalRequest type to include new workflow fields

```typescript
// lib/supabase/database.types.ts
export type RentalRequest = {
  // Existing fields
  // ...
  
  // New fields
  payment_status: "pending" | "completed";
  contract_status: "pending" | "generated" | "signed";
  initial_inspection_status: "pending" | "completed";
  final_inspection_status: "pending" | "completed";
  user_id: string;
};
```

### Step 3: Create Equipment Inspection Types
- Create a new type for equipment inspections

```typescript
// lib/supabase/database.types.ts
export type EquipmentInspection = {
  id: number;
  rental_request_id: number;
  equipment_id: number;
  inspection_type: "initial" | "final";
  inspection_date: string;
  inspector_id: string;
  notes?: string;
  image_urls: string[];
  created_at?: string;
};
```

### Step 4: Create Rental Document Types
- Create a new type for rental documents

```typescript
// lib/supabase/database.types.ts
export type RentalDocument = {
  id: number;
  rental_request_id: number;
  document_type: string;
  document_url: string;
  uploaded_by: string;
  upload_date: string;
  created_at?: string;
};
```

### Step 5: Update Registration Process
- Update the registration form to include role selection (for admin users)
- Update the signUp function to include role information

### Step 6: Update Middleware for Role-Based Access
- Update the middleware to check user roles for protected routes
- Define route access based on user roles

## Phase 3: UI Components

### Step 1: Update Form Schema
- Update the form schema to include new fields for all workflow stages

```typescript
// components/rent-orders/RentOrderDialog/types.ts
export const formSchema = z.object({
  // Existing fields
  // ...
  
  // New fields
  paymentStatus: z.enum(['pending', 'completed']).default('pending'),
  contractStatus: z.enum(['pending', 'generated', 'signed']).default('pending'),
  initialInspectionStatus: z.enum(['pending', 'completed']).default('pending'),
  finalInspectionStatus: z.enum(['pending', 'completed']).default('pending'),
  
  // Financial tab fields
  paymentProof: z.array(z.instanceof(File)).optional(),
  paymentDate: z.date().optional(),
  paymentAmount: z.number().optional(),
  
  // Inspection fields
  initialInspectionNotes: z.string().optional(),
  initialInspectionImages: z.array(z.instanceof(File)).optional(),
  finalInspectionNotes: z.string().optional(),
  finalInspectionImages: z.array(z.instanceof(File)).optional(),
});
```

### Step 2: Create ClientInfoTab
- Merge the existing CustomerInfoTab and DocumentsTab
- Create a new component that combines client information and document upload

### Step 3: Create FinancialTab
- Create a new component for financial information
- Include fields for payment status, payment amount, and payment proof

### Step 4: Create InitialInspectionTab
- Create a new component for initial equipment inspection
- Include fields for inspection notes and image upload

### Step 5: Create ContractDocumentsTab
- Create a new component for contract and internal documents
- Include contract generation functionality

### Step 6: Create FinalInspectionTab
- Create a new component for final equipment inspection
- Include fields for inspection notes and image upload

### Step 7: Update RentOrderDialog Component
- Update the RentOrderDialog component to include all new tabs
- Implement conditional rendering based on user role

## Phase 4: API Endpoints

### Step 1: Update Rent Order Submission
- Update the submitRentalRequest function to include new fields
- Add user_id to the request

### Step 2: Create API for Equipment Inspections
- Create an API endpoint for submitting equipment inspections
- Include role-based access control

### Step 3: Create API for Document Upload
- Create an API endpoint for uploading documents
- Include role-based access control

## Phase 5: Testing

### Step 1: Test Role-Based Access
- Test that users can only access tabs and features based on their role
- Verify that unauthorized access is properly blocked

### Step 2: Test Workflow Progression
- Test the complete workflow from budget request to final inspection
- Verify that status updates correctly at each stage

### Step 3: Test Data Integrity
- Test that all data is properly saved and retrieved
- Verify that relationships between tables are maintained

## Prioritized TODO List

1. **Database Schema Updates**
   - [ ] Update rental_requests table with workflow fields
   - [ ] Create equipment_inspections table
   - [ ] Create rental_documents table

2. **Type Definitions**
   - [ ] Update AuthUser type with role information
   - [ ] Update RentalRequest type with workflow fields
   - [ ] Create EquipmentInspection type
   - [ ] Create RentalDocument type

3. **Authentication Updates**
   - [ ] Update registration process to include role selection
   - [ ] Update middleware for role-based access control

4. **Basic UI Components**
   - [ ] Update form schema with new fields
   - [ ] Create ClientInfoTab (merge existing tabs)
   - [ ] Update RentOrderDialog component with conditional rendering

5. **Financial Workflow**
   - [ ] Create FinancialTab component
   - [ ] Update API for financial information

6. **Inspection Workflow**
   - [ ] Create InitialInspectionTab component
   - [ ] Create FinalInspectionTab component
   - [ ] Create API for equipment inspections

7. **Contract Workflow**
   - [ ] Create ContractDocumentsTab component
   - [ ] Create API for document upload
   - [ ] Implement contract generation functionality

8. **Testing and Refinement**
   - [ ] Test role-based access control
   - [ ] Test workflow progression
   - [ ] Test data integrity
   - [ ] Refine UI based on testing feedback
