// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import React from 'react';
import { X, ShieldCheck, Heart, Users, Code2, AlertTriangle } from 'lucide-react';

interface CommunityLicenseProps {
  onClose: () => void;
}

const CommunityLicense: React.FC<CommunityLicenseProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
        <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600" size={20} />
                    អាជ្ញាប័ណ្ណសហគមន៍ (Community License)
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                        ស្ថានភាព៖ គម្រោងសហគមន៍បើកចំហ (Free & Open Source)
                    </span>
                </div>

                <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

                    {/* Point 1 */}
                    <div className="flex gap-3">
                        <div className="mt-1 bg-green-100 p-2 rounded-lg text-green-600 shrink-0 h-fit">
                            <Heart size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">១. សិទ្ធិប្រើប្រាស់ និងការគាំទ្រ (Usage & Support)</h3>
                            <p className="mb-2">Chornor ជាគម្រោងសហគមន៍ ដែលអនុញ្ញាតឱ្យប្រើប្រាស់ដោយ ឥតគិតថ្លៃ (Free to Use)។ ដើម្បីទ្រទ្រង់ការអភិវឌ្ឍ និងប្រតិបត្តិការ គម្រោងនេះពឹងផ្អែកលើ ការគាំទ្រពីសហគមន៍ ការបរិច្ចាគ (Donations) មូលនិធិឧបត្ថម្ភ (Grants) និងការបណ្តុះបណ្តាល (Training)។</p>
                            <p className="text-xs text-gray-500 italic">(Chornor is a community project, free to use. It is sustained through community support, donations, grants, and training, not through proprietary licensing.)</p>
                        </div>
                    </div>

                    {/* Point 2 */}
                    <div className="flex gap-3">
                        <div className="mt-1 bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0 h-fit">
                            <Users size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">២. កម្មសិទ្ធិ (Ownership)</h3>
                            <p className="mb-2">កម្មវិធី និងកូដ (Source Code) ជាកម្មសិទ្ធិរបស់ក្រុមនិស្សិត "Tomorrow Rich Together" ដែលត្រូវបានបណ្តុះ (Incubated) ដោយ CamboVerse Center មានទីតាំងនៅ សាកលវិទ្យាល័យជាតិគ្រប់គ្រង (National University of Management)។</p>
                            <p className="text-xs text-gray-500 italic">(The app and its source code are owned by the student team "Tomorrow Rich Together", incubated by the CamboVerse Center, located at the National University of Management.)</p>
                        </div>
                    </div>

                    {/* Point 3 */}
                    <div className="flex gap-3">
                        <div className="mt-1 bg-purple-100 p-2 rounded-lg text-purple-600 shrink-0 h-fit">
                            <Code2 size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">៣. កូដបើកចំហ និងអាជ្ញាប័ណ្ណ (Open Source & License)</h3>
                            <p className="mb-2">កូដត្រូវបានបើកចំហជាសាធារណៈ (Open Source) ក្រោមអាជ្ញាប័ណ្ណ GNU AGPL v3.0 ឬ ក្រោយៗ។ អ្នករាល់គ្នាមានសិទ្ធិ ប្រើប្រាស់ សិក្សា ចែករំលែក និងកែប្រែ។ ប្រសិនបើអ្នកដាក់កំណែដែលបានកែប្រែឱ្យដំណើរការជាសេវាកម្មតាមបណ្តាញ (Hosted Service) អ្នកត្រូវចែករំលែកកូដដែលបានកែប្រែនោះជូនអ្នកប្រើប្រាស់ផងដែរ។</p>
                            <p className="text-xs text-gray-500 italic">(The source code is open under the GNU AGPL v3.0 or later. You may use, study, share, and modify it. If you run a modified version as a hosted network service, you must also make your modified source available to its users.)</p>
                        </div>
                    </div>

                    {/* Point 4 */}
                    <div className="flex gap-3">
                        <div className="mt-1 bg-red-100 p-2 rounded-lg text-red-600 shrink-0 h-fit">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">៤. ការបដិសេធការទទួលខុសត្រូវ (Limitation of Liability)</h3>
                            <p className="mb-2">កម្មវិធីនេះត្រូវបានផ្តល់ជូន "ដូចដែលមាន" (AS IS) ដោយគ្មានការធានាណាមួយឡើយ។ ក្រុម "Tomorrow Rich Together" មិនទទួលខុសត្រូវចំពោះការបាត់បង់ទិន្នន័យ ឬទ្រព្យសម្បត្តិណាមួយ ដែលកើតឡើងពីការប្រើប្រាស់កម្មវិធីនេះឡើយ។ ជាពិសេសចំពោះមុខងារ Crypto និង Wallet អ្នកប្រើប្រាស់ត្រូវរក្សា Private Key និង Recovery Phrase ដោយប្រុងប្រយ័ត្ន ហើយទទួលខុសត្រូវដោយខ្លួនឯង។</p>
                            <p className="text-xs text-gray-500 italic">(The software is provided "AS IS" without warranty of any kind. Tomorrow Rich Together is not liable for any data or asset loss arising from its use. For crypto and wallet features in particular, you are responsible for safeguarding your private keys and recovery phrase.)</p>
                        </div>
                    </div>

                </div>

                <div className="pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Chornor Community License · AGPL-3.0-or-later <br/>
                        Power to the people.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CommunityLicense;
