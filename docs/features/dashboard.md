# Dashboard

The Dashboard is the home tab and the first screen a signed in user sees. It
gives a quick financial snapshot and hosts the AI financial advice feature.

- **Route:** `/`
- **Component:** `src/components/Dashboard.tsx`
- **Available to:** all signed in users, including guests.

## What it shows

- **Summary cards.** Totals for income and expenses, derived from the user's
  transactions and grouped by whether each category is marked as income or
  expense (the `chomnay` flag on a category).
- **Expense charts.** Visual breakdowns of spending, rendered with Recharts.
- **AI insight.** A financial advice panel that summarizes the user's recent
  activity and offers suggestions in Khmer.
- **Currency awareness.** All figures respect the user's preferred currency
  (KHR or USD), converting with the reference rate where needed.

## AI financial advice

The advice panel calls `getFinancialAdvice` in
`src/services/geminiService.ts`. That function gathers the last thirty days of
transactions plus context from categories, lending, savings, crypto holdings,
and pending notifications, then asks Gemini (`gemini-2.5-flash`) to produce a
short, practical summary in Khmer.

Because the call runs in the browser, it requires a Gemini API key to be
configured (`VITE_GEMINI_API_KEY` or `GEMINI_API_KEY`). Without a key, the
advice panel reports that the key is missing rather than failing silently. See
the AI features document for details.

## Data sources

The Dashboard is a read only view. It receives categories, transactions, the
preferred currency, and the current user as props from `App.tsx`. It does not
write data itself; all mutations happen in the Transactions, Lending, Savings,
and Crypto tabs.

## Notes

The repository also contains an unused `DashboardOverview` component with fitness
and heart rate widgets. That is a leftover from the prototype the project started
from and is not part of the finance Dashboard described here.
