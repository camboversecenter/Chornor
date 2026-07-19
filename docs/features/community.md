# Community Hub

The Community Hub is a social feed focused on money topics. Users share tips and
insights in three fixed categories, and every human post is checked by AI before
it is allowed in. The app also generates its own daily educational posts.

- **Route:** `/community`
- **Component:** `src/components/CommunityHub.tsx`
- **Available to:** all signed in users, including guests.

## Post categories

Posts belong to one of three `PostType` values:

- **REDUCE_EXPENSE:** discounts, financial literacy, and money saving tips.
- **INCREASE_REVENUE:** jobs, part time work, side hustles, and earning skills.
- **DIGITAL_ASSET:** news and education about crypto, NFTs, GameFi, RWA, Web3,
  and blockchain.

A `CommunityPost` (see `src/types.ts`) carries its type, content, author,
creation time, a map of reaction counts, and the current user's own reaction.

## Reactions

Readers can react to a post. The `ReactionType` values are `LIKE`, `HELPFUL`,
`BULLISH`, `BEARISH`, and `SCAM`. The bullish, bearish, and scam reactions fit
the digital asset discussions, letting the community signal sentiment and flag
suspicious posts.

## AI moderation

Before a user's post is published, `validateCommunityPost` in
`src/services/geminiService.ts` sends it to Gemini for moderation. The model
checks that the content is:

1. Strictly relevant to its chosen category.
2. Under 120 words.
3. Free of spam, scams, offensive language, and irrelevant promotion.
4. Genuinely helpful to the community.

The model returns an `allowed` boolean and a short `reason` written in Khmer. If
the AI service is unavailable, the post is rejected by default rather than
allowed through unchecked.

## AI generated daily posts

To keep the feed active, `generateAndSaveDailyPosts` produces one short
educational post per category per day, in Khmer. It first checks
`hasAIPostedToday` for each category so it does not post twice in a day, then
generates and saves the content. This job runs after a user's data loads.

## Storage

Posts and reactions are saved through the storage service (`addCommunityPost`,
`reactToCommunityPost`, and the paged `getCommunityPosts`). The daily post
bookkeeping uses `hasAIPostedToday` and `markAIPostedToday`.
