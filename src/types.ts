// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
export type Currency = 'KHR' | 'USD';

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  ADD = 'ADD',
  CATEGORIES = 'CATEGORIES',
  BUDGET = 'BUDGET',
  LENDING = 'LENDING',
  SAVING = 'SAVING',
  CRYPTO = 'CRYPTO',
  COMMUNITY = 'COMMUNITY',
  ADMIN = 'ADMIN',
}

export interface Category {
  _id: string;
  name: string;
  chomnay: boolean;
  color: string;
  order: number;
  user_id?: string;
}

export interface Family {
  _id: string;
  name: string;
}

export type ReminderFrequency = 'NONE' | 'MONTHLY' | 'YEARLY';

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  _id: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  familyId?: string;
  date: string;
  createdAt: string;
  description: string;
  reminder: ReminderFrequency;
  items?: TransactionItem[];
}

export interface Lending {
  _id: string;
  title: string;
  lender: string;
  borrower: string;
  amountRiel: number;
  amountDollar: number;
  interestRate: number;
  paymentMonths: number;
  downRiel: number;
  downDollar: number;
  paymentMethod: string;
  isComplete: boolean;
  createdAt: string;
}

export interface LendingTransaction {
  _id: string;
  lendingId: string;
  month: number;
  dueDate: string;
  amountRiel: number;
  amountDollar: number;
  interestRiel: number;
  interestDollar: number;
  principalRiel: number;
  principalDollar: number;
  balanceRiel: number;
  balanceDollar: number;
  isPaid: boolean;
  paidAt?: string;
}

// A monthly spending limit for one expense category. Spend is computed from the
// transactions in that category for the current calendar month, converted to the
// budget's currency. Budgets recur every month (they are not tied to one month).
export interface Budget {
  _id: string;
  categoryId: string;
  amount: number;
  currency: Currency;
  createdAt: string;
  user_id?: string;
}

export interface Saving {
  _id: string;
  title: string;
  familyId?: string;
  targetDollar: number;
  targetRiel: number;
  savedDollar: number;
  savedRiel: number;
  createdAt: string;
}

export interface SavingTransaction {
  _id: string;
  savingId: string;
  amountDollar: number;
  amountRiel: number;
  createdAt: string;
  note?: string;
  alert?: 1 | 2 | null;
  isAlerted?: boolean;
}

export interface CryptoAsset {
  _id: string;
  symbol: string;
  name: string;
  coingeckoId?: string;
  image?: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  createdAt: string;
}

export interface CryptoTransaction {
  _id: string;
  assetId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string;
}

export type PostType = 'REDUCE_EXPENSE' | 'INCREASE_REVENUE' | 'DIGITAL_ASSET';
export type ReactionType = 'LIKE' | 'HELPFUL' | 'BULLISH' | 'BEARISH' | 'SCAM';

export interface CommunityPost {
  _id: string;
  type: PostType;
  content: string;
  author: string;
  createdAt: string;
  reactions: Partial<Record<ReactionType, number>>;
  userReaction?: ReactionType | null;
}

export interface TransactionRequest {
  _id: string;
  sourceAppId: string;
  sourceAppName: string;
  amount: number;
  currency: Currency;
  description: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'LENDING' | 'SAVING' | 'TRANSACTION' | 'EXTERNAL_REQUEST' | 'BUDGET';
  title: string;
  message: string;
  date: string;
  isOverdue: boolean;
  linkId?: string;
  data?: TransactionRequest[];
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  isTestUser?: boolean;
  isAdmin?: boolean;
  age: number;
  weight: number;
  restingHR: number;
  gender: 'Male' | 'Female' | 'Other';
  weeklyTargetSessions: number;
  weeklyTargetCalories: number;
}

export interface APIClient {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  requestsCount: number;
}

export type WorkoutType = 'Running' | 'Cycling' | 'Strength' | 'Yoga' | 'HIIT' | 'Walking' | 'Other';

export interface Workout {
  id: string;
  type: WorkoutType;
  duration: number;
  avgHeartRate: number;
  maxHeartRate: number;
  calories: number;
  date: string;
  notes: string;
  intensity: 'Low' | 'Moderate' | 'High' | 'Peak';
}

export interface LivePulseData {
  timeIndex: number;
  bpm: number;
  intensityZone: string;
}
