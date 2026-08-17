// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const publicKeyPEM = Deno.env.get('THIRDWEB_PUBLIC_KEY');
    const keyId = Deno.env.get('THIRDWEB_KEY_ID') || 'my-key-1';

    if (!publicKeyPEM) throw new Error("Missing Secret: THIRDWEB_PUBLIC_KEY");

    // 1. Clean PEM string to get raw Base64
    const pemContents = publicKeyPEM
      .replace(/\\n/g, '\n') // Handle env var newlines
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, ''); // Remove all whitespace

    // 2. Convert base64 to ArrayBuffer
    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    // 3. Import Key using Native Web Crypto API
    // We explicitly set 'true' for extractable to allow exportKey later
    const key = await crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      true, 
      ["verify"]
    );

    // 4. Export as JWK
    const jwk = await crypto.subtle.exportKey("jwk", key);

    // 5. Return JWKS JSON
    return new Response(JSON.stringify({
      keys: [{
        ...jwk,
        kid: keyId,
        use: 'sig',
        alg: 'RS256'
      }]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});