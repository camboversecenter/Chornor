# External App API

Chornor can receive transactions from other applications. A third party service,
such as a ride hailing or payments app, can post a transaction into a user's
account through a Supabase Edge Function. The transaction does not appear
directly in the ledger; it becomes a pending request that the user must approve.

- **Edge Function:** `supabase/functions/submit-transaction/index.ts`
- **Client role:** external API client (see the User Roles document)
- **In app approval:** handled in `src/App.tsx` and surfaced through
  notifications

## Authentication

Every request must include an `x-api-key` header. The function looks the key up
in the `api_clients` table and rejects the request if the key is missing
(401), or unknown or inactive (403). Keys are created and revoked by admins in
the Admin Panel.

## Request contract

The function expects a JSON body with these fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `user_email` | Yes | The email of the Chornor user to post to |
| `amount` | Yes | Transaction amount |
| `currency` | Yes | `KHR` or `USD` |
| `description` | No | Defaults to "Transaction from <app name>" |
| `date` | No | Defaults to the current time |

## Processing steps

1. **Verify the API key** against `api_clients`, requiring an active client.
2. **Validate the body**, requiring `user_email`, `amount`, and `currency`.
3. **Resolve the user** by listing Supabase auth users and matching the email.
   If no user matches, it returns 404.
4. **Rate limit check.** If the target user already has 20 or more pending
   requests, the function returns 429 and asks that the user clear the backlog
   first. This prevents a client from flooding a user.
5. **Insert the request** into `transaction_requests` with status `PENDING`,
   recording the source app id and name.

On success it returns `{ success: true, message: "Request queued for user
approval" }`.

## What the user sees

A pending request becomes a `TransactionRequest` (see `src/types.ts`) with the
source app, amount, currency, description, date, and status. The notification
service groups all pending external requests into a single urgent notification.

When the user opens it, a modal lists each request. For each one the user picks a
category (and optionally a family member), then approves or rejects it:

- **Approve.** `storage.approveTransactionRequest` turns the request into a real
  transaction under the chosen category, then clears the request. The user must
  have at least one category first, or the app prompts them to create one.
- **Reject.** `storage.rejectTransactionRequest` discards the request.

This human in the loop design means an external client can suggest transactions
but can never write directly to a user's ledger.

## Trying it without a real client

Test users see a "Simulate External App Request" button in Settings. It calls
`storage.mockReceiveExternalRequest` to inject a sample pending request (for
example from "Grab"), so the approval flow can be exercised offline.
