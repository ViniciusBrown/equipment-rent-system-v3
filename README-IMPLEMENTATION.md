# Role-Based Rent Order Workflow Implementation

This project enhances the Equipment Rental System with a comprehensive role-based workflow for processing rent orders, from budget request to equipment return and inspection.

## Overview

The new system implements a step-by-step workflow that matches the company's business processes:

1. **Budget Analysis**: Clients submit rental requests with equipment needs
2. **Financial and Contract Creation**: Financial staff approves budgets and processes payments
3. **Equipment Initial Inspection**: Equipment condition is documented before rental
4. **Equipment Return Inspection**: Equipment condition is documented after return

Access to different parts of the workflow is restricted based on user roles:

- **Client**: Can submit requests and view their own orders
- **Equipment Inspector**: Can perform equipment inspections
- **Financial Inspector**: Can approve budgets and process payments
- **Manager**: Has full access to all features

## Implementation Documents

This repository contains several documents detailing the implementation plan:

1. [README-ROLE-BASED-WORKFLOW.md](./README-ROLE-BASED-WORKFLOW.md) - High-level overview of the implementation
2. [TECHNICAL-IMPLEMENTATION-PLAN.md](./TECHNICAL-IMPLEMENTATION-PLAN.md) - Detailed technical specifications
3. [IMPLEMENTATION-STEPS.md](./IMPLEMENTATION-STEPS.md) - Step-by-step implementation guide
4. [TAB-COMPONENTS-SPEC.md](./TAB-COMPONENTS-SPEC.md) - Detailed specifications for UI components
5. [database-migration.sql](./database-migration.sql) - SQL script for database schema updates

## Database Changes

The implementation requires several database changes:

1. **Update Rental Requests Table**: Add workflow tracking fields
2. **Create Equipment Inspections Table**: Store inspection details
3. **Create Rental Documents Table**: Store documents related to rent orders
4. **Row Level Security Policies**: Implement role-based access control

## UI Changes

The RentOrderDialog component will be enhanced with new tabs:

1. **Client Info Tab**: Merged client information and documents
2. **Equipment Tab**: Equipment selection (unchanged)
3. **Financial Tab**: Budget approval and payment tracking
4. **Initial Inspection Tab**: Equipment condition before rental
5. **Contract Documents Tab**: Contract generation and management
6. **Final Inspection Tab**: Equipment condition after return

## Implementation Steps

The implementation will be carried out in phases:

1. **Database Schema Updates**: Update tables and create new ones
2. **Type Definitions**: Update TypeScript types to match database schema
3. **Authentication Updates**: Implement role-based access control
4. **UI Components**: Create new tab components and update existing ones
5. **API Endpoints**: Create new endpoints for workflow stages
6. **Testing**: Verify role-based access and workflow progression

## Getting Started

To implement this project, follow these steps:

1. Run the database migration script:
   ```bash
   psql -h your-supabase-host -d postgres -U postgres -f database-migration.sql
   ```

2. Update the TypeScript type definitions as specified in the technical plan

3. Implement the UI components following the specifications in the tab components spec

4. Update the authentication system to include role-based access control

5. Test the implementation thoroughly to ensure all features work as expected

## Technical Considerations

- **Role-Based Access Control**: Implemented using Supabase Row Level Security
- **File Storage**: Uses Supabase Storage for document and image uploads
- **Form Validation**: Uses Zod for schema validation
- **UI Components**: Built with Shadcn UI components

## Conclusion

This implementation will enhance the Equipment Rental System with a comprehensive workflow that matches the company's business processes. The role-based access control ensures that users only have access to the parts of the system relevant to their responsibilities.
