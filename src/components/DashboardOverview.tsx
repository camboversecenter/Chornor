// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useMemo } from 'react';
import { Workout, UserProfile } from '../types';
import { getHeartRateZones } from '../utils/fitnessHelpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Cell,
  Pie,
} from 'recharts';
import { Flame, Clock, Heart, Calendar, Target, Award, ShieldAlert } from 'lucide-react';

interface DashboardOverviewProps {
  workouts: Workout[];
  profile: UserProfile;
  onNavigateToLive: () => void;
}

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#3b82f6', '#ec4899', '#8b5cf6', '#6b7280'];

export default function DashboardOverview({ workouts, profile, onNavigateToLive }: DashboardOverviewProps) {
  // Aggregate stats
  const stats = useMemo(() => {
    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const avgHR = workouts.length
      ? Math.round(workouts.reduce((sum, w) => sum + w.avgHeartRate, 0) / workouts.length)
      : profile.restingHR;
    
    // Sessions in past 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentWorkouts = workouts.filter((w) => new Date(w.date) >= oneWeekAgo);
    const recentCalories = recentWorkouts.reduce((sum, w) => sum + w.calories, 0);
    const recentSessionsCount = recentWorkouts.length;

    return {
      totalMinutes,
      totalCalories,
      avgHR,
      recentCalories,
      recentSessionsCount,
    };
  }, [workouts, profile]);

  // Recharts Data mapping
  const chartData = useMemo(() => {
    return [...workouts]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Best last 7 logs
      .map((w) => {
        // format date string for label e.g., "15 Jun"
        const formattedDate = new Date(w.date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
        });
        return {
          id: w.id,
          name: formattedDate,
          type: w.type,
          calories: w.calories,
          AvgHR: w.avgHeartRate,
          MaxHR: w.maxHeartRate,
          duration: w.duration,
        };
      });
  }, [workouts]);

  // Workout type distribution data
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    workouts.forEach((w) => {
      counts[w.type] = (counts[w.type] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
    }));
  }, [workouts]);

  const hrZones = useMemo(() => getHeartRateZones(profile.age), [profile.age]);

  // Calorie and Session target progress
  const caloriePercent = Math.min(100, Math.round((stats.recentCalories / profile.weeklyTargetCalories) * 100));
  const sessionPercent = Math.min(100, Math.round((stats.recentSessionsCount / profile.weeklyTargetSessions) * 100));

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Target Progress Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banner Quick Setup */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-950 to-gray-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              Active Week Performance
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-display text-white mt-1">
              Hey, Coach Gemini is ready with custom zone guidelines!
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Track heart rate thresholds in real-time. Use the simulator under the <strong className="text-rose-400">Live Simulation</strong> tab to log an active workout, or use manual logging below.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={onNavigateToLive}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-rose-600/20 focus:outline-none flex items-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 animate-pulse text-white" />
              Launch Live HR Simulator
            </button>
          </div>
        </div>

        {/* Dynamic Targets Summary */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase flex items-center justify-between">
            <span>Weekly Progress Targets</span>
            <Target className="w-4 h-4 text-slate-400" />
          </h3>

          {/* Calorie Goal Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-medium text-slate-400">Calories Burned (7d)</span>
              <span className="text-xs font-semibold text-slate-200">
                <span className="text-emerald-400 font-mono text-sm">{stats.recentCalories}</span> / {profile.weeklyTargetCalories} kcal
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0%</span>
              <span>{caloriePercent}% completed</span>
              <span>100%</span>
            </div>
          </div>

          {/* Session Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-medium text-slate-400">Exercise Sessions (7d)</span>
              <span className="text-xs font-semibold text-slate-200">
                <span className="text-rose-400 font-mono text-sm">{stats.recentSessionsCount}</span> / {profile.weeklyTargetSessions} logs
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${sessionPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0%</span>
              <span>{sessionPercent}% completed</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700/60 transition-colors">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">All-time Burn</p>
            <p className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
              {stats.totalCalories} <span className="text-xs font-sans text-slate-500 font-normal">kcal</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700/60 transition-colors">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Minutes</p>
            <p className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
              {stats.totalMinutes} <span className="text-xs font-sans text-slate-500 font-normal">mins</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700/60 transition-colors">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Avg Heart Rate</p>
            <p className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
              {stats.avgHR} <span className="text-xs font-sans text-slate-500 font-normal">bpm</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700/60 transition-colors">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium font-sans">Workout Logs</p>
            <p className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
              {workouts.length} <span className="text-xs font-sans text-slate-500 font-normal font-sans">total</span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calories Burned Weekly Line - Recharts */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight font-display">Energy Expenditure (Latest Logs)</h3>
            <p className="text-xs text-slate-400">Calories (kcal) burned per completed exercise session</p>
          </div>
          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm italic">
              No workouts logged yet. Go to Live Simulation or Log Form to start!
            </div>
          ) : (
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Heart Rate Peaks Weekly Chart */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight font-display">Cardiac Intensity Variance</h3>
            <p className="text-xs text-slate-400">Comparing average heart rates with the peak/max logged heart rates (bpm)</p>
          </div>
          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm italic">
              No cardiovascular logs available. Start your first session!
            </div>
          ) : (
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 15', 'dataMax + 10']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="MaxHR" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="AvgHR" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Lower Row Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Distribution PIE Chart */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 lg:col-span-1">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight font-display">Workout Mix</h3>
            <p className="text-xs text-slate-400">Distribution of your sports disciplines</p>
          </div>
          {pieData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs italic">
              No discipline mix data.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-44 flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 min-w-[70px]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-300 font-medium truncate">{item.name}</span>
                    <span className="text-slate-500 font-mono ml-auto">({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Personalized Target Zones Summary */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight font-display">Your Physiological Heart Rate Zones</h3>
              <p className="text-xs text-slate-400">Accurately calibrated for your age ({profile.age} years old) - Max: {220 - profile.age} bpm</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5" /> Safety Guidelines
            </span>
          </div>

          <div className="space-y-3 mt-1">
            {hrZones.map((zone) => (
              <div key={zone.name} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full ${zone.color} shrink-0`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      {zone.name}
                      <span className={`${zone.textColor} ${zone.bgColor} px-1.5 py-0.5 rounded text-[10px] font-mono`}>
                        {zone.min}0-100% {zone.min} - {zone.max} bpm
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{zone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
