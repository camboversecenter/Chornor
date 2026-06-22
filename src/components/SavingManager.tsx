
import React, { useState, useEffect } from 'react';
import { Saving, SavingTransaction, Family, Currency } from '../types';
import * as storage from '../services/storageService';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import { showConfirm } from '../services/alertService';
import { Plus, ArrowLeft, Target, PiggyBank, History, Trash2, Coins } from 'lucide-react';

interface SavingManagerProps {
  familyMembers: Family[];
  preferredCurrency?: Currency;
}

const SavingManager: React.FC<SavingManagerProps> = ({ familyMembers, preferredCurrency = 'KHR' }) => {
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [savings, setSavings] = useState<Saving[]>([]);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [transactions, setTransactions] = useState<SavingTransaction[]>([]);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newFamilyId, setNewFamilyId] = useState('');
  const [targetDollar, setTargetDollar] = useState('');
  const [targetRiel, setTargetRiel] = useState('');

  // Deposit Form States
  const [depositDollar, setDepositDollar] = useState('');
  const [depositRiel, setDepositRiel] = useState('');
  const [alertType, setAlertType] = useState('1'); // 1=Monthly, 2=Yearly

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    const unsubscribe = storage.subscribeToDataChanges(() => {
      setSavings(storage.getSavings());
      setSelectedSaving(prev => {
        if (!prev) return prev;
        const updated = storage.getSavings().find(s => s._id === prev._id) || null;
        if (updated) {
          setTransactions(storage.getSavingTransactions(updated._id));
        }
        return updated;
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const refreshList = () => {
    setSavings(storage.getSavings());
    if (selectedSaving) {
        // Refresh selected object
        const updated = storage.getSavings().find(s => s._id === selectedSaving._id);
        if (updated) {
            setSelectedSaving(updated);
            setTransactions(storage.getSavingTransactions(updated._id));
        }
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newSaving: Saving = {
        _id: Date.now().toString(),
        title: newTitle,
        familyId: newFamilyId || undefined,
        targetDollar: parseFloat(targetDollar) || 0,
        targetRiel: parseFloat(targetRiel) || 0,
        savedDollar: 0,
        savedRiel: 0,
        createdAt: new Date().toISOString()
    };

    storage.saveSaving(newSaving);
    
    // Reset
    setNewTitle('');
    setNewFamilyId('');
    setTargetDollar('');
    setTargetRiel('');
    refreshList();
    setView('LIST');
  };

  const handleViewDetail = (saving: Saving) => {
      setSelectedSaving(saving);
      setTransactions(storage.getSavingTransactions(saving._id));
      setView('DETAIL');
      // Reset deposit form
      setDepositDollar('');
      setDepositRiel('');
  };

  const handleDeposit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSaving) return;

      const tx: SavingTransaction = {
          _id: Date.now().toString(),
          savingId: selectedSaving._id,
          amountDollar: parseFloat(depositDollar) || 0,
          amountRiel: parseFloat(depositRiel) || 0,
          alert: parseInt(alertType, 10) as 1 | 2,
          isAlerted: false,
          createdAt: new Date().toISOString()
      };

      storage.saveSavingTransaction(tx);
      setDepositDollar('');
      setDepositRiel('');
      refreshList(); // Will update parent totals and transactions
  };

  const handleDeleteSaving = async (id: string) => {
      const confirmed = await showConfirm("លុបគម្រោងសន្សំ? (Delete Plan?)", "តើអ្នកប្រាកដថាចង់លុបគម្រោងសន្សំនេះមែនទេ? (Are you sure?)");
      if(confirmed) {
          storage.deleteSaving(id);
          refreshList();
          setView('LIST');
      }
  };

  const handleDeleteTx = async (id: string) => {
      const confirmed = await showConfirm("លុបប្រតិបត្តិការ?", "ទឹកប្រាក់នឹងត្រូវដកចេញពីការសន្សំ។");
      if(confirmed) {
          storage.deleteSavingTransaction(id);
          refreshList();
      }
  };

  // Helper for visuals
  const fmtUSD = (n: number) => `${CURRENCY_USD}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(n)}`;
  const fmtKHR = (n: number) => `${new Intl.NumberFormat('km-KH').format(n)}${CURRENCY_KHR}`;
  
  const getDisplayTotal = (riel: number, usd: number) => {
      if (preferredCurrency === 'KHR') {
          const total = riel + (usd * EXCHANGE_RATE);
          return fmtKHR(total);
      } else {
          const total = usd + (riel / EXCHANGE_RATE);
          return fmtUSD(total);
      }
  };

  const calculateProgress = (s: Saving) => {
      // Normalize to USD for percentage
      const totalSaved = s.savedDollar + (s.savedRiel / EXCHANGE_RATE);
      const totalTarget = s.targetDollar + (s.targetRiel / EXCHANGE_RATE);
      if (totalTarget === 0) return 0;
      return Math.min(100, (totalSaved / totalTarget) * 100);
  };

  // --- RENDERERS ---

  if (view === 'FORM') {
      return (
          <div className="bg-white rounded-2xl p-6 shadow-sm pb-24 md:pb-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold">បង្កើតគម្រោងសន្សំ (New Goal)</h2>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ចំណងជើង (Title)</label>
                      <input 
                        required
                        type="text" 
                        className="w-full p-3 border rounded-xl" 
                        placeholder="Ex: ទិញឡាន, រៀបការ..."
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                      />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">សម្រាប់ (Family Member)</label>
                      <select 
                        className="w-full p-3 border rounded-xl bg-white"
                        value={newFamilyId}
                        onChange={e => setNewFamilyId(e.target.value)}
                      >
                          <option value="">គ្រួសារ (Family)</option>
                          {familyMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl space-y-3 border border-green-100">
                      <h3 className="font-semibold text-green-800 flex items-center gap-2">
                          <Target size={16} /> គោលដៅ (Target Amount)
                      </h3>
                      <div>
                          <label className="text-xs text-gray-500">ចំនួន (RIEL)</label>
                          <input type="number" step="100" className="w-full p-2 border rounded-lg" value={targetRiel} onChange={e => setTargetRiel(e.target.value)} />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500">ចំនួន (USD)</label>
                          <input type="number" step="0.01" className="w-full p-2 border rounded-lg" value={targetDollar} onChange={e => setTargetDollar(e.target.value)} />
                      </div>
                  </div>

                  <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md">
                      បង្កើត
                  </button>
              </form>
          </div>
      );
  }

  if (view === 'DETAIL' && selectedSaving) {
      const progress = calculateProgress(selectedSaving);
      return (
          <div className="pb-24 md:pb-6 max-w-4xl mx-auto">
              <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-bold truncate max-w-[200px]">{selectedSaving.title}</h2>
                 </div>
                 <button onClick={() => handleDeleteSaving(selectedSaving._id)} className="text-red-400 p-2">
                     <Trash2 size={20} />
                 </button>
              </div>

              <div className="p-4 space-y-4 bg-white rounded-b-2xl shadow-sm">
                  {/* Status Card */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-end mb-4">
                          <div>
                              <p className="text-xs text-gray-500 mb-1">សន្សំបាន (Saved)</p>
                              <div className="flex flex-col">
                                  <span className="text-2xl font-bold text-green-600">
                                      {getDisplayTotal(selectedSaving.savedRiel, selectedSaving.savedDollar)}
                                  </span>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">គោលដៅ (Goal)</p>
                              <div className="font-semibold text-gray-800">
                                  {getDisplayTotal(selectedSaving.targetRiel, selectedSaving.targetDollar)}
                              </div>
                          </div>
                      </div>
                      
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                      </div>
                      <p className="text-right text-xs text-green-600 mt-1 font-medium">{progress.toFixed(1)}%</p>
                  </div>

                  {/* Deposit Form */}
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                          <PiggyBank size={18} /> ដាក់លុយសន្សំ (Deposit)
                      </h3>
                      <form onSubmit={handleDeposit} className="space-y-3">
                          <div className="flex gap-2">
                             <div className="flex-1">
                                 <input 
                                    type="number" step="100" 
                                    placeholder="RIEL" 
                                    className="w-full p-2 rounded-lg border border-green-200 text-sm" 
                                    value={depositRiel}
                                    onChange={e => setDepositRiel(e.target.value)}
                                 />
                             </div>
                             <div className="flex-1">
                                 <input 
                                    type="number" step="0.01" 
                                    placeholder="USD" 
                                    className="w-full p-2 rounded-lg border border-green-200 text-sm" 
                                    value={depositDollar}
                                    onChange={e => setDepositDollar(e.target.value)}
                                 />
                             </div>
                          </div>
                          <div className="flex gap-2">
                              <select 
                                value={alertType} 
                                onChange={e => setAlertType(e.target.value)}
                                className="bg-white p-2 rounded-lg border border-green-200 text-sm"
                              >
                                  <option value="1">រំលឹកប្រចាំខែ</option>
                                  <option value="2">រំលឹកប្រចាំឆ្នាំ</option>
                              </select>
                              <button type="submit" className="flex-1 bg-green-600 text-white font-bold rounded-lg py-2 hover:bg-green-700 text-sm">
                                  បញ្ចូល
                              </button>
                          </div>
                      </form>
                  </div>

                  {/* History */}
                  <div>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <History size={18} /> ប្រវត្តិ (History)
                      </h3>
                      <div className="space-y-2">
                          {transactions.map(tx => (
                              <div key={tx._id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                                  <div>
                                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('km-KH')}</p>
                                      <div className="font-medium text-sm text-gray-800">
                                          {getDisplayTotal(tx.amountRiel, tx.amountDollar)}
                                      </div>
                                  </div>
                                  <button onClick={() => handleDeleteTx(tx._id)} className="text-gray-300 hover:text-red-500">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                          {transactions.length === 0 && (
                              <p className="text-center text-gray-400 text-xs italic py-4">មិនទាន់មានការដាក់ប្រាក់</p>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-xl font-bold text-gray-800">ការសន្សំ (Saving)</h2>
        <button 
            onClick={() => setView('FORM')}
            className="bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className={savings.length > 0 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : ""}>
          {savings.length === 0 ? (
              <div className="text-center py-12 text-gray-400 col-span-full">
                  <PiggyBank size={48} className="mx-auto mb-3 opacity-20" />
                  <p>មិនទាន់មានគម្រោងសន្សំនៅឡើយ</p>
              </div>
          ) : (
              savings.map(s => {
                  const progress = calculateProgress(s);
                  const familyMember = familyMembers.find(f => f._id === s.familyId);
                  return (
                    <div 
                        key={s._id} 
                        onClick={() => handleViewDetail(s)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-800 line-clamp-1">{s.title}</h3>
                                {familyMember && (
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
                                        <Coins size={10} /> {familyMember.name}
                                    </span>
                                )}
                            </div>
                            <span className="font-bold text-green-600 text-sm">{progress.toFixed(0)}%</span>
                        </div>

                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div 
                                className="absolute top-0 left-0 h-full bg-green-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between items-end border-t border-gray-50 pt-2">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-600 text-sm">
                                    {getDisplayTotal(s.savedRiel, s.savedDollar)}
                                </span>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                                Target: {getDisplayTotal(s.targetRiel, s.targetDollar)}
                            </div>
                        </div>
                    </div>
                  );
              })
          )}
      </div>
    </div>
  );
};

export default SavingManager;
