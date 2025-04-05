# Rent Orders Components

This folder contains the components used for the Rent Orders functionality in the application.

## Main Components:

- `RentOrdersScheduler.tsx`: Main scheduler component that displays rent orders in a calendar view
- `CalendarScheduler.tsx`: Generic calendar component that can display different views
- `MonthViewRentOrderCard.tsx`: Card component used in Month view

## Recent Changes:

- **Week view removed**: The Week view has been removed from the UI, but the components have been preserved in the `week-view-archive` folder for potential future use.
- **Month view as main focus**: The application now uses Month view as the only calendar view.

## How to Restore Week View:

If you need to restore the Week view in the future, follow the instructions in the comments within the `RentOrdersScheduler.tsx` file and refer to the README in the `week-view-archive` folder.
