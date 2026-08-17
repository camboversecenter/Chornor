# Transactions

Transactions are the core ledger of Chornor. Every income or expense entry is a
transaction, optionally itemized, optionally tagged to a family member, and
optionally set to remind the user on a monthly or yearly cycle.

- **Routes:** `/transactions` (list and analytics), `/transactions/new` (add or
  edit).
- **Components:** `src/components/TransactionList.tsx`,
  `src/components/TransactionForm.tsx`,
  `src/components/TransactionAnalytics.tsx`.
- **Available to:** all signed in users, including guests.

## Data model

A transaction is defined by the `Transaction` type in `src/types.ts`:

| Field | Meaning |
| --- | --- |
| `_id` | Unique id |
| `amount` | Numeric amount |
| `currency` | `KHR` or `USD` |
| `categoryId` | Which category it belongs to |
| `familyId` | Optional family member it is attributed to |
| `date` | Transaction date |
| `createdAt` | When the record was created |
| `description` | Free text label |
| `reminder` | `NONE`, `MONTHLY`, or `YEARLY` |
| `items` | Optional list of line items (name, quantity, price) |

Whether a transaction counts as income or expense is determined by its category,
not by the transaction itself. Each `Category` carries a `chomnay` boolean that
marks it as income or expense.

## The transaction list

`TransactionList` shows the ledger with filtering and sorting, and can switch
between a plain list view and an analytics view. From the list a user can edit
or delete an entry. Deletion is confirmed in the UI before it is applied.

`TransactionAnalytics` provides charts and breakdowns of spending over time and
by category.

## Adding and editing

`TransactionForm` handles both creating a new transaction and editing an
existing one. When the user taps a transaction to edit, `App.tsx` stores it as
`editingTransaction` and navigates to the add screen with the form
pre-populated.

The form supports:

- **Manual entry.** Amount, currency, category, family member, date,
  description, and reminder frequency.
- **Line items.** Optional itemized rows, each with a name, quantity, and unit
  price.
- **AI category suggestion.** As the user types a description, `suggestCategory`
  can propose the best matching category using Gemini.
- **AI receipt scanning.** The user can upload a photo of a receipt, bill, or
  invoice. `parseReceipt` sends the image to Gemini and returns structured data:
  total amount, detected currency, date, merchant description, line items, and a
  best matching category id. The parsed values pre-fill the form for the user to
  confirm.

## Recurring reminders

If a transaction has `reminder` set to `MONTHLY` or `YEARLY`, the notification
service watches for the next expected occurrence. It groups recurring
transactions by description, amount, and category, then checks whether a
matching payment has been recorded in the current period (within a five day
window and a five percent amount margin). If none is found and the expected date
has arrived, the user gets a bill reminder or an overdue bill alert. See the
Notifications document for the full logic.

## Storage

Transactions are saved through `storage.saveTransaction` and removed through
`storage.deleteTransaction`. For guest and local users they live in
`localStorage`. For cloud users they are also written to the corresponding
Supabase table, scoped to the user id.

## External transaction requests

Transactions can also arrive from outside the app. Third party services can
submit a pending transaction request through the external API, which the user
then approves into a real transaction (choosing a category and optional family
member) or rejects. That approval flow is documented in the External App API
document.
