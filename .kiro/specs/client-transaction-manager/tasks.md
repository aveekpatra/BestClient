# Implementation Plan

- [x] 1. Set up database schema and core utilities
  - Extend Convex schema with clients and works tables including proper indexes
  - Create utility functions for Indian currency formatting (₹) and DD/MM/YYYY date handling
  - Set up TypeScript types for Client, Work, WorkType, and PaymentStatus
  - _Requirements: 2.2, 2.3, 3.2, 3.3, 6.2_

- [x] 2. Implement authentication and basic layout
  - Create login page with shadcn/ui Form components using Convex Auth Password provider
  - Build main app layout with clean navigation using shadcn/ui components
  - Implement protected route wrapper and authentication state management
  - Create responsive header and navigation components with mobile-first design
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

- [x] 3. Build client management functionality


- [x] 3.1 Create client data operations
  - Implement Convex functions for client CRUD operations (create, read, update, delete)
  - Add client validation functions for PAN, Aadhar, phone, and email formats
  - Create client balance calculation and update functions
  - Write unit tests for client data operations
  - _Requirements: 2.5, 2.6, 2.7, 2.8_

- [x] 3.2 Build client list and filtering interface
  - Create ClientList component using shadcn/ui Table with pagination
  - Implement sorting functionality by balance, income, address, work type, and name
  - Build filter controls using shadcn/ui Select and Input components
  - Add client search functionality with real-time filtering
  - _Requirements: 2.1, 4.1, 4.2, 4.5, 4.6_

- [x] 3.3 Create client form and detail views
  - Build ClientForm component with all required fields using shadcn/ui Form components
  - Implement client creation and editing with proper validation
  - Create ClientDetails component showing client info and transaction history
  - Add client deletion with confirmation dialog using shadcn/ui Dialog
  - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.7, 2.8_

- [ ] 4. Implement work transaction management
- [ ] 4.1 Create work data operations
  - Implement Convex functions for work CRUD operations with client relationship
  - Add automatic balance calculation (total price - paid amount)
  - Create payment status determination logic (paid, partial, unpaid)
  - Implement client balance update when works are added/modified/deleted
  - Write unit tests for work data operations and balance calculations
  - _Requirements: 3.3, 3.4, 3.6, 3.7, 6.2, 6.6_

- [ ] 4.2 Build work list and filtering interface
  - Create WorkList component using shadcn/ui Table with pagination and payment status display
  - Implement sorting by date, amount, client, work type, and payment status
  - Build filter controls for date range, client, amount range, work type, and payment status
  - Add work search functionality with multiple filter combinations
  - _Requirements: 3.1, 3.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4.3 Create work form and management interface
  - Build WorkForm component with client selection, date picker, and amount inputs
  - Implement work creation and editing with automatic balance calculation
  - Create payment status badge component using shadcn/ui Badge
  - Add work deletion with confirmation and balance recalculation
  - _Requirements: 3.2, 3.3, 3.5, 3.6, 3.7_

- [ ] 5. Build statistics and analytics dashboard
- [ ] 5.1 Create analytics data functions
  - Implement Convex functions for overview statistics (total clients, works, income, due amounts)
  - Create functions for income analytics by time period and work type
  - Build client analytics functions (best clients, client distribution)
  - Implement service analytics functions (popular services by income)
  - Add payment analytics functions (due money, collection efficiency)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.2 Build statistics dashboard interface
  - Create StatisticsOverview component with key metrics using shadcn/ui Cards
  - Implement IncomeChart component with Recharts integration for clean visualization
  - Build ClientAnalytics component showing best clients and distribution
  - Create ServiceAnalytics component with service performance charts
  - Add PaymentAnalytics component with due amounts and payment status
  - Implement date range selector for analytics filtering
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 6. Implement balance tracking and client profiles
- [ ] 6.1 Create balance calculation system
  - Implement real-time balance updates when works are modified
  - Create client balance history tracking
  - Build balance validation and consistency checks
  - Add balance filtering functionality (positive, negative, zero balances)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

- [ ] 6.2 Build client profile and history views
  - Create detailed client profile page with current balance and work history
  - Implement work history timeline with running balance calculations
  - Add payment status indicators and overdue work highlighting
  - Build client balance summary with clear owing indicators
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 7. Create PDF receipt generation system
- [ ] 7.1 Build receipt selection interface
  - Create work selection checkboxes in WorkList component
  - Implement multi-select functionality for receipt generation
  - Build ReceiptGenerator component with selected works preview
  - Add client grouping for multi-work receipts
  - _Requirements: 7.1, 7.4_

- [ ] 7.2 Implement PDF generation functionality
  - Create professional PDF receipt template with business letterhead
  - Implement single and multi-transaction receipt generation
  - Add proper Indian currency formatting and date formatting in PDFs
  - Create receipt download functionality with proper file naming
  - Build receipt preview component before generation
  - _Requirements: 7.2, 7.3, 7.5, 7.6, 7.7_

- [ ] 8. Enhance UI/UX and mobile responsiveness
- [ ] 8.1 Implement responsive design
  - Ensure all components work properly on mobile devices with touch optimization
  - Create mobile-friendly navigation and layout adjustments
  - Implement proper responsive tables and forms
  - Add mobile-specific interaction patterns
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 8.2 Add loading states and error handling
  - Implement loading skeletons using shadcn/ui Skeleton components
  - Create comprehensive error handling with shadcn/ui Alert components
  - Add form validation with real-time feedback
  - Implement proper error boundaries and recovery mechanisms
  - _Requirements: 8.3, 8.4, 8.6_

- [ ] 9. Testing and optimization
- [ ] 9.1 Write comprehensive tests
  - Create unit tests for utility functions (currency, date formatting)
  - Write component tests for forms and data display components
  - Implement integration tests for Convex functions
  - Add end-to-end tests for critical user workflows
  - _Requirements: All requirements validation_

- [ ] 9.2 Performance optimization and final polish
  - Optimize component rendering with React.memo and useMemo
  - Implement proper data pagination and lazy loading
  - Add performance monitoring and error tracking
  - Conduct final UI/UX review and polish
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
