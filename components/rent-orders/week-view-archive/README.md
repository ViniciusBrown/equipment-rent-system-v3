# Week View Components (Archived)

This folder contains the Week view components that were removed from the main application UI but preserved for potential future use.

## Components in this folder:

- `WeekViewRentOrderCard.tsx`: Card component used in Week view
- `WeekViewCardContent.tsx`: Content component for Week view cards

## How to restore Week view:

1. In `RentOrdersScheduler.tsx`:
   - Uncomment the imports for Week view components
   - Restore the view mode state to allow switching between views
   - Uncomment the view mode selector buttons
   - Restore the conditional rendering in the `renderCard` function
   - Uncomment the switch statements in navigation and column generation functions

2. Make sure the Week view components are properly imported and accessible.

3. Test the Week view functionality to ensure it works correctly.

The Week view was archived as per user request to focus on Month view as the main calendar view.
