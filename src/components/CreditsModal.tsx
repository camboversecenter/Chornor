// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React from 'react';
import { X, Code2, Database, Brain, Wallet, Palette, Layout, Globe, Cpu } from 'lucide-react';

interface CreditsModalProps {
  onClose: () => void;
}

const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => {
  const technologies = [
    { name: 'React 18', icon: Code2, color: 'text-blue-500', desc: 'Frontend UI Library' },
    { name: 'TypeScript', icon: Code2, color: 'text-blue-600', desc: 'Type-Safe Programming' },
    { name: 'Tailwind CSS', icon: Palette, color: 'text-cyan-500', desc: 'Utility-First Styling' },
    { name: 'Supabase', icon: Database, color: 'text-green-500', desc: 'Backend, Auth & Database' },
    { name: 'Google Gemini', icon: Brain, color: 'text-purple-600', desc: 'AI Analysis & Content Gen' },
    { name: 'Thirdweb', icon: Wallet, color: 'text-indigo-600', desc: 'Web3 Wallet Integration' },
    { name: 'CoinGecko API', icon: Globe, color: 'text-yellow-600', desc: 'Real-time Crypto Data' },
    { name: 'Lucide React', icon: Layout, color: 'text-pink-500', desc: 'Beautiful Icons' },
    { name: 'Recharts', icon: Layout, color: 'text-red-500', desc: 'Data Visualization' },
    { name: 'Supabase Edge Functions', icon: Cpu, color: 'text-green-700', desc: 'Serverless Compute' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
        <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <Cpu className="text-indigo-600" size={20} />
                    បច្ចេកវិទ្យា (Credits)
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh]">
                <p className="text-sm text-gray-500 mb-4 text-center">
                    កម្មវិធីនេះត្រូវបានបង្កើតឡើងដោយប្រើប្រាស់បច្ចេកវិទ្យាទំនើបៗដូចខាងក្រោម៖
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                    {technologies.map((tech, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
                            <div className={`p-2 rounded-lg bg-white shadow-sm ${tech.color}`}>
                                <tech.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">{tech.name}</h3>
                                <p className="text-xs text-gray-500">{tech.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-mono">
                        Built with ❤️ by E-KHMER Technology Co., Ltd.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CreditsModal;
