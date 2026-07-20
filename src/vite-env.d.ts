// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Gemini is proxied server-side (see server.ts /api/gemini); no client key.
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_COINGECKO_API_KEY?: string;
  readonly VITE_MORALIS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
