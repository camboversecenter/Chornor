export type WorkoutType = 'Running' | 'Cycling' | 'Strength' | 'Yoga' | 'HIIT' | 'Walking' | 'Other';

export interface Workout {
  id: string;
  type: WorkoutType;
  duration: number; // in minutes
  avgHeartRate: number; // in bpm
  maxHeartRate: number; // in bpm
  calories: number; // in kcal
  date: string; // ISO format or YYYY-MM-DD
  notes: string;
  intensity: 'Low' | 'Moderate' | 'High' | 'Peak';
}

export interface LivePulseData {
  timeIndex: number; // x axis
  bpm: number;
  intensityZone: string;
}

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  SAVINGS = 'SAVINGS',
  CRYPTO = 'CRYPTO',
  COMMUNITY = 'COMMUNITY',
  ADMIN = 'ADMIN'
}

export interface Category {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
}

export interface Family {
  id: string;
  name: string;
}

export type Currency = 'KHR' | 'USD';

export interface AppNotification {
  message: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number; // kg
  restingHR: number; // bpm
  gender: 'Male' | 'Female' | 'Other';
  weeklyTargetSessions: number;
  weeklyTargetCalories: number;
}

export interface TransactionRequest {
  id: string;
  // ... rest of fields
}
