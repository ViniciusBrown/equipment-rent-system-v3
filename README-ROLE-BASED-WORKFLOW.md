# Role-Based Rent Order Workflow Implementation

This document outlines the implementation plan for enhancing the Equipment Rental System with a role-based workflow for processing rent orders.

## Overview

The new system will implement a comprehensive workflow for rent orders, from budget request to equipment return and inspection. Access to different parts of the workflow will be restricted based on user roles.

## User Roles

The system will support the following user roles:

1. **Client**
   - Can submit rent order budget requests
   - Can view their own rent orders
   - Access limited to Client Information and Equipment Selection tabs

2. **Equipment Inspector**
   - Can access Rent Order General tab
   - Can perform equipment initial and final inspections
   - Access to Equipment Initial Inspection and Final Inspection tabs

3. **Financial Inspector**
   - Can approve budgets and set pricing
   - Can mark orders as paid
   - Access to all tabs except Contract and Internal Documents

4. **Manager**
   - Full access to all tabs and features
   - Can perform all operations in the system

## Workflow Stages

### 1. Budget Analysis
- Client submits rent order with equipment needs and identification information
- System assigns "Pending" status to the order
- Financial Inspector or Manager reviews the request and provides cost estimate

### 2. Financial and Contract Creation
- Financial Inspector/Manager approves budget and changes status to "Approved"
- System sends email notification to client
- Financial Inspector/Manager can mark order as paid
- Contract generation functionality

### 3. Equipment Initial Inspection
- Equipment Inspector documents initial equipment condition
- Images and notes stored for each equipment item

### 4. Equipment Return Inspection
- Equipment Inspector documents final equipment condition
- Comparison with initial inspection to identify any issues

## Database Schema Changes

### 1. User Table Enhancements
- Add role field with predefined values: 'client', 'equipment_inspector', 'financial_inspector', 'manager'

### 2. Rental Requests Table Enhancements
- Add fields for tracking workflow stages:
  - `payment_status`: 'pending', 'completed'
  - `contract_status`: 'pending', 'generated', 'signed'
  - `initial_inspection_status`: 'pending', 'completed'
  - `final_inspection_status`: 'pending', 'completed'

### 3. New Tables
- `equipment_inspections`: Store inspection details for each equipment
- `rental_documents`: Store documents related to rent orders

## UI Changes

### 1. RentOrderDialog Enhancements
- Merge Client Information and Documents tabs
- Add new tabs:
  - Financial tab
  - Equipment Initial Inspection tab
  - Contract and Documents tab
  - Equipment Final Inspection tab

### 2. Tab Access Control
- Implement conditional rendering based on user role
- Show/hide tabs and actions based on permissions

### 3. Workflow Status Indicators
- Visual indicators for each stage of the workflow
- Progress tracking for rent orders

## Implementation Steps

1. **Database Schema Updates**
   - Update user table to include role field
   - Enhance rental_requests table with workflow fields
   - Create new tables for inspections and documents

2. **Authentication and Authorization**
   - Update registration process to include role selection (for admin users)
   - Implement role-based access control in middleware
   - Update AuthContext to include role information

3. **UI Components**
   - Create new tab components for each workflow stage
   - Implement conditional rendering based on user role
   - Develop form components for each workflow stage

4. **Backend Logic**
   - Implement API endpoints for each workflow stage
   - Create email notification system
   - Develop contract generation functionality

5. **Testing**
   - Test role-based access control
   - Verify workflow progression
   - Ensure data integrity throughout the process

## Technical Considerations

1. **Role-Based Access Control**
   - Use Supabase Row Level Security (RLS) policies
   - Implement client-side access control in React components

2. **File Storage**
   - Use Supabase Storage for document and image uploads
   - Implement secure access controls for files

3. **Email Notifications**
   - Integrate with email service provider
   - Create email templates for different workflow stages

4. **Contract Generation**
   - Implement PDF generation for contracts
   - Include dynamic data from rent order

## TODO List

1. **Database Updates**
   - [ ] Add role field to users table
   - [ ] Update rental_requests table with workflow fields
   - [ ] Create equipment_inspections table
   - [ ] Create rental_documents table

2. **Authentication**
   - [ ] Update AuthContext to include role information
   - [ ] Modify registration to include role selection (admin only)
   - [ ] Update middleware for role-based route protection

3. **UI Components**
   - [ ] Merge Client Information and Documents tabs
   - [ ] Create Financial tab component
   - [ ] Create Equipment Initial Inspection tab component
   - [ ] Create Contract and Documents tab component
   - [ ] Create Equipment Final Inspection tab component
   - [ ] Implement role-based conditional rendering

4. **Backend Logic**
   - [ ] Create API endpoints for workflow stages
   - [ ] Implement email notification system
   - [ ] Develop contract generation functionality

5. **Testing**
   - [ ] Test role-based access control
   - [ ] Verify workflow progression
   - [ ] Ensure data integrity throughout the process

## Conclusion

This implementation will enhance the Equipment Rental System with a comprehensive workflow that matches the company's business processes. The role-based access control ensures that users only have access to the parts of the system relevant to their responsibilities.
