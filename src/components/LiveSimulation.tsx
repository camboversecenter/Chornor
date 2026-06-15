import React, { useState, useEffect, useRef } from 'react';
import { Heart, Play, Pause, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import { Workout, WorkoutType, UserProfile } from '../types';
import { calculateCalorieBurn } from '../utils/fitnessHelpers';

interface LiveSimulationProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveWorkout: (workout: Workout) => void;
}

export default function LiveSimulation({ profile, onBack, onSaveWorkout }: LiveSimulationProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // minutes
  const [currentHR, setCurrentHR] = useState(profile.restingHR);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('Running');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        // Simulate HR fluctuation
        setCurrentHR((prev) => {
          const delta = Math.floor(Math.random() * 11) - 5;
          const nextHR = prev + delta;
          const maxHR = 220 - profile.age;
          return Math.max(profile.restingHR, Math.min(maxHR + 10, nextHR));
        });
      }, 1000); // Actually seconds, but for the sake of simulation let's pretend 1s = 1min or just fix the time calculation
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, profile.age, profile.restingHR]);

  const handleSave = () => {
    const newWorkout: Workout = {
      id: `w-${Date.now()}`,
      type: workoutType,
      duration: Math.round(elapsedTime / 6), // Scale for simulation
      avgHeartRate: Math.round(currentHR),
      maxHeartRate: Math.round(currentHR + 10),
      calories: calculateCalorieBurn(workoutType, Math.round(elapsedTime / 6), profile.weight),
      date: new Date().toISOString().split('T')[0],
      notes: 'Recorded in Live Simulation mode.',
      intensity: 'Moderate',
    };
    onSaveWorkout(newWorkout);
    onBack();
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </button>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-8">
        <h2 className="text-3xl font-bold font-display text-white">Live HR Simulator</h2>
        
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-4 border-rose-500/20 ${isRunning ? 'animate-pulse' : ''}`}></div>
            <div className="text-center">
                <Heart className={`w-16 h-16 mx-auto ${isRunning ? 'animate-bounce text-rose-500' : 'text-slate-600'}`} />
                <div className="text-4xl font-mono font-bold text-white mt-2">{currentHR} <span className="text-lg text-slate-500 font-sans">bpm</span></div>
            </div>
        </div>

        <div className="flex justify-center gap-4">
            <button onClick={() => setIsRunning(!isRunning)} className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${isRunning ? 'bg-amber-600' : 'bg-emerald-600'} text-white`}>
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isRunning ? 'Pause' : 'Start Simulation'}
            </button>
            <button onClick={handleSave} disabled={elapsedTime === 0} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700 disabled:opacity-50">
                <Save className="w-5 h-5" /> Finish & Save
            </button>
        </div>
      </div>
    </div>
  );
}
