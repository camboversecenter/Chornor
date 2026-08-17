// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import { createClient } from '@supabase/supabase-js';

// Configure via env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). The anon key
// is a publishable client key by design; the real access control is Supabase
// Row Level Security, which must be enabled on every table. The fallback values
// keep existing deployments working, but production should set the env vars.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://wrupwoxizgvpmfocljzq.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydXB3b3hpemd2cG1mb2NsanpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODU4OTksImV4cCI6MjA4MDY2MTg5OX0.LlDZNYu-y8gP39Ylvs61eeJEuI8mUWGyynUNG33gIpE';

export const supabase = createClient(supabaseUrl, supabaseKey);
