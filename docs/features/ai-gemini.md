# AI Features (Google Gemini)

Chornor uses Google Gemini for six distinct jobs across the app. All of them run
through `src/services/geminiService.ts` and use the `gemini-2.5-flash` model.
This document lists each AI capability, where it appears, and how it behaves.

## Configuration

The service reads the API key from the browser environment
(`VITE_GEMINI_API_KEY` or `GEMINI_API_KEY`) and constructs a `GoogleGenAI`
client. If no key is present, calls throw a clear error telling the developer to
add the key and restart the dev server. Because the calls are made from the
client, the key must be exposed through Vite's environment prefix (configured in
`vite.config.ts`).

## The six capabilities

### 1. Financial advice

`getFinancialAdvice` powers the Dashboard insight panel. It collects the last
thirty days of transactions plus context from categories, lending, savings,
crypto, and notifications, then asks Gemini for a short, practical summary and
suggestions written in Khmer.

### 2. Category suggestion

`suggestCategory` helps the Transaction form. Given a description and the user's
category list, it proposes the best matching category id so the user does not
have to pick manually.

### 3. Receipt scanning

`parseReceipt` reads a photo of a receipt, bill, or invoice. It sends the image
to Gemini with the user's category list and gets back structured JSON: total
amount, detected currency (defaulting to USD when unsure), date, merchant
description, line items with quantity and unit price, and a best matching
category id. The values pre-fill the Transaction form for confirmation.

### 4. Wallet address extraction

`extractWalletAddress` reads an image that may contain a QR code or text and
extracts a cryptocurrency wallet address. It looks for EVM style `0x` addresses
and returns the first match, or null if none is found. This supports pasting a
recipient address by photo in the Crypto flow.

### 5. Community post moderation

`validateCommunityPost` checks a user's community post before it is published. It
enforces category relevance, a 120 word limit, and a no spam or scam rule, and
returns an `allowed` flag plus a short reason in Khmer. If the AI service is
unavailable, the post is rejected by default. See the Community Hub document.

### 6. Daily content generation

`generateAndSaveDailyPosts` writes one short educational post per community
category per day, in Khmer, so the feed stays active. It checks
`hasAIPostedToday` first to avoid duplicates.

## Structured output

Where the app needs machine readable results (receipt parsing, moderation), the
prompts ask for pure JSON, and moderation uses Gemini's response schema feature
to constrain the shape. The service also strips any Markdown code fences before
parsing, since models sometimes wrap JSON in them.

## Error handling

Each function catches its own errors. Image and moderation functions return null
or a safe default on failure rather than throwing into the UI, so an AI outage
degrades gracefully: receipt scanning simply does not pre-fill, and a post that
cannot be validated is held back rather than let through.
