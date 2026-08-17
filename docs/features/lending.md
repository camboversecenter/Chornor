# Lending

The Lending tab tracks loans, whether the user is the lender or the borrower,
and generates a full month by month repayment schedule for each loan. It works
in both currencies at once, keeping Riel and Dollar amounts side by side.

- **Route:** `/lending`
- **Component:** `src/components/LendingManager.tsx`
- **Available to:** all signed in users, including guests.

## Data model

Two types drive this feature, both in `src/types.ts`.

A `Lending` record describes the loan itself:

| Field | Meaning |
| --- | --- |
| `title` | Name of the loan |
| `lender` / `borrower` | The two parties |
| `amountRiel` / `amountDollar` | Principal in each currency |
| `interestRate` | Interest rate applied |
| `paymentMonths` | Number of monthly installments |
| `downRiel` / `downDollar` | Down payment in each currency |
| `paymentMethod` | How payments are made |
| `isComplete` | Whether the loan is fully settled |

A `LendingTransaction` record is one installment in the schedule:

| Field | Meaning |
| --- | --- |
| `lendingId` | Which loan it belongs to |
| `month` | Installment number |
| `dueDate` | When the installment is due |
| `amountRiel` / `amountDollar` | Payment due that month |
| `interestRiel` / `interestDollar` | Interest portion |
| `principalRiel` / `principalDollar` | Principal portion |
| `balanceRiel` / `balanceDollar` | Remaining balance after payment |
| `isPaid` | Whether it has been paid |
| `paidAt` | When it was paid |

## Amortization schedule

When a loan is created, `storage.generateLoanSchedule` builds the installment
rows. For each month it computes the interest portion, the principal portion,
the payment amount, and the running balance, and stores one
`LendingTransaction` per month up to `paymentMonths`. This produces a standard
amortization table that the UI renders so the user can see exactly how each
payment splits between interest and principal.

## Marking payments

Each installment can be marked paid. The loan can be marked complete, which
stops it from generating further reminders.

## Reminders

Unpaid installments feed the notification system. The notification service scans
lending transactions for any that are unpaid and due within three days, and
raises a "Loan Due" or "Overdue Loan" alert with the loan title, month number,
and amount. Completed loans are skipped. See the Notifications document.

## Storage

Loans and their installments are saved through the storage service
(`saveLending`, `saveLendingTransaction`, `deleteLending`) and follow the same
local versus cloud rule as the rest of the app.
