// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import { supabase as rawSupabase } from "../src/services/supabaseClient";
import { WalletStorageAdapter } from "./useWalletSigner";
import { WalletVaultRecord } from "./messages";

const supabase = rawSupabase as any;

export const createStorageAdapter = (): WalletStorageAdapter => {
  return {
    load: async (userId: string) => {
        if (!supabase) return null;
        try {
          const { data, error } = await supabase
            .from("wallet_vaults")
            .select("*")
            .eq("id", userId)
            .single();
          if (error) {
            if (error.code !== "PGRST116") {
              console.error("Error loading wallet vault from Supabase:", error);
              throw new Error("Failed to securely load wallet data. Please check your network connection.");
            }
            return null;
          }
          if (!data) return null;
    
          const ensureString = (val: any): string => {
            if (val === null || val === undefined) return "";
            if (typeof val === "string") return val;
            try {
              return JSON.stringify(val);
            } catch {
              return String(val);
            }
          };
    
          const ensureStringOrNull = (val: any): string | null => {
            if (val === null || val === undefined) return null;
            if (typeof val === "string") return val;
            try {
              return JSON.stringify(val);
            } catch {
              return String(val);
            }
          };
    
          return {
            pinSalt: ensureString(data.pin_salt),
            pinEnvelope: ensureString(data.pin_envelope),
            passkeyEnvelope: ensureStringOrNull(data.passkey_envelope),
            passkeyId: ensureStringOrNull(data.passkey_id),
            walletEnvelope: ensureString(data.wallet_envelope),
          } as WalletVaultRecord;
        } catch (err: any) {
          console.error("Failed to load secure vault from Supabase:", err);
          throw new Error(err.message || "Failed to load secure wallet backup from database.");
        }
      },
    save: async (userId: string, record: WalletVaultRecord) => {
        if (!supabase) {
          throw new Error("Supabase client is not initialized.");
        }
        const { error } = await supabase
          .from("wallet_vaults")
          .upsert({
            id: userId,
            pin_salt: record.pinSalt,
            pin_envelope: record.pinEnvelope,
            passkey_envelope: record.passkeyEnvelope,
            passkey_id: record.passkeyId,
            wallet_envelope: record.walletEnvelope,
            updated_at: new Date().toISOString(),
          });
        if (error) {
          console.error("Error saving wallet vault to Supabase:", error);
          throw new Error("Failed to securely back up your wallet. Please try again.");
        }
      },
  }
};
