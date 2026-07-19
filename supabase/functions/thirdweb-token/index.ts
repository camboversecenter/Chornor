// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@4.15.5";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // 1. Verify the Supabase User (HS256)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Invalid Supabase Token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ------------------------------------------------------------------
    // 1.5 WHITELIST CHECK (Database Table)
    // ------------------------------------------------------------------
    const userEmail = user.email?.toLowerCase() || '';
    
    // Use the service-role client only after authenticating the caller above.
    // wallet_whitelist is an admin-owned table and is commonly protected by
    // RLS, so querying it with the user's client can make valid rows invisible.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      throw new Error('Server Config Error: Missing SUPABASE_SERVICE_ROLE_KEY');
    }
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    const { data: whitelistData, error: whitelistError } = await adminClient
      .from('wallet_whitelist')
      .select('email')
      .ilike('email', userEmail)
      .maybeSingle();

    if (whitelistError) {
      console.error('Whitelist lookup failed:', whitelistError.message);
      throw new Error(`Whitelist lookup failed: ${whitelistError.message}`);
    }

    // If no record found, deny access
    if (!whitelistData) {
       return new Response(JSON.stringify({ error: `Access Denied: ${userEmail} is not whitelisted. Please contact Admin.` }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 2. Load RS256 Signing Secrets
    const privateKeyRaw = Deno.env.get('THIRDWEB_PRIVATE_KEY');
    const keyId = Deno.env.get('THIRDWEB_KEY_ID') || 'my-key-1';
    
    // Legacy fallback removed.
    const finalPrivateKey = privateKeyRaw;
    
    if (!finalPrivateKey) {
      throw new Error('Server Config Error: Missing THIRDWEB_PRIVATE_KEY');
    }

    // Ensure newlines are correctly interpreted from env var string
    const privateKey = await importPKCS8(finalPrivateKey.replace(/\\n/g, '\n'), 'RS256');

    // 3. Mint new RS256 Token for Thirdweb
    // IMPORTANT: 'aud' must match your Thirdweb Client ID
    const jwt = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.user_metadata?.full_name,
      picture: user.user_metadata?.avatar_url,
      aud: "031d1b8674c92302136defb9fd7a044e", 
    })
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setIssuedAt()
      .setIssuer(Deno.env.get('SUPABASE_URL') ?? 'https://supabase.io')
      .setExpirationTime('1h')
      .sign(privateKey);

    return new Response(JSON.stringify({ token: jwt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Token Exchange Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
