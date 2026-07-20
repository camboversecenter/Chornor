// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// auth.admin.listUsers has no email filter and defaults to 50 users per page,
// so we page through until we find the user (or run out). Without this, any user
// beyond the first page could never receive an external transaction.
async function findUserByEmail(admin: any, email: string) {
  const target = email.trim().toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const found = users.find((u: any) => (u.email ?? '').toLowerCase() === target);
    if (found) return found;
    if (users.length < perPage) break; // last page reached
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use Service Role to bypass RLS for API check
    );

    // 1. Authenticate Third Party App via Header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), { status: 401, headers: corsHeaders });
    }

    const { data: clientData, error: clientError } = await supabaseClient
      .from('api_clients')
      .select('id, name, is_active')
      .eq('api_key', apiKey)
      .single();

    if (clientError || !clientData || !clientData.is_active) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive API Key' }), { status: 403, headers: corsHeaders });
    }

    // 2. Parse Body
    const { user_email, amount, currency, description, date } = await req.json();

    if (!user_email || !amount || !currency) {
        return new Response(JSON.stringify({ error: 'Missing required fields: user_email, amount, currency' }), { status: 400, headers: corsHeaders });
    }

    // 3. Validate amount/currency, then find the target user by email.
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: corsHeaders });
    }
    if (currency !== 'KHR' && currency !== 'USD') {
        return new Response(JSON.stringify({ error: 'Invalid currency (must be KHR or USD)' }), { status: 400, headers: corsHeaders });
    }

    const targetUser = await findUserByEmail(supabaseClient, user_email);

    if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
    }

    // 4. SPAM CHECK: Check pending count for this user
    const { count, error: countError } = await supabaseClient
        .from('transaction_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUser.id)
        .eq('status', 'PENDING');

    if (count !== null && count >= 20) {
         return new Response(JSON.stringify({ error: 'Rate Limit Exceeded: User has too many pending requests. Please ask user to approve/reject existing items.' }), { status: 429, headers: corsHeaders });
    }

    // 5. Insert Request
    const { error: insertError } = await supabaseClient
        .from('transaction_requests')
        .insert({
            source_app_id: clientData.id,
            source_app_name: clientData.name,
            user_id: targetUser.id,
            amount: numericAmount,
            currency: currency,
            description: description || `Transaction from ${clientData.name}`,
            date: date || new Date().toISOString(),
            status: 'PENDING'
        });

    if (insertError) throw insertError;

    // 6. Update Client Stats (Optional)
    // await supabaseClient.rpc('increment_request_count', { client_id: clientData.id });

    return new Response(JSON.stringify({ success: true, message: 'Request queued for user approval' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});