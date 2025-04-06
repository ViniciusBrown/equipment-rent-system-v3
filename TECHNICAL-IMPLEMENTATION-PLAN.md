# Technical Implementation Plan for Role-Based Rent Order Workflow

This document outlines the specific technical changes needed to implement the role-based workflow for the Equipment Rental System.

## Database Schema Changes

### 1. Update Users Table

We need to ensure the Supabase Auth users table has the correct role field. The `role` field already exists in the auth.users table, but we need to ensure it's being set correctly during registration.

```sql
-- Create an enum type for user roles
CREATE TYPE user_role AS ENUM ('client', 'equipment_inspector', 'financial_inspector', 'manager');

-- Update the auth.users table to use this enum (if needed)
-- Note: Supabase Auth already has a role field, we'll use that
```

### 2. Update Rental Requests Table

```sql
-- Add workflow tracking fields to rental_requests table
ALTER TABLE public.rental_requests 
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN contract_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN initial_inspection_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN final_inspection_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

### 3. Create Equipment Inspections Table

```sql
-- Create table for equipment inspections
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

### 4. Create Rental Documents Table

```sql
-- Create table for rental documents
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

## TypeScript Type Definitions

### 1. Update User Types

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

### 2. Update Rental Request Types

```typescript
// lib/supabase/database.types.ts
export type RentalRequest = {
  id?: number | string;
  full_name: string;
  email: string;
  phone: string;
  equipment_items: Array<{
    id: string;
    name: string;
    daily_rate: number;
    quantity: number;
  }>;
  rental_start: string;
  rental_end: string;
  special_requirements?: string;
  estimated_cost: number;
  status: "pending" | "approved" | "rejected" | "completed";
  reference_number: string;
  document_urls?: string[];
  created_at?: string;
  // New fields
  payment_status: "pending" | "completed";
  contract_status: "pending" | "generated" | "signed";
  initial_inspection_status: "pending" | "completed";
  final_inspection_status: "pending" | "completed";
  user_id: string;
};
```

### 3. Create Equipment Inspection Types

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

### 4. Create Rental Document Types

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

## Component Changes

### 1. Update RentOrderDialog Component

```typescript
// components/rent-orders/RentOrderDialog/RentOrderDialog.tsx
// Update the tabs structure to include new tabs and conditional rendering based on user role

// Import new tab components
import { ClientInfoTab } from './ClientInfoTab';
import { EquipmentTab } from './EquipmentTab';
import { FinancialTab } from './FinancialTab';
import { InitialInspectionTab } from './InitialInspectionTab';
import { ContractDocumentsTab } from './ContractDocumentsTab';
import { FinalInspectionTab } from './FinalInspectionTab';
import { useAuth } from '@/lib/auth';

// Inside the component
const { user } = useAuth();
const userRole = user?.role || 'client';

// Determine which tabs to show based on user role
const showClientInfoTab = true; // All roles can see this
const showEquipmentTab = true; // All roles can see this
const showFinancialTab = ['financial_inspector', 'manager'].includes(userRole);
const showInitialInspectionTab = ['equipment_inspector', 'financial_inspector', 'manager'].includes(userRole);
const showContractDocumentsTab = ['manager'].includes(userRole);
const showFinalInspectionTab = ['equipment_inspector', 'financial_inspector', 'manager'].includes(userRole);

// In the JSX
<Tabs defaultValue="client-info" className="w-full">
  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${getVisibleTabsCount()}, 1fr)` }}>
    <TabsTrigger value="client-info">Informações do Cliente</TabsTrigger>
    <TabsTrigger value="equipment">Seleção de Equipamentos</TabsTrigger>
    {showFinancialTab && <TabsTrigger value="financial">Financeiro</TabsTrigger>}
    {showInitialInspectionTab && <TabsTrigger value="initial-inspection">Inspeção Inicial</TabsTrigger>}
    {showContractDocumentsTab && <TabsTrigger value="contract-documents">Contrato e Documentos</TabsTrigger>}
    {showFinalInspectionTab && <TabsTrigger value="final-inspection">Inspeção Final</TabsTrigger>}
  </TabsList>

  <div className="h-[500px] overflow-hidden flex-grow">
    {/* Client Info Tab */}
    <TabsContent value="client-info" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
      <div className="space-y-4">
        <ClientInfoTab form={form} initialData={initialData} />
      </div>
    </TabsContent>

    {/* Equipment Selection Tab */}
    <TabsContent value="equipment" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
      <div className="space-y-4">
        <EquipmentTab form={form} />
      </div>
    </TabsContent>

    {/* Financial Tab */}
    {showFinancialTab && (
      <TabsContent value="financial" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
        <div className="space-y-4">
          <FinancialTab form={form} initialData={initialData} />
        </div>
      </TabsContent>
    )}

    {/* Initial Inspection Tab */}
    {showInitialInspectionTab && (
      <TabsContent value="initial-inspection" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
        <div className="space-y-4">
          <InitialInspectionTab form={form} initialData={initialData} />
        </div>
      </TabsContent>
    )}

    {/* Contract and Documents Tab */}
    {showContractDocumentsTab && (
      <TabsContent value="contract-documents" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
        <div className="space-y-4">
          <ContractDocumentsTab form={form} initialData={initialData} />
        </div>
      </TabsContent>
    )}

    {/* Final Inspection Tab */}
    {showFinalInspectionTab && (
      <TabsContent value="final-inspection" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
        <div className="space-y-4">
          <FinalInspectionTab form={form} initialData={initialData} />
        </div>
      </TabsContent>
    )}
  </div>
</Tabs>
```

### 2. Create New Tab Components

#### ClientInfoTab (Merged Client Info and Documents)

```typescript
// components/rent-orders/RentOrderDialog/ClientInfoTab.tsx
// Merge the existing CustomerInfoTab and DocumentsTab
```

#### FinancialTab

```typescript
// components/rent-orders/RentOrderDialog/FinancialTab.tsx
// Create new component for financial information
```

#### InitialInspectionTab

```typescript
// components/rent-orders/RentOrderDialog/InitialInspectionTab.tsx
// Create new component for initial equipment inspection
```

#### ContractDocumentsTab

```typescript
// components/rent-orders/RentOrderDialog/ContractDocumentsTab.tsx
// Create new component for contract and internal documents
```

#### FinalInspectionTab

```typescript
// components/rent-orders/RentOrderDialog/FinalInspectionTab.tsx
// Create new component for final equipment inspection
```

### 3. Update Form Schema

```typescript
// components/rent-orders/RentOrderDialog/types.ts
// Update the form schema to include new fields

export const formSchema = z.object({
  id: z.number().optional(),
  fullName: z.string().min(2, { message: 'Nome completo é obrigatório' }),
  email: z.string().email({ message: 'Endereço de email inválido' }),
  phone: z.string().min(5, { message: 'Número de telefone é obrigatório' }),
  rentalStart: z.date({ required_error: 'Data de início do aluguel é obrigatória' }),
  rentalEnd: z.date({ required_error: 'Data de fim do aluguel é obrigatória' }),
  specialRequirements: z.string().optional(),
  estimatedCost: z.number().min(0),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  referenceNumber: z.string().optional(),
  equipmentItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      daily_rate: z.number(),
      quantity: z.number().min(1),
      stock: z.string().optional(),
    })
  ).default([]),
  documents: z.array(z.instanceof(File)).optional(),
  
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

## Authentication and Authorization Updates

### 1. Update Registration Process

```typescript
// app/register/page.tsx
// Add role selection for admin users (can be hidden behind an admin flag)

// Add role field to form schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: 'O nome deve ter pelo menos 3 caracteres.',
  }),
  email: z.string().email({
    message: 'Por favor, insira um endereço de e-mail válido.',
  }),
  password: z.string().min(8, {
    message: 'A senha deve ter pelo menos 8 caracteres.',
  }),
  confirmPassword: z.string(),
  role: z.enum(['client', 'equipment_inspector', 'financial_inspector', 'manager']).default('client'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

// Update signUp function in auth.tsx
const signUp = async (email: string, password: string, name: string, role: string = 'client') => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });
  return { data, error };
};
```

### 2. Update Middleware for Role-Based Access

```typescript
// middleware.ts
// Update middleware to check user roles for protected routes

// Define role-based route access
const routeAccess = {
  '/': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/profile': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/my-orders': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/admin': ['manager'],
  '/inspections': ['equipment_inspector', 'financial_inspector', 'manager'],
  '/financial': ['financial_inspector', 'manager'],
};

// In the middleware function
// Check if the user has the required role for the route
const userRole = session?.user?.role || 'client';
const hasAccess = Object.entries(routeAccess).some(([route, roles]) => {
  if (pathname === route || (route !== '/' && pathname.startsWith(route))) {
    return roles.includes(userRole);
  }
  return false;
});

// If the user doesn't have access, redirect to unauthorized page
if (!hasAccess) {
  return NextResponse.redirect(new URL('/unauthorized', req.url));
}
```

## API Endpoints

### 1. Update Rent Order Submission

```typescript
// app/actions.ts
// Update the submitRentalRequest function to include new fields

export async function submitRentalRequest(formData: FormData): Promise<{ success: boolean; message?: string; referenceNumber?: string }> {
  // Extract form data
  // ...

  // Add user_id to the request
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  // Create the rental request with new fields
  const { data, error } = await supabase
    .from('rental_requests')
    .insert({
      full_name: fullName,
      email,
      phone,
      equipment_items: equipmentItems,
      rental_start: rentalStart,
      rental_end: rentalEnd,
      special_requirements: specialRequirements,
      estimated_cost: estimatedCost,
      status,
      reference_number: referenceNumber,
      document_urls: documentUrls,
      // New fields
      payment_status: 'pending',
      contract_status: 'pending',
      initial_inspection_status: 'pending',
      final_inspection_status: 'pending',
      user_id: userId,
    })
    .select();

  // ...
}
```

### 2. Create API for Equipment Inspections

```typescript
// app/api/inspections/route.ts
// Create API endpoint for equipment inspections

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const userRole = session.user.role;
  if (!['equipment_inspector', 'financial_inspector', 'manager'].includes(userRole)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { rentalRequestId, equipmentId, inspectionType, notes, imageUrls } = await request.json();
  
  const { data, error } = await supabase
    .from('equipment_inspections')
    .insert({
      rental_request_id: rentalRequestId,
      equipment_id: equipmentId,
      inspection_type: inspectionType,
      inspector_id: session.user.id,
      notes,
      image_urls: imageUrls,
    })
    .select();
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Implementation Order

1. **Database Schema Updates**
   - Update rental_requests table
   - Create equipment_inspections table
   - Create rental_documents table

2. **Type Definitions**
   - Update AuthUser type
   - Update RentalRequest type
   - Create EquipmentInspection type
   - Create RentalDocument type

3. **Authentication Updates**
   - Update registration process
   - Update middleware for role-based access

4. **UI Components**
   - Create ClientInfoTab (merge existing tabs)
   - Create FinancialTab
   - Create InitialInspectionTab
   - Create ContractDocumentsTab
   - Create FinalInspectionTab
   - Update RentOrderDialog component

5. **API Endpoints**
   - Update submitRentalRequest function
   - Create equipment inspection API
   - Create document upload API

6. **Testing**
   - Test role-based access
   - Test workflow progression
   - Test data integrity
