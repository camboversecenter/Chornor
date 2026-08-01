// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState } from 'react';
import { X, BookOpen, CheckCircle, Wallet, Camera, Brain, Coins, PiggyBank, Bitcoin, Globe, ShieldCheck, User, Wifi, WifiOff, Code, DownloadCloud } from 'lucide-react';

interface HowToGuideProps {
  onClose: () => void;
}

const HowToGuide: React.FC<HowToGuideProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('start');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button 
        onClick={() => scrollTo(id)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSection === id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
    >
        <Icon size={16} />
        <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col w-full h-full animate-in slide-in-from-bottom-5 duration-300">
        
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center shadow-sm sticky top-0 z-10 safe-top">
            <div className="flex items-center gap-2 text-indigo-700">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-none">របៀបប្រើប្រាស់</h1>
                    <p className="text-[10px] text-gray-500 font-medium">User Manual</p>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Navigation Bar (Scrollable) */}
        <div className="bg-gray-50 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-b border-gray-200 sticky top-[60px] z-10 backdrop-blur-sm bg-gray-50/90">
            <NavItem id="start" icon={User} label="ចាប់ផ្តើម" />
            <NavItem id="tx" icon={Wallet} label="ចំណូល/ចំណាយ" />
            <NavItem id="ai" icon={Brain} label="AI & Scan" />
            <NavItem id="lending" icon={Coins} label="កម្ចី" />
            <NavItem id="saving" icon={PiggyBank} label="សន្សំ" />
            <NavItem id="crypto" icon={Bitcoin} label="គ្រីបតូ" />
            <NavItem id="community" icon={Globe} label="សហគមន៍" />
            <NavItem id="api" icon={Code} label="API & Connect" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24 scroll-smooth">
            
            {/* 1. Getting Started */}
            <section id="start" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User className="text-indigo-600" />
                    ១. ការចាប់ផ្តើម (Getting Started)
                </h2>
                
                <div className="grid gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
                             <h3 className="font-bold text-gray-800">Google Login (ណែនាំឱ្យប្រើ)</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            ទិន្នន័យរបស់អ្នកនឹងត្រូវបានរក្សាទុកនៅលើ Cloud (Firebase)។ អ្នកអាចផ្លាស់ប្តូរទូរស័ព្ទ ឬប្រើកុំព្យូទ័រ ដោយមិនបាត់បង់ទិន្នន័យ។
                        </p>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Online & Secure</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                             <User className="w-5 h-5 text-gray-500" />
                             <h3 className="font-bold text-gray-800">Test User / Guest</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            ការប្រើប្រាស់បែបសាកល្បង។ ទិន្នន័យអាចនឹងបាត់បង់ប្រសិនបើអ្នក Clear Browser Cache។
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                             <WifiOff className="w-5 h-5 text-gray-500" />
                             <h3 className="font-bold text-gray-800">Local / Offline Mode</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            ប្រសិនបើប្រព័ន្ធមិនអាចភ្ជាប់ទៅកាន់ Server បាន (Error) កម្មវិធីនឹងប្តូរទៅប្រើ Local Mode ដោយស្វ័យប្រវត្តិ។ ទិន្នន័យរក្សាទុកក្នុងទូរស័ព្ទដៃរបស់អ្នកតែប៉ុណ្ណោះ។
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. Transactions */}
            <section id="tx" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Wallet className="text-indigo-600" />
                    ២. ចំណូល និង ចំណាយ (Transactions)
                </h2>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex gap-3">
                            <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">កត់ត្រាថ្មី:</span> ចុចប៊ូតុង <span className="font-bold text-indigo-600">(+)</span> នៅកណ្តាលនៃ Menu ខាងក្រោម។
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">ជ្រើសរើសប្រភេទ:</span> បែងចែកថាជា ចំណូល (Income) ឬ ចំណាយ (Expense)។ អ្នកអាចបង្កើតប្រភេទថ្មីបាននៅក្នុង <span className="font-bold">Settings (កំណត់)</span>។
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">ការរំលឹក (Reminder):</span> សម្រាប់ចំណាយថេរ (ថ្លៃផ្ទះ, ថ្លៃភ្លើង) អ្នកអាចកំណត់ជា "រៀងរាល់ខែ"។ ប្រព័ន្ធនឹងជូនដំណឹងនៅពេលដល់ថ្ងៃ។
                            </div>
                        </li>
                    </ul>
                </div>
            </section>

            {/* 3. AI & Scanning */}
            <section id="ai" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Brain className="text-indigo-600" />
                    ៣. បច្ចេកវិទ្យា AI & Scan
                </h2>
                
                <div className="grid gap-4">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <h3 className="font-bold text-indigo-800 flex items-center gap-2 mb-2">
                            <Camera size={18} />
                            Receipt Scanning
                        </h3>
                        <p className="text-sm text-gray-700">
                            នៅពេលបន្ថែមប្រតិបត្តិការ អ្នកអាចចុចប៊ូតុង <b>"Scan Receipt"</b> ដើម្បីថតវិក្កយបត្រ។ AI នឹងអានទិន្នន័យដូចជា តម្លៃ, កាលបរិច្ឆេទ, និងមុខទំនិញ (Items) ដោយស្វ័យប្រវត្តិ។
                        </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <h3 className="font-bold text-purple-800 flex items-center gap-2 mb-2">
                            <Brain size={18} />
                            AI Financial Advisor
                        </h3>
                        <p className="text-sm text-gray-700">
                            នៅទំព័រដើម (Dashboard) អ្នកអាចចុចប៊ូតុង <b>"វិភាគទិន្នន័យ"</b>។ AI នឹងពិនិត្យមើលចំណូលចំណាយរបស់អ្នក ហើយផ្តល់យោបល់ជាភាសាខ្មែរ ដើម្បីឱ្យអ្នកចេះសន្សំសំចៃជាងមុន។
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. Lending */}
            <section id="lending" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Coins className="text-indigo-600" />
                    ៤. ការគ្រប់គ្រងកម្ចី (Lending)
                </h2>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700 space-y-3">
                    <p>
                        ប្រើសម្រាប់កត់ត្រា បំណុល (គេជំពាក់យើង) ឬ កម្ចី (យើងជំពាក់គេ)។
                    </p>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-800">មុខងារពិសេស:</span>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>គណនាការប្រាក់ (Interest) ដោយស្វ័យប្រវត្តិ។</li>
                            <li>បង្កើតតារាងបង់ប្រាក់ (Schedule) សម្រាប់កម្ចីរយៈពេលវែង (បង់រំលស់)។</li>
                            <li>កត់ត្រាប្រវត្តិការសងប្រាក់ត្រឡប់មកវិញ។</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 5. Saving */}
            <section id="saving" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <PiggyBank className="text-green-600" />
                    ៥. ការសន្សំ (Savings)
                </h2>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700">
                    <p className="mb-3">
                        កំណត់គោលដៅហិរញ្ញវត្ថុរបស់អ្នក (ឧទាហរណ៍: ទិញឡាន, រៀបការ, ឬលុយបន្ទាន់)។
                    </p>
                    <p>
                        អ្នកអាចកត់ត្រាការដាក់ប្រាក់ចូល (Deposit) ហើយមើល Progress Bar ថាតើសម្រេចបានប៉ុន្មានភាគរយហើយ។
                    </p>
                </div>
            </section>

            {/* 6. Crypto */}
            <section id="crypto" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Bitcoin className="text-orange-500" />
                    ៦. គ្រីបតូ (Crypto Assets)
                </h2>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700 space-y-3">
                    <p>
                        តាមដានតម្លៃទ្រព្យសម្បត្តិឌីជីថលរបស់អ្នក។
                    </p>
                    <div className="flex gap-2 items-start bg-orange-50 p-2 rounded-lg text-orange-800 text-xs border border-orange-100">
                        <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                        <p>
                            <b>ចំណាំ៖</b> ការបង្កើតកាបូប (Wallet) តម្រូវឱ្យមានការអនុញ្ញាតពី Admin (Whitelist)។ ប្រសិនបើអ្នកមិនអាច Activate បាន សូមទាក់ទង Admin។
                        </p>
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><b>Search:</b> ស្វែងរកឈ្មោះកាក់ (BTC, ETH, SOL...)។</li>
                        <li><b>Track:</b> កត់ត្រាការទិញ/លក់ (Buy/Sell) ដើម្បីគណនាប្រាក់ចំណេញ/ខាត។</li>
                        <li><b>Wallet:</b> ភ្ជាប់ជាមួយ Base Chain ដើម្បីផ្ញើនិងទទួលកាក់។</li>
                    </ul>
                </div>
            </section>

             {/* 7. Community */}
             <section id="community" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Globe className="text-blue-500" />
                    ៧. សហគមន៍ (Community)
                </h2>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700">
                    <p className="mb-3">
                        កន្លែងចែករំលែកចំណេះដឹងហិរញ្ញវត្ថុ។ មាន ៣ ផ្នែកធំៗ៖
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        <div className="bg-orange-50 text-orange-700 p-2 rounded-lg text-xs font-bold text-center">បន្ថយចំណាយ</div>
                        <div className="bg-green-50 text-green-700 p-2 rounded-lg text-xs font-bold text-center">បង្កើនចំណូល</div>
                        <div className="bg-purple-50 text-purple-700 p-2 rounded-lg text-xs font-bold text-center">ទ្រព្យឌីជីថល</div>
                    </div>
                    <div className="flex gap-2 items-start bg-blue-50 p-2 rounded-lg text-blue-800 text-xs">
                        <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                        <p>
                            រាល់ការបង្ហោះ (Post) នឹងត្រូវបានត្រួតពិនិត្យដោយ AI ដើម្បីធានាថាមានប្រយោជន៍ និងមិនមានការបោកប្រាស់។
                        </p>
                    </div>
                </div>
            </section>

            {/* 8. API & Integrations */}
            <section id="api" className="space-y-4 scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Code className="text-cyan-600" />
                    ៨. ការភ្ជាប់ប្រព័ន្ធ (API & Integrations)
                </h2>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700 space-y-4">
                    <p>
                        Chornor អនុញ្ញាតឱ្យកម្មវិធីខាងក្រៅ (ដូចជា App កក់អីវ៉ាន់ ឬ ធនាគារ) បញ្ជូនទិន្នន័យចំណាយចូលក្នុងគណនីរបស់អ្នកដោយស្វ័យប្រវត្តិ។
                    </p>
                    
                    <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                        <h3 className="font-bold text-cyan-800 flex items-center gap-2 mb-2">
                            <DownloadCloud size={18} />
                            របៀបអនុម័តសំណើ (Approving Requests)
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2 text-cyan-900">
                            <li>នៅពេលមានការបញ្ជូនទិន្នន័យ អ្នកនឹងទទួលបាន <b>Notification</b>។</li>
                            <li>ចុចលើការជូនដំណឹង ដើម្បីបើកផ្ទាំង <b>"Review Requests"</b>។</li>
                            <li>ជ្រើសរើស <b>ប្រភេទ (Category)</b> សម្រាប់ចំណាយនោះ។</li>
                            <li>ចុច <b>Approve</b> ដើម្បីរក្សាទុកចូលក្នុងប្រវត្តិ។</li>
                        </ol>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
                        <b>សម្រាប់អ្នកអភិវឌ្ឍន៍ (For Developers):</b> API Key អាចបង្កើតបាននៅក្នុង Admin Dashboard។ សូមមើលឯកសារបច្ចេកទេសក្នុង <code>doc/API_REFERENCE.md</code> សម្រាប់ព័ត៌មានលម្អិតអំពី Endpoints។
                    </div>
                </div>
            </section>

            {/* 9. Admin */}
            <section className="space-y-4 scroll-mt-32">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <ShieldCheck className="text-slate-600" />
                    ៩. Admin Panel
                </h2>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700">
                    <p>
                        សម្រាប់អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin) អាចមើលឃើញចំនួនអ្នកប្រើប្រាស់សរុប, ចាត់ចែងសិទ្ធិ Admin, និងកំណត់ Whitelist សម្រាប់ Wallet។ មុខងារនេះបង្ហាញតែចំពោះគណនីដែលបានកំណត់សិទ្ធិប៉ុណ្ណោះ។
                    </p>
                </div>
            </section>

            {/* Footer */}
            <div className="text-center text-gray-400 text-xs pt-8 pb-4">
                CHORNOR App - Version 0.02 (Beta)<br/>
                Developed with Gemini AI & Firebase
            </div>
        </div>
    </div>
  );
};

export default HowToGuide;
