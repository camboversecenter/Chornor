// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState, useEffect } from 'react';
import { Lending, LendingTransaction, Family, Currency } from '../types';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import * as storage from '../services/storageService';
import { showConfirm, showAlert } from '../services/alertService';
import { Plus, ArrowLeft, Calendar, CheckCircle, Circle, Trash2, User, Coins, DollarSign, Wallet } from 'lucide-react';

interface LendingManagerProps {
  familyMembers: Family[];
  preferredCurrency?: Currency;
}

const LendingManager: React.FC<LendingManagerProps> = ({ familyMembers, preferredCurrency = 'KHR' }) => {
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [selectedLending, setSelectedLending] = useState<Lending | null>(null);
  const [transactions, setTransactions] = useState<LendingTransaction[]>([]);

  // Repayment Modal State
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayRiel, setRepayRiel] = useState('');
  const [repayDollar, setRepayDollar] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Lending>>({
      title: '',
      lender: '',
      borrower: '',
      amountRiel: 0,
      amountDollar: 0,
      interestRate: 0,
      paymentMonths: 0,
      downRiel: 0,
      downDollar: 0,
      paymentMethod: 'មិនកំណត់'
  });

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    return storage.subscribeToDataChanges(() => {
      setLendings(storage.getLendings());
      setSelectedLending(prev => {
        if (!prev) return prev;
        const updated = storage.getLendings().find(l => l._id === prev._id) || null;
        if (updated) {
          setTransactions(storage.getTransactionsByLendingId(updated._id));
        }
        return updated;
      });
    });
  }, []);

  const refreshList = () => {
    setLendings(storage.getLendings());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const newLending: Lending = {
        _id: Date.now().toString(),
        title: formData.title || '',
        lender: formData.lender || '',
        borrower: formData.borrower || '',
        amountRiel: Number(formData.amountRiel) || 0,
        amountDollar: Number(formData.amountDollar) || 0,
        interestRate: Number(formData.interestRate) || 0,
        paymentMonths: Number(formData.paymentMonths) || 0,
        downRiel: Number(formData.downRiel) || 0,
        downDollar: Number(formData.downDollar) || 0,
        paymentMethod: formData.paymentMethod as any,
        isComplete: false,
        createdAt: new Date().toISOString()
    };

    storage.saveLending(newLending);
    
    // Auto generate schedule if monthly
    if (newLending.paymentMethod === 'ប្រចាំខែ') {
        storage.generateLoanSchedule(newLending);
    }

    refreshList();
    setView('LIST');
    setFormData({ paymentMethod: 'មិនកំណត់' }); // Reset minimal
  };

  const handleViewDetail = (lending: Lending) => {
      setSelectedLending(lending);
      setTransactions(storage.getTransactionsByLendingId(lending._id));
      setView('DETAIL');
      // Reset repay form
      setRepayRiel('');
      setRepayDollar('');
      setShowRepayModal(false);
  };

  const handleDelete = async (id: string) => {
      const confirmed = await showConfirm("លុបកម្ចីនេះ?", "ទិន្នន័យការសងនឹងត្រូវលុបដែរ។");
      if (confirmed) {
          const result = await storage.deleteLending(id);
          if (result.success) {
              refreshList();
              if (view === 'DETAIL') setView('LIST');
          } else {
              showAlert("កំហុស (Error)", "មិនអាចលុបកម្ចីបានទេ។ (Unable to delete lending)", "error");
          }
      }
  };

  const toggleTransactionPaid = (tx: LendingTransaction) => {
      const updated = { ...tx, isPaid: !tx.isPaid, paidAt: !tx.isPaid ? new Date().toISOString() : undefined };
      storage.saveLendingTransaction(updated);
      // Refresh local state
      setTransactions(prev => prev.map(t => t._id === tx._id ? updated : t));
  };

  const handleManualRepay = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLending) return;

      const rRiel = parseFloat(repayRiel) || 0;
      const rDollar = parseFloat(repayDollar) || 0;

      if (rRiel === 0 && rDollar === 0) return;

      // Calculate new balance based on previous records
      // Note: This is a simplified calculation for manual/ad-hoc records
      const previousBalanceRiel = selectedLending.amountRiel - transactions.reduce((acc, t) => acc + (t.isPaid ? t.principalRiel : 0), 0);
      const previousBalanceDollar = selectedLending.amountDollar - transactions.reduce((acc, t) => acc + (t.isPaid ? t.principalDollar : 0), 0);

      const tx: LendingTransaction = {
          _id: Date.now().toString(),
          lendingId: selectedLending._id,
          month: transactions.length + 1,
          dueDate: new Date().toISOString(),
          amountRiel: rRiel,
          amountDollar: rDollar,
          interestRiel: 0, // Manual repayment assumed strictly principal for simplicity unless logic expanded
          interestDollar: 0,
          principalRiel: rRiel,
          principalDollar: rDollar,
          balanceRiel: Math.max(0, previousBalanceRiel - rRiel),
          balanceDollar: Math.max(0, previousBalanceDollar - rDollar),
          isPaid: true,
          paidAt: new Date().toISOString()
      };

      storage.saveLendingTransaction(tx);
      setTransactions([...transactions, tx]);
      
      setRepayRiel('');
      setRepayDollar('');
      setShowRepayModal(false);
  };

  // Helper for currency formatting
  const fmtUSD = (n: number) => `${CURRENCY_USD}${n.toFixed(2)}`;
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

  // Calculate Remaining Balance for Detail View
  const getRemainingBalance = (lending: Lending) => {
      const totalPaidRiel = transactions.filter(t => t.isPaid).reduce((acc, t) => acc + t.principalRiel, 0);
      const totalPaidDollar = transactions.filter(t => t.isPaid).reduce((acc, t) => acc + t.principalDollar, 0);
      
      const remainRiel = (lending.amountRiel - lending.downRiel) - totalPaidRiel;
      const remainDollar = (lending.amountDollar - lending.downDollar) - totalPaidDollar;

      return getDisplayTotal(Math.max(0, remainRiel), Math.max(0, remainDollar));
  };

  // --- RENDERERS ---

  if (view === 'FORM') {
      return (
          <div className="bg-white rounded-2xl p-6 shadow-sm pb-24 md:pb-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold">បង្កើតកម្ចីថ្មី (New Loan)</h2>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ចំណងជើង (Title)</label>
                      <input 
                        required
                        type="text" 
                        className="w-full p-3 border rounded-xl" 
                        placeholder="Ex: ខ្ចីលុយទិញម៉ូតូ"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">អ្នកឱ្យខ្ចី (Lender)</label>
                          <input 
                            list="familyList"
                            type="text" 
                            className="w-full p-3 border rounded-xl"
                            placeholder="ឈ្មោះ"
                            value={formData.lender}
                            onChange={e => setFormData({...formData, lender: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">អ្នកខ្ចី (Borrower)</label>
                          <input 
                            list="familyList"
                            type="text" 
                            className="w-full p-3 border rounded-xl"
                            placeholder="ឈ្មោះ"
                            value={formData.borrower}
                            onChange={e => setFormData({...formData, borrower: e.target.value})}
                          />
                      </div>
                      <datalist id="familyList">
                          {familyMembers.map(f => <option key={f._id} value={f.name} />)}
                      </datalist>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                      <h3 className="font-semibold text-gray-600 flex items-center gap-2">
                          <Coins size={16} /> ទឹកប្រាក់កម្ចី (Loan Amount)
                      </h3>
                      <div>
                          <label className="text-xs text-gray-500">ចំនួន (RIEL)</label>
                          <input type="number" step="100" className="w-full p-2 border rounded-lg" value={formData.amountRiel} onChange={e => setFormData({...formData, amountRiel: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500">ចំនួន (USD)</label>
                          <input type="number" step="0.01" className="w-full p-2 border rounded-lg" value={formData.amountDollar} onChange={e => setFormData({...formData, amountDollar: parseFloat(e.target.value)})} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">អត្រាការប្រាក់ (%)</label>
                          <input type="number" step="0.01" className="w-full p-3 border rounded-xl" placeholder="0" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: parseFloat(e.target.value)})} />
                          <p className="text-[10px] text-gray-400 mt-1">គិតជា % ក្នុងមួយខែ</p>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">រយៈពេល (ខែ)</label>
                          <input type="number" className="w-full p-3 border rounded-xl" placeholder="0" value={formData.paymentMonths} onChange={e => setFormData({...formData, paymentMonths: parseFloat(e.target.value)})} />
                       </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">វិធីសង (Method)</label>
                          <select 
                            className="w-full p-3 border rounded-xl bg-white"
                            value={formData.paymentMethod}
                            onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                          >
                              <option value="មិនកំណត់">មិនកំណត់</option>
                              <option value="ប្រចាំខែ">ប្រចាំខែ (Schedule)</option>
                          </select>
                       </div>
                  </div>

                  {formData.paymentMethod === 'ប្រចាំខែ' && (
                     <div className="p-4 bg-blue-50 rounded-xl space-y-3 border border-blue-100">
                        <h3 className="font-semibold text-blue-700 text-sm">បង់មុន (Down Payment)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500">RIEL</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={formData.downRiel} onChange={e => setFormData({...formData, downRiel: parseFloat(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">USD</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={formData.downDollar} onChange={e => setFormData({...formData, downDollar: parseFloat(e.target.value)})} />
                            </div>
                        </div>
                     </div>
                  )}

                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md">
                      បង្កើតកម្ចី
                  </button>
              </form>
          </div>
      );
  }

  if (view === 'DETAIL' && selectedLending) {
      return (
          <div className="pb-24 md:pb-6 max-w-4xl mx-auto">
              <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-bold truncate max-w-[200px]">{selectedLending.title}</h2>
                 </div>
                 <button onClick={() => handleDelete(selectedLending._id)} className="text-red-400 p-2">
                     <Trash2 size={20} />
                 </button>
              </div>

              <div className="p-4 space-y-4 bg-white rounded-b-2xl shadow-sm">
                  {/* Summary Card */}
                  <div className="bg-white text-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                              <p className="text-xs text-gray-500">អ្នកឱ្យខ្ចី (Lender)</p>
                              <p className="font-semibold text-gray-900">{selectedLending.lender || '-'}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-gray-500">អ្នកខ្ចី (Borrower)</p>
                              <p className="font-semibold text-gray-900">{selectedLending.borrower || '-'}</p>
                          </div>
                      </div>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-xs text-gray-500 mb-1">
                                  {selectedLending.paymentMethod === 'មិនកំណត់' ? 'នៅសល់ (Remaining)' : 'ទឹកប្រាក់ដើម (Principal)'}
                              </p>
                              <span className="text-2xl font-bold text-gray-900">
                                  {selectedLending.paymentMethod === 'មិនកំណត់' 
                                    ? getRemainingBalance(selectedLending)
                                    : getDisplayTotal(selectedLending.amountRiel, selectedLending.amountDollar)
                                  }
                              </span>
                          </div>
                          <div className="text-right">
                               <p className="text-xs text-gray-500">ការប្រាក់</p>
                               <p className="font-bold text-gray-900">{selectedLending.interestRate}%</p>
                          </div>
                      </div>
                  </div>
                  
                  {/* Manual Repayment Button for 'No Schedule' */}
                  {selectedLending.paymentMethod === 'មិនកំណត់' && !showRepayModal && (
                      <button 
                        onClick={() => setShowRepayModal(true)}
                        className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors border border-indigo-100"
                      >
                          <Wallet size={18} />
                          កត់ត្រាការសង (Record Repayment)
                      </button>
                  )}

                  {/* Manual Repayment Form */}
                  {showRepayModal && (
                      <form onSubmit={handleManualRepay} className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in">
                          <h3 className="font-bold text-gray-800 mb-3 text-sm">បញ្ចូលទឹកប្រាក់ដែលសង</h3>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-xs text-gray-500">RIEL</label>
                                    <input type="number" className="w-full p-2 border rounded-lg text-sm" value={repayRiel} onChange={e => setRepayRiel(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">USD</label>
                                    <input type="number" className="w-full p-2 border rounded-lg text-sm" value={repayDollar} onChange={e => setRepayDollar(e.target.value)} />
                                </div>
                          </div>
                          <div className="flex gap-2">
                              <button type="button" onClick={() => setShowRepayModal(false)} className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
                              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Save</button>
                          </div>
                      </form>
                  )}

                  {/* Schedule/History List */}
                  <div>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Calendar size={18} className="text-indigo-600" />
                          {selectedLending.paymentMethod === 'ប្រចាំខែ' ? 'តារាងបង់ប្រាក់ (Schedule)' : 'ប្រវត្តិសង (History)'}
                      </h3>
                      {transactions.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed">
                              មិនមានទិន្នន័យទេ
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {transactions.map(tx => (
                                  <div key={tx._id} className={`bg-white p-4 rounded-xl border transition-all ${tx.isPaid ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                                  {selectedLending.paymentMethod === 'ប្រចាំខែ' ? `ខែទី ${tx.month}` : 'Repayment'}
                                              </span>
                                              <p className="text-xs text-gray-500 mt-1">Date: {new Date(tx.dueDate).toLocaleDateString('km-KH')}</p>
                                          </div>
                                          {selectedLending.paymentMethod === 'ប្រចាំខែ' ? (
                                              <button onClick={() => toggleTransactionPaid(tx)}>
                                                {tx.isPaid ? (
                                                    <CheckCircle className="text-green-500 w-6 h-6" />
                                                ) : (
                                                    <Circle className="text-gray-300 w-6 h-6 hover:text-indigo-500" />
                                                )}
                                            </button>
                                          ) : (
                                              <CheckCircle className="text-green-500 w-6 h-6" />
                                          )}
                                      </div>
                                      
                                      <div className="flex justify-between items-end">
                                          <div className="text-sm">
                                              <p className="text-gray-500 text-xs">ទឹកប្រាក់ (Amount)</p>
                                              <div className="font-bold text-gray-800 text-lg">
                                                  {getDisplayTotal(tx.amountRiel, tx.amountDollar)}
                                              </div>
                                          </div>
                                          {selectedLending.paymentMethod === 'ប្រចាំខែ' && (
                                              <div className="text-right text-xs text-gray-400">
                                                  Interest: {getDisplayTotal(tx.interestRiel, tx.interestDollar)}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // LIST VIEW
  return (
    <div className="pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-xl font-bold text-gray-800">បញ្ជីកម្ចី (Lending)</h2>
        <button 
            onClick={() => setView('FORM')}
            className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className={lendings.length > 0 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : ""}>
          {lendings.length === 0 ? (
              <div className="text-center py-12 text-gray-400 col-span-full">
                  <Coins size={48} className="mx-auto mb-3 opacity-20" />
                  <p>មិនទាន់មានទិន្នន័យកម្ចីនៅឡើយ</p>
              </div>
          ) : (
              lendings.map(l => (
                  <div 
                    key={l._id} 
                    onClick={() => handleViewDetail(l)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md"
                  >
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-800 line-clamp-1">{l.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.isComplete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {l.isComplete ? 'Completed' : 'Active'}
                          </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <User size={12} />
                          <span>{l.lender || '?'}</span>
                          <span>→</span>
                          <span>{l.borrower || '?'}</span>
                      </div>

                      <div className="flex justify-between items-end border-t border-gray-50 pt-2">
                          <div>
                              <div className={`font-bold ${preferredCurrency === 'KHR' ? 'text-blue-600' : 'text-indigo-600'}`}>
                                  {getDisplayTotal(l.amountRiel, l.amountDollar)}
                              </div>
                          </div>
                          <div className="text-xs text-gray-400">
                              {l.paymentMethod === 'ប្រចាំខែ' ? `${l.paymentMonths} ខែ` : 'No Schedule'}
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default LendingManager;
