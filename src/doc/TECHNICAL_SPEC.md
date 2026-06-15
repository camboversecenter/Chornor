
# CHORNOR - Technical Specification

## 1. Executive Summary
**CHORNOR (ចំណូលចំណាយ)** is a Progressive Web Application (PWA) designed for personal finance management tailored to the Cambodian context. It supports dual currency (USD/KHR), offline-first capabilities, and integrates advanced features like AI-powered financial advice, receipt scanning, and Web3 wallet management.

## 2. System Architecture

### 2.1 High-Level Overview
The application follows a **Client-Side Rendering (CSR)** architecture using React, interacting with **Supabase** for authentication and serverless compute (Edge Functions).

*   **Frontend**: React 18, TypeScript, Tailwind CSS.
*   **Backend**: Supabase (Auth, Database, Edge Functions).
*   **AI Engine**: Google Gemini API (Model: `gemini-2.5-flash`).
*   **Web3**: Thirdweb SDK (Base Chain).
*   **External Data**: CoinGecko API (Crypto Prices).

### 2.2 Data Flow Strategy
The app employs a **Hybrid Storage Strategy**:
1.  **Guest Mode**: Data is stored entirely in the browser's `localStorage` via `storageService.ts`.
2.  **Authenticated Mode**:
    *   User identity is managed by Supabase Auth (Google OAuth).
    *   Core data (Transactions, Categories) is loaded into the application state. *Note: In the current Beta, write operations primarily target local storage with specific sync points to Supabase for "Requests" and "Whitelist".*
    *   Sensitive operations (Third-party API submissions, Wallet key signing) are routed through **Supabase Edge Functions**.

## 3. Frontend Specifications

### 3.1 Core Technologies
*   **Build System**: ES Modules / Vite ecosystem compatible.
*   **UI Library**: Lucide React (Icons), Recharts (Visualization).
*   **State Management**: React `useState` / `useEffect` + Singleton Service Pattern (`storageService.ts`).

### 3.2 Component Hierarchy
*   **`App.tsx`**: Main router and layout controller. Handles Authentication state and Tab switching.
*   **Feature Modules**:
    *   `Dashboard`: Summary cards, AI insights, Expense charts.
    *   `TransactionList`: Filtering, Sorting, and List/Analytics views.
    *   `TransactionForm`: Add/Edit logic, Gemini Receipt Scanning integration.
    *   `LendingManager`: Loan tracking, amortization schedule generation.
    *   `SavingManager`: Savings goals, progress bars.
    *   `CryptoManager`: Portfolio tracking, Thirdweb Wallet integration (Send/Receive).
    *   `CommunityHub`: Social feed with AI content moderation.
    *   `AdminDashboard`: User stats, API Key management, Wallet Whitelisting.

### 3.3 Services
*   `storageService`: Central data access layer. Abstracts the difference between Local Storage and (future) Database sync.
*   `geminiService`: Handles all AI interactions (Advice, Receipt Parsing, Content Moderation).
*   `authService`: Wrapper for Supabase Auth and Local Guest Auth.
*   `notificationService`: Logic for generating local alerts based on due dates.

## 4. Backend & Edge Functions

### 4.1 Security Model
The app uses **Row Level Security (RLS)** on Supabase tables. However, specific high-privilege tasks are offloaded to Edge Functions to protect API secrets (e.g., Thirdweb Private Keys, Service Role Keys).

### 4.2 Deployed Functions
1.  **`thirdweb-token`**:
    *   **Purpose**: Mints a custom RS256 JWT compatible with Thirdweb's "Custom Auth".
    *   **Logic**: Verifies Supabase User -> Checks `wallet_whitelist` table -> Signs JWT using `THIRDWEB_PRIVATE_KEY`.
2.  **`thirdweb-jwks`**:
    *   **Purpose**: Serves the Public Key (JWKS) for Thirdweb to verify the JWT signed by the token function.
    *   **Access**: Publicly accessible (No Auth).
3.  **`submit-transaction`**:
    *   **Purpose**: Allows external apps (e.g., Grab, PassApp) to POST transactions to a user's account.
    *   **Logic**: Verifies `x-api-key` header -> Maps Email to User ID -> Checks Rate Limit -> Inserts into `transaction_requests`.

## 5. Integrations

### 5.1 Google Gemini AI
*   **Financial Advice**: Analyzes transaction history to generate Khmer-language advice.
*   **Receipt Scanning**: Converts image/base64 to JSON transaction data.
*   **Content Moderation**: Validates community posts against category rules before allowing submission.

### 5.2 Thirdweb (Web3)
*   **Network**: Base Mainnet (Chain ID 8453).
*   **Auth**: Custom JWT Authentication bridging Supabase Auth to Web3.
*   **Features**: In-App Wallet, Token Balances, Send Transaction.

## 6. Development Setup
1.  Configure `metadata.json` for permissions.
2.  Set `process.env.API_KEY` for Google Gemini.
3.  Set `process.env.SUPABASE_URL` and `SUPABASE_KEY`.
4.  Deploy Edge Functions via Supabase CLI.
