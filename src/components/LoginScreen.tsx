// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState, useEffect } from 'react';
import { loginWithGoogle, createLocalUser } from '../services/authService';
import { getSystemConfig } from '../services/storageService';
import { UserProfile } from '../types';
import { Wallet, ShieldCheck, AlertTriangle, X, FileText, WifiOff, Key, Code, Copy, Check, Terminal, Server, Shield, Code2, Gift } from 'lucide-react';
import HowToGuide from './HowToGuide';
import CommunityLicense from './CommunityLicense';
import CreditsModal from './CreditsModal';
import ThemeToggle from './ThemeToggle';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [guestModeEnabled, setGuestModeEnabled] = useState(false);

  useEffect(() => {
      // Fetch the global config from Supabase
      getSystemConfig().then(enabled => {
          setGuestModeEnabled(enabled);
      });
  }, []);

  const handleGoogleLogin = async () => {
      setLoading(true);
      try {
          await loginWithGoogle();
      } catch (e: any) {
          setError("Login Failed: " + e.message);
          setLoading(false);
      }
  };

  const handleLocalLogin = () => {
      createLocalUser("Guest User", false);
  };

  const handleAdminLogin = () => {
      createLocalUser("Admin User", true);
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 relative overflow-hidden">
       <ThemeToggle className="absolute top-4 right-4 z-20 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20" />
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
       <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

       <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl z-10 animate-in slide-in-from-bottom-5">
           <div className="flex justify-center mb-6">
               <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                   <Wallet className="text-white w-8 h-8" />
               </div>
           </div>
           
           <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">CHORNOR <span className="text-lg text-indigo-500 font-medium">(Beta)</span></h1>
           
           <div className="text-center mb-8">
               <p className="text-sm text-gray-500 mb-4">ប្រព័ន្ធគ្រប់គ្រងហិរញ្ញវត្ថុផ្ទាល់ខ្លួន</p>
               
               <div className="relative group cursor-default">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                    <div className="relative flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100">
                        <Gift size={16} className="text-pink-500 animate-bounce" />
                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                            ប្រើប្រាស់ដោយមិនគិតថ្លៃជារៀងរហូត (Free Forever)
                        </span>
                    </div>
               </div>
           </div>

           {error && (
               <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex flex-col gap-2 text-red-600 text-sm">
                   <div className="flex items-start gap-2">
                       <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                       <div className="flex-1 font-medium leading-tight">{error}</div>
                       <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                   </div>
               </div>
           )}

           <div className="space-y-3">
               <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
                >
                    {loading ? <span className="animate-spin border-2 border-gray-300 border-t-indigo-600 rounded-full w-5 h-5"></span> : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="G" />
                            ចូលប្រើជាមួយ Google
                        </>
                    )}
                </button>

                {guestModeEnabled && (
                    <>
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-xs text-gray-400">ឬសាកល្បង (OR TEST)</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={handleLocalLogin}
                                disabled={loading}
                                className="flex flex-col items-center justify-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 font-medium py-3 px-2 rounded-xl hover:bg-gray-100 transition-all text-sm hover:shadow-sm"
                            >
                                <WifiOff size={16} />
                                ភ្ញៀវ (Guest Mode)
                            </button>
                            <button 
                                onClick={handleAdminLogin}
                                disabled={loading}
                                className="flex flex-col items-center justify-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium py-3 px-2 rounded-xl hover:bg-indigo-100 transition-all text-sm hover:shadow-sm"
                            >
                                <Shield size={16} />
                                អភិបាល (Admin)
                            </button>
                        </div>
                    </>
                )}
           </div>
           
           <div className="mt-8 flex flex-col items-center gap-3">
               <div className="flex items-center gap-2 text-xs text-gray-400">
                   <ShieldCheck size={12} />
                   <span>Secured by Supabase</span>
               </div>
               
               <div className="flex gap-4">
                    <button 
                            onClick={() => setShowLicense(true)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-600 flex items-center gap-1 hover:underline underline-offset-2"
                    >
                        <FileText size={10} />
                        អាជ្ញាប័ណ្ណ (License)
                    </button>
                    <button 
                            onClick={() => setShowCredits(true)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-600 flex items-center gap-1 hover:underline underline-offset-2"
                    >
                        <Code2 size={10} />
                        Credits
                    </button>
               </div>
           </div>
       </div>

       {showHowTo && <HowToGuide onClose={() => setShowHowTo(false)} />}
       {showLicense && <CommunityLicense onClose={() => setShowLicense(false)} />}
       {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
    </div>
  );
};

export default LoginScreen;
