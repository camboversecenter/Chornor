# Savings

The Savings tab lets a user set savings goals and track progress toward them,
with optional reminders to keep depositing. Like Lending, it holds both Riel and
Dollar amounts on each goal.

- **Route:** `/savings`
- **Component:** `src/components/SavingManager.tsx`
- **Available to:** all signed in users, including guests.

## Data model

Two types in `src/types.ts` drive the feature.

A `Saving` record is a goal:

| Field | Meaning |
| --- | --- |
| `title` | Name of the goal |
| `familyId` | Optional family member the goal is for |
| `targetDollar` / `targetRiel` | Target amount in each currency |
| `savedDollar` / `savedRiel` | Amount saved so far in each currency |
| `createdAt` | When the goal was created |

A `SavingTransaction` record is a single deposit:

| Field | Meaning |
| --- | --- |
| `savingId` | Which goal it belongs to |
| `amountDollar` / `amountRiel` | Deposit amount |
| `createdAt` | When it was deposited |
| `note` | Optional note |
| `alert` | Reminder cadence: `1` for monthly, `2` for yearly, or none |
| `isAlerted` | Whether the reminder has fired |

## Tracking progress

Each goal shows a progress bar comparing the amount saved against the target.
Adding a deposit updates the saved totals. Goals can be tied to a family member
so a household can track, for example, a child's school fund separately.

## Reminders

A deposit can carry an `alert` value that turns the goal into a recurring saving
reminder. The notification service looks at each goal's most recent deposit that
had an alert set. If no deposit has been made in the current period (this month
for monthly, this year for yearly) and the day of month has passed, it raises a
"Saving Reminder" nudging the user not to forget their goal. See the
Notifications document.

## Storage

Goals and deposits are saved through the storage service (`saveSaving`,
`saveSavingTransaction`, `deleteSaving`, `deleteSavingTransaction`) and follow
the same local versus cloud rule as the rest of the app.
