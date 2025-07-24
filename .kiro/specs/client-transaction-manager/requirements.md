# Requirements Document

## Introduction

A simple client transaction and balance management webapp designed for single-user small business operations in India. The application serves as a personal actionable database that allows the business owner to manage client information and track financial transactions with comprehensive filtering, sorting, and statistical analysis capabilities. The system uses Indian Rupees (₹) as currency, Indian date format (DD/MM/YYYY), and supports various business types common in the Indian market. The system uses Convex.dev for backend services, Next.js for the frontend, and implements authentication through Convex Auth with username/password credentials for the business owner's exclusive use.

## Requirements

### Requirement 1

**User Story:** As the business owner, I want to authenticate securely into my personal business management system, so that I can access my business data privately and securely.

#### Acceptance Criteria

1. WHEN I visit the application THEN the system SHALL display a login form with username and password fields
2. WHEN I enter valid credentials THEN the system SHALL authenticate me using Convex Auth and grant access to the main application
3. WHEN I enter invalid credentials THEN the system SHALL display an error message and prevent access
4. WHEN I close the browser THEN the system SHALL maintain my session for a reasonable duration
5. WHEN I log out THEN the system SHALL clear my session and redirect to the login page

### Requirement 2

**User Story:** As the business owner, I want to create and manage a list of clients with comprehensive Indian business-relevant properties, so that I can maintain organized customer records with proper identification and work categorization.

#### Acceptance Criteria

1. WHEN I access the clients section THEN the system SHALL display a paginated list of all existing clients using shadcn list and pagination components
2. WHEN I click "Add Client" THEN the system SHALL display a form with client properties (name, date of birth, address, phone, email, PAN number, Aadhar number, usual work type, balance)
3. WHEN I select work type THEN the system SHALL provide options: online work, health insurance, life insurance, income tax, mutual funds, and others
4. WHEN I enter balance THEN the system SHALL indicate whether I owe money to the client (negative) or client owes money to me (positive)
5. WHEN I submit a valid client form THEN the system SHALL save the client to the database and update the client list
6. WHEN I click on an existing client THEN the system SHALL display an editable form with the client's current information
7. WHEN I update client information THEN the system SHALL save the changes and reflect them in the client list
8. WHEN I attempt to delete a client THEN the system SHALL prompt for confirmation before removing the client and associated data

### Requirement 3

**User Story:** As the business owner, I want to create and manage work transactions linked to specific clients, so that I can track financial activities and payment status for each customer.

#### Acceptance Criteria

1. WHEN I access the works section THEN the system SHALL display a paginated list of all work transactions with client information and payment status using shadcn components
2. WHEN I click "Add Work" THEN the system SHALL display a form with work properties (client selection, transaction date in DD/MM/YYYY format, total price in ₹, paid amount in ₹, work type, description, payment status)
3. WHEN I enter total price and paid amount THEN the system SHALL automatically calculate the balance (total price - paid amount) and determine payment status (Paid, Partial, Unpaid)
4. WHEN I submit a valid work form THEN the system SHALL save the work transaction linked to the selected client and update client balance
5. WHEN I view a work transaction THEN the system SHALL display the associated client information, payment status, and balance details
6. WHEN I edit a work transaction THEN the system SHALL allow modification of all properties and recalculate balances and payment status accordingly
7. WHEN I delete a work transaction THEN the system SHALL remove it after confirmation and update related balance calculations

### Requirement 4

**User Story:** As the business owner, I want to sort and filter both clients and work transactions, so that I can quickly find specific information and analyze my data effectively.

#### Acceptance Criteria

1. WHEN I view the clients list THEN the system SHALL provide sorting options by balance, income generated, address, work type, name, and date of birth
2. WHEN I apply filters to clients THEN the system SHALL display only clients matching criteria (work type, balance range, address location, PAN/Aadhar status)
3. WHEN I view the works list THEN the system SHALL provide sorting options by transaction date, total price, paid amount, balance, client name, work type, and payment status
4. WHEN I apply filters to works THEN the system SHALL display only works matching criteria (date range, client, amount range, work type, payment status)
5. WHEN I combine multiple filters THEN the system SHALL apply all filters simultaneously with proper pagination
6. WHEN I clear filters THEN the system SHALL return to the unfiltered view with default sorting

### Requirement 5

**User Story:** As the business owner, I want to view comprehensive statistical graphs and analytics in Indian Rupees, so that I can understand my business performance, client relationships, and service popularity.

#### Acceptance Criteria

1. WHEN I access the statistics section THEN the system SHALL display key metrics (total clients, total works, total income in ₹, outstanding due amounts in ₹)
2. WHEN I view income analytics THEN the system SHALL show graphs for total income over time, monthly/yearly revenue trends in ₹, and income by work type
3. WHEN I view client analytics THEN the system SHALL display best clients by revenue generated, client distribution by work type, and top clients by transaction volume
4. WHEN I view service analytics THEN the system SHALL show most popular services by income generated, service type distribution, and service performance trends
5. WHEN I view payment analytics THEN the system SHALL display amount of due money, paid vs unpaid amounts, collection efficiency, and payment status distribution
6. WHEN I select a date range THEN the system SHALL update all analytics to reflect the selected period using DD/MM/YYYY format
7. WHEN analytics data changes THEN the system SHALL update graphs and charts reflecting current data with proper Indian currency formatting

### Requirement 6

**User Story:** As a business owner, I want to view client balances and work history in Indian Rupees, so that I can track outstanding amounts and payment history accurately.

#### Acceptance Criteria

1. WHEN a user views a client's profile THEN the system SHALL display the current balance in ₹ and recent work history with payment status
2. WHEN a work transaction is added or modified THEN the system SHALL automatically recalculate the client's balance based on total price and paid amounts
3. WHEN a user views the clients list THEN the system SHALL display each client's current balance in ₹ with clear indication of who owes whom
4. WHEN a user filters by balance THEN the system SHALL show clients with positive balances (client owes business), negative balances (business owes client), or zero balances
5. WHEN a user views work history THEN the system SHALL show running balance calculations and payment timeline
6. WHEN balance calculations are performed THEN the system SHALL ensure accuracy across client profiles, work records, and analytics

### Requirement 7

**User Story:** As the business owner, I want to generate professional PDF receipts for individual or multiple work transactions, so that I can provide proper documentation to my clients.

#### Acceptance Criteria

1. WHEN I view the works list THEN the system SHALL provide checkboxes to select one or multiple work transactions
2. WHEN I select work transactions and click "Generate Receipt" THEN the system SHALL create a professional PDF receipt with business details, client information, and transaction details
3. WHEN I generate a receipt THEN the system SHALL include transaction date, work description, total price, paid amount, balance, and payment status in Indian format
4. WHEN I generate a receipt for multiple transactions THEN the system SHALL group them by client and show totals and balances
5. WHEN I generate a receipt THEN the system SHALL format all amounts in Indian Rupees (₹) and dates in DD/MM/YYYY format
6. WHEN I generate a receipt THEN the system SHALL allow me to download the PDF file immediately
7. WHEN I generate a receipt THEN the system SHALL include proper business letterhead formatting and professional layout

### Requirement 8

**User Story:** As the business owner, I want a responsive and intuitive user interface, so that I can efficiently manage my business data on any device.

#### Acceptance Criteria

1. WHEN I access the application on any device THEN the system SHALL display a responsive interface using Tailwind CSS and shadcn components
2. WHEN I navigate between sections THEN the system SHALL provide clear navigation and maintain consistent styling
3. WHEN I perform actions THEN the system SHALL provide immediate feedback and loading states
4. WHEN I encounter errors THEN the system SHALL display clear, actionable error messages
5. WHEN I use the application on mobile THEN the system SHALL maintain full functionality with touch-optimized interactions
6. WHEN I access forms THEN the system SHALL provide proper validation and user-friendly input experiences