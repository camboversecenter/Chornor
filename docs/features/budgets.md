# Budgets

The Budgets tab lets a user set a monthly spending limit for an expense
category and track this month's spending against it. It answers "how much have
I spent on Food this month, and how close am I to my limit?"

- **Route:** `/budgets`
- **Tab:** `TabView.BUDGET`
- **Component:** `src/components/BudgetManager.tsx`
- **Available to:** all signed in users (guests included, via local storage).

## The model

The `Budget` type in `src/types.ts` is intentionally small:

- `categoryId` : the expense category this budget applies to.
- `amount` : the monthly limit.
- `currency` : `KHR` or `USD`. Each budget keeps its own currency.

A budget is recurring: it is not tied to a specific month. Spend is always
computed for the current calendar month, so the tracker resets naturally on the
first of each month with no stored per-month rows.

Only expense categories (`chomnay === true`) can have a budget, and there is at
most one budget per category. The create form enforces both rules: it lists only
expense categories that do not already have a budget.

## Spend calculation

`storage.getMonthlyCategorySpend(categoryId, currency)` sums every transaction
in that category dated within the current month and converts each amount into
the budget's currency using `EXCHANGE_RATE` from `src/constants.ts`. Because it
reads the same transaction state the rest of the app uses, budget progress
updates as soon as a transaction is added, edited, or deleted.

The UI colors progress by how much of the limit is used:

- under 80 percent: indigo (on track),
- 80 to 99 percent: amber (approaching the limit),
- 100 percent or more: red (over budget, with the overspend amount shown).

The summary card at the top totals all budgets and all spend for the month,
converted into the user's preferred currency.

## Alerts

`checkNotifications` in `src/services/notificationService.ts` adds a `BUDGET`
notification when a category reaches 80 percent (approaching) or exceeds 100
percent (over budget) of its limit for the month. Tapping the alert opens the
Budgets tab.

## Storage and sync

Budgets follow the same local-versus-cloud rule as the rest of the app through
`storageService` (`getBudgets`, `saveBudget`, `deleteBudget`). Guests and test
users keep budgets in `localStorage`; signed-in users sync to the `budgets`
table in Supabase, which is included in the realtime subscription so changes on
one device appear on another. The table and its row-level security policies are
defined in `supabase/budgets.sql`; run that migration once against the Supabase
project before cloud users can save budgets.
