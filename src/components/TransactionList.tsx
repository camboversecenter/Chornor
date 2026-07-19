// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, Family, Currency } from '../types';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import { showConfirm } from '../services/alertService';
import { Trash2, Repeat, Users, X, Calendar, Tag, FileText, ShoppingBag, Search, Filter, ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle, ArrowUpDown, BarChart2, List, Edit2 } from 'lucide-react';
import TransactionAnalytics from './TransactionAnalytics';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  familyMembers: Family[];
  preferredCurrency: Currency;
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

const ITEMS_PER_PAGE = 20;

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, familyMembers, preferredCurrency, onDelete, onEdit }) => {
  // View State: 'LIST' or 'ANALYTICS'
  const [viewMode, setViewMode] = useState<'LIST' | 'ANALYTICS'>('LIST');

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  // Filter & Search States (For List View)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [sortBy, setSortBy] = useState<'CREATED' | 'DATE'>('CREATED'); 
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);

  const getCategory = (id: string) => categories.find(c => c._id === id);
  const getFamily = (id?: string) => id ? familyMembers.find(f => f._id === id) : null;

  const formatRawAmount = (amount: number, currency: 'USD' | 'KHR') => {
      if (currency === 'KHR') {
          return `${new Intl.NumberFormat('km-KH').format(amount)}${CURRENCY_KHR}`;
      }
      return `${CURRENCY_USD}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount)}`;
  };

  const getDisplayDetails = (amount: number, txCurrency: 'USD' | 'KHR') => {
      let displayAmount = amount;
      let displayCurrency = txCurrency;
      let isConverted = false;

      if (preferredCurrency !== txCurrency) {
          isConverted = true;
          displayCurrency = preferredCurrency;
          if (preferredCurrency === 'KHR') {
              displayAmount = amount * EXCHANGE_RATE;
          } else {
              displayAmount = amount / EXCHANGE_RATE;
          }
      }

      return {
          mainText: formatRawAmount(displayAmount, displayCurrency),
          subText: isConverted ? formatRawAmount(amount, txCurrency) : null
      };
  };

  // 1. Filter and Sort Data
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const cat = getCategory(t.categoryId);
        const isExpense = cat ? cat.chomnay : true;

        if (filterType === 'INCOME' && isExpense) return false;
        if (filterType === 'EXPENSE' && !isExpense) return false;

        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          const matchDesc = t.description?.toLowerCase().includes(lowerTerm);
          const matchCat = cat?.name.toLowerCase().includes(lowerTerm);
          const matchAmount = t.amount.toString().includes(lowerTerm);
          const matchDate = t.date.includes(lowerTerm);
          
          return matchDesc || matchCat || matchAmount || matchDate;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'CREATED') {
            const dateA = new Date(a.createdAt || a.date).getTime();
            const dateB = new Date(b.createdAt || b.date).getTime();
            return dateB - dateA;
        } else {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [transactions, searchTerm, filterType, categories, sortBy]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedData = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="pb-24">
      {/* Header Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
             <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-800">
                    {viewMode === 'LIST' ? 'ប្រវត្តិ (History)' : 'វិភាគ (Analytics)'}
                </h2>
                {viewMode === 'LIST' && (
                    <span className="text-xs text-gray-500">
                        {filteredTransactions.length} Items
                    </span>
                )}
             </div>
             
             {/* View Toggle */}
             <div className="flex bg-gray-100 p-1 rounded-lg">
                 <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}
                 >
                     <List size={20} />
                 </button>
                 <button 
                    onClick={() => setViewMode('ANALYTICS')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'ANALYTICS' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}
                 >
                     <BarChart2 size={20} />
                 </button>
             </div>
        </div>

        {/* LIST VIEW FILTERS */}
        {viewMode === 'LIST' && (
            <>
                {/* Search Bar */}
                <div className="relative mb-3">
                    <input 
                        type="text" 
                        placeholder="ស្វែងរក... (Search description, category, amount)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Filter Tabs & Sort */}
                <div className="space-y-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setFilterType('ALL')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'ALL' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            ទាំងអស់ (All)
                        </button>
                        <button 
                            onClick={() => setFilterType('INCOME')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${filterType === 'INCOME' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ArrowUpCircle size={12} /> ចំណូល (Income)
                        </button>
                        <button 
                            onClick={() => setFilterType('EXPENSE')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${filterType === 'EXPENSE' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ArrowDownCircle size={12} /> ចំណាយ (Expense)
                        </button>
                    </div>
                    
                    {/* Sorting Toggle */}
                    <div className="flex justify-end">
                        <div className="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            <ArrowUpDown size={12} className="text-gray-400" />
                            <span className="text-gray-500">Sort by:</span>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'CREATED' | 'DATE')}
                                className="bg-transparent font-medium text-gray-700 outline-none"
                            >
                                <option value="CREATED">កាលបរិច្ឆេទបង្កើត (Created)</option>
                                <option value="DATE">កាលបរិច្ឆេទប្រតិបត្តិការ (Date)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>

      {/* VIEW CONTENT Switcher */}
      {viewMode === 'ANALYTICS' ? (
          <TransactionAnalytics 
            transactions={transactions} 
            categories={categories} 
            familyMembers={familyMembers}
            preferredCurrency={preferredCurrency}
          />
      ) : (
          /* List Content */
          <>
            {paginatedData.length === 0 ? (
                <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <Filter size={24} />
                    </div>
                    <p>មិនមានទិន្នន័យ (No Data)</p>
                    {searchTerm && <p className="text-xs mt-1">Try clearing your search</p>}
                </div>
            ) : (
                <div className="space-y-3">
                {paginatedData.map((t) => {
                    const cat = getCategory(t.categoryId);
                    const familyMember = getFamily(t.familyId);
                    const isExpense = cat ? cat.chomnay : true;
                    const currency = t.currency || 'USD'; 

                    const { mainText, subText } = getDisplayDetails(t.amount, currency);

                    return (
                    <div 
                        key={t._id} 
                        onClick={() => setSelectedTx(t)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                        <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                            style={{ backgroundColor: cat?.color || '#9CA3AF' }}
                        >
                            {(cat?.name || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate flex items-center gap-1">
                                {t.description || cat?.name || 'No Description'}
                                {t.reminder && t.reminder !== 'NONE' && (
                                    <Repeat size={12} className="text-indigo-400 shrink-0" />
                                )}
                                {t.items && t.items.length > 0 && (
                                    <ShoppingBag size={12} className="text-gray-400 shrink-0" />
                                )}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs text-gray-500">
                                {new Date(t.date).toLocaleDateString('km-KH')} • {cat?.name || 'Uncategorized'}
                                </p>
                                {familyMember && (
                                    <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                        <Users size={10} />
                                        {familyMember.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        </div>
                        
                        <div className="flex flex-col items-end shrink-0">
                        <span className={`font-bold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                            {isExpense ? '-' : '+'}{mainText}
                        </span>
                        {subText && (
                            <span className="text-[10px] text-gray-400">
                                ({subText})
                            </span>
                        )}
                        </div>
                    </div>
                    );
                })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
          </>
      )}

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedTx(null)}>
            <div 
                className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={() => setSelectedTx(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3 shadow-md"
                        style={{ backgroundColor: getCategory(selectedTx.categoryId)?.color || '#9CA3AF' }}
                    >
                        {(getCategory(selectedTx.categoryId)?.name || '?').charAt(0)}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                        {getCategory(selectedTx.categoryId)?.chomnay ? 'ចំណាយ (Expense)' : 'ចំណូល (Income)'}
                    </p>
                    
                    {(() => {
                        const { mainText, subText } = getDisplayDetails(selectedTx.amount, selectedTx.currency || 'USD');
                        return (
                            <div className="flex flex-col items-center">
                                <h3 className={`text-3xl font-bold mt-1 ${getCategory(selectedTx.categoryId)?.chomnay ? 'text-red-500' : 'text-green-500'}`}>
                                    {getCategory(selectedTx.categoryId)?.chomnay ? '-' : '+'}{mainText}
                                </h3>
                                {subText && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        Original: {subText}
                                    </p>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-start gap-3">
                        <FileText className="text-gray-400 w-5 h-5 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-400">បរិយាយ (Description)</p>
                            <p className="font-medium text-gray-800 leading-snug">{selectedTx.description || 'No Description'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar className="text-gray-400 w-5 h-5" />
                        <div>
                            <p className="text-xs text-gray-400">កាលបរិច្ឆេទ (Transaction Date)</p>
                            <p className="font-medium text-gray-800">
                                {new Date(selectedTx.date).toLocaleDateString('km-KH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Tag className="text-gray-400 w-5 h-5" />
                        <div>
                            <p className="text-xs text-gray-400">ប្រភេទ (Category)</p>
                            <p className="font-medium text-gray-800">
                                {getCategory(selectedTx.categoryId)?.name || 'Uncategorized'}
                            </p>
                        </div>
                    </div>

                    {selectedTx.familyId && (
                        <div className="flex items-center gap-3">
                            <Users className="text-gray-400 w-5 h-5" />
                            <div>
                                <p className="text-xs text-gray-400">សមាជិក (Family)</p>
                                <p className="font-medium text-indigo-600 bg-indigo-50 px-2 rounded-md inline-block">
                                    {getFamily(selectedTx.familyId)?.name}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ITEMS RECEIPT */}
                {selectedTx.items && selectedTx.items.length > 0 && (
                    <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="bg-gray-100 p-3 border-b border-gray-200">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <ShoppingBag size={14} /> មុខទំនិញ (Items)
                            </h4>
                        </div>
                        <div className="p-3">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                                        <th className="text-left pb-2 font-normal">Item</th>
                                        <th className="text-center pb-2 font-normal">Qty</th>
                                        <th className="text-right pb-2 font-normal">Price</th>
                                        <th className="text-right pb-2 font-normal">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700">
                                    {selectedTx.items.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-50 last:border-0">
                                            <td className="py-2 font-medium">{item.name}</td>
                                            <td className="py-2 text-center text-gray-500">{item.quantity}</td>
                                            <td className="py-2 text-right text-gray-500">{item.price}</td>
                                            <td className="py-2 text-right font-semibold">
                                                {(item.quantity * item.price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-center gap-3">
                    <button 
                        onClick={() => {
                            onEdit(selectedTx);
                            setSelectedTx(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 text-indigo-600 font-medium px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                        <Edit2 size={18} />
                        កែប្រែ (Edit)
                    </button>
                    <button 
                        onClick={async () => {
                            const confirmed = await showConfirm(
                                "តើអ្នកចង់លុបមែនទេ?", 
                                "ទិន្នន័យនេះនឹងមិនអាចយកមកវិញបានទេ។ (Irreversible Action)"
                            );
                            if(confirmed) {
                                onDelete(selectedTx._id);
                                setSelectedTx(null);
                            }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 text-red-500 font-medium px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={18} />
                        លុប (Delete)
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
