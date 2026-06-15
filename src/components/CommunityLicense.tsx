
import React from 'react';
import { X, ShieldCheck, Heart, Users, Coins, AlertTriangle } from 'lucide-react';

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
                        ស្ថានភាព៖ ដំណាក់កាលអភិវឌ្ឍន៍ (Phase: Development & Pre-Token)
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
                            <p className="mb-2">កម្មវិធីនេះអនុញ្ញាតឱ្យប្រើប្រាស់ដោយ ឥតគិតថ្លៃ (Free to Use)។ ដើម្បីផ្គត់ផ្គង់ការចំណាយលើប្រតិបត្តិការ និងការអភិវឌ្ឍ ក្រុមហ៊ុន E-KHMER Technology Co., Ltd. ស្វាគមន៍រាល់ការបរិច្ចាគ (Donations) និងរក្សាសិទ្ធិក្នុងការរកប្រាក់ចំណូលតាមរយៈការផ្សព្វផ្សាយពាណិជ្ជកម្ម (Ads) ឬសេវាកម្មផ្សេងៗ។</p>
                            <p className="text-xs text-gray-500 italic">(Users may use this platform for free. To cover development and operating costs, E-KHMER Technology Co., Ltd. welcomes donations and reserves the right to monetize via advertisements or other services.)</p>
                        </div>
                    </div>

                    {/* Point 2 */}
                    <div className="flex gap-3">
                        <div className="mt-1 bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0 h-fit">
                            <Users size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">២. កម្មសិទ្ធិបច្ចុប្បន្ន (Current Ownership)</h3>
                            <p className="mb-2">បច្ចុប្បន្ននេះ កម្មវិធីនិងកូដ (Source Code) ត្រូវបានអភិវឌ្ឍនិងថែរក្សាដោយក្រុមហ៊ុន E-KHMER Technology Co., Ltd.។ ដើម្បីធានាសុវត្ថិភាពមុនពេលលក់ Token កូដត្រូវបានរក្សាទុកជាឯកជន (Closed Source)។ ហាមដាច់ខាតការចម្លង ឬបំបែកកូដ (Reverse Engineering) ដោយគ្មានការអនុញ្ញាត។</p>
                            <p className="text-xs text-gray-500 italic">(Currently, the source code is proprietary and maintained by E-KHMER Technology Co., Ltd. for security purposes. Reverse engineering or unauthorized copying is strictly prohibited.)</p>
                        </div>
                    </div>

                    {/* Point 3 */}
                    <div className="flex gap-3">
                        <div className="mt-1 bg-purple-100 p-2 rounded-lg text-purple-600 shrink-0 h-fit">
                            <Coins size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">៣. ការសន្យាអនាគត & Token Sale (Future Transition)</h3>
                            <p className="mb-2">នេះជាកិច្ចសន្យារបស់យើង៖ នៅពេលការលក់ Token (Token Sale) បានបញ្ចប់ជាស្ថាពរ ក្រុមហ៊ុននឹងដាក់ឱ្យប្រើប្រាស់កូដជាសាធារណៈ (Open Source) ក្រោមអាជ្ញាប័ណ្ណ Apache License 2.0។ នៅពេលនោះ ការសម្រេចចិត្តនឹងត្រូវធ្វើឡើងតាមរយៈសហគមន៍ (Community Decision/DAO)។</p>
                            <p className="text-xs text-gray-500 italic">(We pledge to release the source code under the Apache License 2.0 upon completion of the Token Sale. Governance rights will then transfer to the Community.)</p>
                        </div>
                    </div>

                    {/* Point 4 */}
                    <div className="flex gap-3">
                        <div className="mt-1 bg-red-100 p-2 rounded-lg text-red-600 shrink-0 h-fit">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">៤. ការបដិសេធការទទួលខុសត្រូវ (Limitation of Liability)</h3>
                            <p className="mb-2">កម្មវិធីនេះត្រូវបានផ្តល់ជូន "ដូចដែលបានមាន" (AS IS) ដោយគ្មានការធានាណាមួយឡើយ។ ក្រុមហ៊ុន E-KHMER Technology Co., Ltd. មិនទទួលខុសត្រូវចំពោះការបាត់បង់ទិន្នន័យ ឬទ្រព្យសម្បត្តិណាមួយដែលកើតឡើងពីការប្រើប្រាស់កម្មវិធីនេះឡើយ។ អ្នកប្រើប្រាស់ត្រូវទទួលខុសត្រូវដោយខ្លួនឯង។</p>
                            <p className="text-xs text-gray-500 italic">(The software is provided "AS IS" without warranty of any kind. E-KHMER Technology Co., Ltd. is not liable for any damages or losses arising from the use of this platform. Users assume full responsibility.)</p>
                        </div>
                    </div>

                </div>

                <div className="pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Community License v1.0 <br/>
                        Power to the people.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CommunityLicense;
