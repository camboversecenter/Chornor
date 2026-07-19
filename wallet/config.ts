// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
// src/config.ts
import { base, baseSepolia } from 'viem/chains';
import type { Argon2Params } from './messages';

const chainName = import.meta.env.VITE_CHAIN ?? 'base-sepolia';
export const IS_MAINNET = chainName === 'base';
export const CHAIN = IS_MAINNET ? base : baseSepolia;

export const RPC_URL =
  import.meta.env.VITE_BASE_RPC_URL ||
  (IS_MAINNET ? 'https://mainnet.base.org' : 'https://sepolia.base.org');

// Moralis chain param accepts the hex chain id.
export const MORALIS_CHAIN_HEX = '0x' + CHAIN.id.toString(16);
export const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY || '';

// USDC on Base. Default token for a payments-first wallet.
export const USDC_ADDRESS = (
  IS_MAINNET
    ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
) as `0x${string}`;
export const USDC_DECIMALS = 6;

// Argon2id tuned for mid-range mobile (OWASP baseline). This is wallet-grade
// for low-end Android. IMPORTANT: changing these parameters changes the derived
// key, so existing vaults could not be unlocked. If you ever tune them, store
// the params per-vault and pass them back at unlock time.
export const ARGON2: Argon2Params = {
  memorySizeKiB: 19456, // 19 MiB
  iterations: 2,
  parallelism: 1,
};

export const EXPLORER = CHAIN.blockExplorers?.default.url ?? 'https://basescan.org';
