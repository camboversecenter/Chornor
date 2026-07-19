# Notifications and Reminders

Chornor generates in app notifications so users do not miss loan payments, bills,
savings deposits, or incoming requests from other apps. All of this logic lives
in `src/services/notificationService.ts` and runs locally against the current
data whenever the app loads or refreshes.

- **Service:** `src/services/notificationService.ts`
- **Type:** `AppNotification` in `src/types.ts`
- **Entry point:** `checkNotifications`, called from `App.tsx`

## How it runs

`checkNotifications` reads the current transactions, loans, savings, and pending
external requests from the storage service, evaluates each rule below, and
returns a sorted list of notifications (oldest or most overdue first). Tapping a
notification navigates to the relevant tab, or, for external requests, opens the
approval modal.

There are four notification sources.

## 1. External app requests

If there are any pending transaction requests, they are grouped into a single
urgent notification that names the source apps and the total count. Opening it
lets the user approve or reject each request. See the External App API document.

## 2. Loan installments

For every unpaid lending installment due within the next three days, the service
raises an alert. If the due date is already in the past it is labeled overdue,
otherwise it is labeled due. Installments belonging to completed loans are
skipped. The message includes the loan title, the month number, and the amount
in whichever currency the installment uses.

## 3. Recurring bill reminders

Transactions marked `MONTHLY` or `YEARLY` become recurring reminders. The logic:

- Group recurring transactions by description, amount, and category, keeping the
  most recent of each.
- Compute the expected date in the current period (same day of month for
  monthly, same month and day for yearly).
- If that date falls within the next three days, check whether a matching
  payment already exists. A match is any transaction in the same category, with
  an amount within five percent, dated within a five day window around the
  expected date.
- If no matching payment is found, raise a bill reminder, or an overdue bill
  alert if the expected date has already passed.

This design means the reminder disappears automatically once the user records
the payment for that period.

## 4. Savings reminders

For each savings goal, the service looks at the most recent deposit that had an
alert set (monthly or yearly). If no deposit has been made in the current period
and the day of month has passed, it raises a saving reminder encouraging the
user to keep contributing to that goal.

## Delivery

Notifications are surfaced in the app's notification panel with a badge count.
They are computed on demand from local data, so they work the same for guest and
cloud users and require no server push.
