// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Restrict CORS to the official app origin (plus localhost for dev). This
// admin function is called from the browser with a Supabase session, so we do
// not want arbitrary origins invoking it.
const ALLOWED_ORIGINS = new Set([
  'https://chornors.camboverse.world',
  'http://localhost:3000',
  'http://localhost:5173',
]);

function buildCors(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'https://chornors.camboverse.world';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const corsHeaders = buildCors(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        throw new Error('Missing Authorization header');
    }

    // 1. Verify User
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || !user.email) {
      throw new Error('Unauthorized');
    }

    // 2. Init Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Check Admin Permissions
    // We check the app_settings 'admin_emails' key.
    const { data: adminConfig } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_emails')
      .single();
    
    // Default fallback if DB config is missing
    const adminEmails = (adminConfig?.value as string[]) || ['sengtha@gmail.com']; 
    
    if (!adminEmails.includes(user.email)) {
        return new Response(JSON.stringify({ error: 'Forbidden: You are not an admin.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 4. Perform Action
    const { action, value } = await req.json();

    if (action === 'TOGGLE_GUEST_MODE') {
        const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({ key: 'guest_mode', value: value });
        
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, value }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    if (action === 'GET_USER_STATS') {
        // Fetch all users (default page 1, 50 users. Increase limit if needed)
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        
        if (error) throw error;

        // Map to safe data to return to client
        const safeUsers = users.map((u: any) => ({
            id: u.id,
            email: u.email,
            name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
            photo: u.user_metadata?.avatar_url,
            lastLogin: u.last_sign_in_at || u.created_at
        }));

        return new Response(JSON.stringify({ 
            success: true, 
            totalUsers: safeUsers.length, 
            users: safeUsers 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    return new Response(JSON.stringify({ error: 'Unknown Action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
