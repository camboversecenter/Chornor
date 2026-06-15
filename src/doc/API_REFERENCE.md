
# API Reference

This document outlines the external HTTP endpoints provided by Chornor's Supabase Edge Functions.

## Base URL
`https://[project-ref].supabase.co/functions/v1`

---

## 1. Submit Transaction
Allows third-party applications to queue a transaction for a user.

*   **Endpoint**: `/submit-transaction`
*   **Method**: `POST`
*   **Auth**: Custom Header `x-api-key`

### Headers
| Key | Value | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Required |
| `x-api-key` | `sk_...` | The API Client secret key generated in Admin Panel |

### Request Body
```json
{
  "user_email": "user@example.com",
  "amount": 12.50,
  "currency": "USD",
  "description": "Ride to Airport",
  "date": "2023-10-27T10:00:00Z"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Request queued for user approval"
}
```

### Error Responses
*   **401 Unauthorized**: Missing API Key.
*   **403 Forbidden**: Invalid or Inactive API Key.
*   **404 Not Found**: Target User Email not found in system.
*   **429 Too Many Requests**: User has too many PENDING requests (Spam protection).

---

## 2. Thirdweb Token Exchange
Internal/Frontend use only. Exchanges a Supabase Auth session for a Web3-compatible RS256 JWT.

*   **Endpoint**: `/thirdweb-token`
*   **Method**: `POST`
*   **Auth**: Bearer Token (Supabase Access Token)

### Headers
| Key | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer [SUPABASE_ACCESS_TOKEN]` | The user's active session token |

### Response (200 OK)
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs..." // The signed JWT for Thirdweb
}
```

### Response (403 Forbidden)
Occurs if the user is not in the `wallet_whitelist` table.
```json
{
  "error": "Access Denied: user@email.com is not whitelisted..."
}
```

---

## 3. Thirdweb JWKS
Public endpoint used by the Thirdweb SDK to verify the authenticity of the tokens minted by `/thirdweb-token`.

*   **Endpoint**: `/thirdweb-jwks`
*   **Method**: `GET`
*   **Auth**: None (Public)

### Response (200 OK)
Standard JWKS JSON format.
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "my-key-1",
      "n": "...",
      "e": "AQAB",
      "alg": "RS256"
    }
  ]
}
```
