# Tab Components Specification

This document provides detailed specifications for each tab component in the new role-based RentOrderDialog.

## 1. ClientInfoTab

This tab combines the existing CustomerInfoTab and DocumentsTab, providing a comprehensive view of client information and related documents.

### Features
- Client personal information (name, email, phone)
- Rental dates selection
- Special requirements input
- Document upload section
- Display of previously uploaded documents

### UI Elements
- Text input fields for client information
- Date pickers for rental start and end dates
- Textarea for special requirements
- File upload area with drag-and-drop support
- List of uploaded documents with preview and delete options

### Implementation Notes
- Merge the existing CustomerInfoTab and DocumentsTab components
- Ensure all form fields are properly connected to the form controller
- Implement document preview functionality
- Add validation for all required fields

## 2. EquipmentTab

This tab remains largely unchanged, allowing users to select equipment items for rental.

### Features
- Equipment selection with search functionality
- Quantity adjustment for each equipment item
- Display of selected equipment with details
- Total estimated cost calculation

### UI Elements
- Equipment search input
- Equipment list with filtering options
- Quantity controls for each equipment item
- Selected equipment list with remove option
- Estimated cost display

### Implementation Notes
- Keep the existing functionality
- Ensure proper integration with the updated form schema
- Add validation for equipment selection

## 3. FinancialTab

This new tab handles the financial aspects of the rental order, including budget approval and payment tracking.

### Features
- Budget approval workflow
- Cost estimation and adjustment
- Payment status tracking
- Payment proof upload
- Email notification trigger for client

### UI Elements
- Cost input field (editable by financial inspector and manager)
- Status selector (pending, approved, rejected)
- Payment status indicator
- Payment proof upload area
- Send notification button

### Implementation Notes
- Only visible to users with financial_inspector or manager roles
- Implement conditional editing based on user role
- Add validation for financial information
- Integrate with email notification system

## 4. InitialInspectionTab

This new tab handles the initial inspection of equipment before rental.

### Features
- Equipment condition documentation
- Photo upload for each equipment item
- Notes and comments for each equipment
- Inspection status tracking

### UI Elements
- Equipment list from the rental order
- Photo upload area for each equipment item
- Notes input for each equipment item
- Inspection status selector
- Save inspection button

### Implementation Notes
- Only visible to users with equipment_inspector, financial_inspector, or manager roles
- Implement multi-photo upload for each equipment item
- Add validation for required inspection fields
- Store inspection data in the equipment_inspections table

## 5. ContractDocumentsTab

This new tab handles contract generation and management of internal documents.

### Features
- Contract generation based on rental information
- Contract download and printing
- Internal document upload and management
- Document categorization

### UI Elements
- Generate contract button
- Contract preview area
- Document upload area with category selection
- List of uploaded documents with preview and delete options
- Document sharing options

### Implementation Notes
- Only visible to users with manager role
- Implement PDF generation for contracts
- Add validation for document uploads
- Store document data in the rental_documents table

## 6. FinalInspectionTab

This new tab handles the final inspection of equipment after rental return.

### Features
- Equipment return condition documentation
- Comparison with initial inspection
- Photo upload for each equipment item
- Notes and comments for each equipment
- Inspection status tracking

### UI Elements
- Equipment list from the rental order
- Initial inspection data display
- Photo upload area for each equipment item
- Notes input for each equipment item
- Inspection status selector
- Save inspection button

### Implementation Notes
- Only visible to users with equipment_inspector, financial_inspector, or manager roles
- Implement multi-photo upload for each equipment item
- Add validation for required inspection fields
- Store inspection data in the equipment_inspections table
- Add comparison functionality with initial inspection

## Component Relationships

### Data Flow
1. Client information and equipment selection flow to all other tabs
2. Financial information affects contract generation
3. Initial inspection data is used for comparison in final inspection
4. All data is stored in the database with appropriate relationships

### Role-Based Access
- **Client**: Access to ClientInfoTab and EquipmentTab only
- **Equipment Inspector**: Access to ClientInfoTab, EquipmentTab, InitialInspectionTab, and FinalInspectionTab
- **Financial Inspector**: Access to all tabs except ContractDocumentsTab
- **Manager**: Access to all tabs

## UI/UX Considerations

### Tab Navigation
- Tabs should be arranged in logical workflow order
- Disabled tabs should be visually distinct but still visible
- Current tab should be clearly highlighted

### Form Validation
- Each tab should validate its own fields
- Submit button should be disabled if any required fields are invalid
- Validation errors should be clearly displayed

### Responsive Design
- All tabs should be responsive and work well on different screen sizes
- Consider collapsible sections for complex tabs
- Ensure touch-friendly controls for mobile users

## Implementation Priority

1. ClientInfoTab (merged from existing tabs)
2. EquipmentTab (existing, minor updates)
3. FinancialTab (new, critical for workflow)
4. InitialInspectionTab (new)
5. ContractDocumentsTab (new)
6. FinalInspectionTab (new)

This prioritization allows for incremental implementation and testing of the workflow.
