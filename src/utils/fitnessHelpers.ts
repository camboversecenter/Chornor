// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import { Workout, WorkoutType, UserProfile } from '../types';

// Standard MET values for various exercise categories
export const ACTIVITY_MET_VALUES: Record<WorkoutType, number> = {
  Running: 9.8,
  Cycling: 7.5,
  Strength: 3.5,
  Yoga: 2.5,
  HIIT: 11.0,
  Walking: 3.8,
  Other: 5.0,
};

// Calculate standard MET-based calorie burn
export function calculateCalorieBurn(
  type: WorkoutType,
  durationMinutes: number,
  weightKg: number
): number {
  const met = ACTIVITY_MET_VALUES[type] || 5.0;
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

// Age-based heart rate zone definitions
export interface HeartRateZone {
  name: string;
  min: number;
  max: number;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export function getHeartRateZones(age: number): HeartRateZone[] {
  const maxHR = 220 - age;
  return [
    {
      name: 'Resting/Warm-up',
      min: 0,
      max: Math.round(maxHR * 0.60),
      description: 'Active recovery, warm-up pacing, and steady metabolic transition.',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
    },
    {
      name: 'Fat Burn',
      min: Math.round(maxHR * 0.60) + 1,
      max: Math.round(maxHR * 0.70),
      description: 'Optimal metabolic training pace maximizing stored lipolytic conversion.',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-400',
    },
    {
      name: 'Aerobic (Cardio)',
      min: Math.round(maxHR * 0.70) + 1,
      max: Math.round(maxHR * 0.85),
      description: 'Builds cellular cardiorespiratory endurance, VO2 max, and stroke volume.',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400',
    },
    {
      name: 'Anaerobic (Peak)',
      min: Math.round(maxHR * 0.85) + 1,
      max: maxHR,
      description: 'High lactic threshold boundaries. Enhances athletic raw speed & peak capacity.',
      color: 'bg-rose-500',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400',
    },
  ];
}

// Find appropriate zone for a specific heart rate
export function getZoneForHR(hr: number, age: number): HeartRateZone {
  const zones = getHeartRateZones(age);
  const matched = zones.find((z) => hr >= z.min && hr <= z.max);
  if (matched) return matched;
  // Fallbacks
  if (hr > 220 - age) return zones[zones.length - 1];
  return zones[0];
}

// Generate pre-loaded mock workout data to populate graphs with amazing stateful experience
export function getInitialWorkouts(): Workout[] {
  const today = new Date();
  
  const createPastDateString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'w-1',
      type: 'Running',
      duration: 35,
      avgHeartRate: 148,
      maxHeartRate: 168,
      calories: 343,
      date: createPastDateString(0), // Today
      notes: 'Evening road running interval session. Felt energised and cardiac recovery was fantastic!',
      intensity: 'High',
    },
    {
      id: 'w-2',
      type: 'Yoga',
      duration: 45,
      avgHeartRate: 105,
      maxHeartRate: 122,
      calories: 112,
      date: createPastDateString(1), // Yesterday
      notes: 'Mindful physical alignment class. Focused on core stability and deep diaphragm breathing.',
      intensity: 'Low',
    },
    {
      id: 'w-3',
      type: 'HIIT',
      duration: 25,
      avgHeartRate: 162,
      maxHeartRate: 181,
      calories: 320,
      date: createPastDateString(3),
      notes: 'Functional Tabata intensity circuit. High cardio threshold peak times, lactic threshold test.',
      intensity: 'Peak',
    },
    {
      id: 'w-4',
      type: 'Strength',
      duration: 50,
      avgHeartRate: 115,
      maxHeartRate: 135,
      calories: 204,
      date: createPastDateString(4),
      notes: 'Upper body hypertrophic push focus. 3-minute resting rest rates kept heart average steady.',
      intensity: 'Moderate',
    },
    {
      id: 'w-5',
      type: 'Cycling',
      duration: 40,
      avgHeartRate: 138,
      maxHeartRate: 155,
      calories: 350,
      date: createPastDateString(6),
      notes: 'Indoor high resistance spin, heavy climb simulator. Strong active calf and quad recruitment.',
      intensity: 'High',
    },
  ];
}

export const DEFAULT_PROFILE: UserProfile = {
  id: 'fitness_demo',
  name: 'Demo Athlete',
  age: 28,
  weight: 72,
  restingHR: 64,
  gender: 'Female',
  weeklyTargetSessions: 4,
  weeklyTargetCalories: 1200,
};
