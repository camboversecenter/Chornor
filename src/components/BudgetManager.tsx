// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState, useEffect } from 'react';
import { Budget, Category, Transaction, Currency } from '../types';
import * as storage from '../services/storageService';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import { showConfirm, showAlert } from '../services/alertService';
import { Plus, ArrowLeft, Trash2, Target, PieChart, AlertTriangle, Pencil, Wallet, CheckCircle2 } from 'lucide-react';

interface BudgetManagerProps {
  categories: Category[];
  transactions: Transaction[];
  preferredCurrency?: Currency;
}

// Progress colors: safe (< 80%), warning (80-99%), over (>= 100%).
const barColor = (pct: number) => (pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500');
const textColor = (pct: number) => (pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-indigo-600');

const BudgetManager: React.FC<BudgetManagerProps> = ({ categories, transactions, preferredCurrency = 'KHR' }) => {
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState<Currency>(preferredCurrency);

  useEffect(() => {
    setBudgets(storage.getBudgets());
    const unsubscribe = storage.subscribeToDataChanges(() => {
      setBudgets([...storage.getBudgets()]);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
    // `transactions` is included so spend recomputes when a transaction changes.
  }, [transactions]);

  // Only expense categories can carry a budget (income categories are excluded).
  const expenseCategories = categories.filter(c => c.chomnay);

  const fmt = (n: number, currency: Currency) => {
    if (currency === 'USD') {
      return `${CURRENCY_USD}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
    }
    return `${new Intl.NumberFormat('km-KH').format(Math.round(n))}${CURRENCY_KHR}`;
  };

  const toPreferred = (amount: number, from: Currency) => {
    if (preferredCurrency === from) return amount;
    return preferredCurrency === 'USD' ? amount / EXCHANGE_RATE : amount * EXCHANGE_RATE;
  };

  const rows = budgets.map(b => {
    const spent = storage.getMonthlyCategorySpend(b.categoryId, b.currency);
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const category = categories.find(c => c._id === b.categoryId);
    return { budget: b, spent, pct, remaining: b.amount - spent, category };
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + toPreferred(b.amount, b.currency), 0);
  const totalSpent = rows.reduce((sum, r) => sum + toPreferred(r.spent, r.budget.currency), 0);
  const totalPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const openCreate = () => {
    setEditingId(null);
    setFormCategoryId('');
    setFormAmount('');
    setFormCurrency(preferredCurrency);
    setView('FORM');
  };

  const openEdit = (b: Budget) => {
    setEditingId(b._id);
    setFormCategoryId(b.categoryId);
    setFormAmount(String(b.amount));
    setFormCurrency(b.currency);
    setView('FORM');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!formCategoryId || !amount || amount <= 0) {
      await showAlert('ព័ត៌មានមិនគ្រប់គ្រាន់ (Missing Info)', 'សូមជ្រើសរើសប្រភេទ និងបញ្ចូលចំនួនត្រឹមត្រូវ។ (Pick a category and enter a valid amount)', 'warning');
      return;
    }

    // One budget per category. Block duplicates when creating or re-pointing.
    const duplicate = budgets.find(b => b.categoryId === formCategoryId && b._id !== editingId);
    if (duplicate) {
      await showAlert('មានថវិការួចហើយ (Budget Exists)', 'ប្រភេទនេះមានថវិការួចហើយ។ (This category already has a budget)', 'warning');
      return;
    }

    const record: Budget = {
      _id: editingId || Date.now().toString(),
      categoryId: formCategoryId,
      amount,
      currency: formCurrency,
      createdAt: editingId ? (budgets.find(b => b._id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    await storage.saveBudget(record);
    setBudgets([...storage.getBudgets()]);
    setView('LIST');
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm('លុបថវិកា? (Delete Budget?)', 'តើអ្នកប្រាកដថាចង់លុបថវិកានេះមែនទេ? (Are you sure?)');
    if (confirmed) {
      await storage.deleteBudget(id);
      setBudgets([...storage.getBudgets()]);
    }
  };

  // --- FORM VIEW ---
  if (view === 'FORM') {
    // Categories available to pick: expense categories without a budget (plus the one being edited).
    const takenIds = new Set(budgets.filter(b => b._id !== editingId).map(b => b.categoryId));
    const available = expenseCategories.filter(c => !takenIds.has(c._id));

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm pb-24 md:pb-6 max-w-2xl mx-auto border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView('LIST')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">{editingId ? 'កែថវិកា (Edit Budget)' : 'បង្កើតថវិកា (New Budget)'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ប្រភេទចំណាយ (Expense Category)</label>
            <select
              required
              className="w-full p-3 border rounded-xl bg-white"
              value={formCategoryId}
              onChange={e => setFormCategoryId(e.target.value)}
              disabled={!!editingId}
            >
              <option value="">-- ជ្រើសរើស (Select) --</option>
              {available.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {!editingId && available.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                គ្រប់ប្រភេទចំណាយមានថវិការួចហើយ។ (Every expense category already has a budget)
              </p>
            )}
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl space-y-3 border border-indigo-100">
            <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
              <Target size={16} /> កំណត់ថវិកាប្រចាំខែ (Monthly Limit)
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormCurrency('KHR')}
                className={`flex-1 p-2 rounded-lg border text-sm font-bold ${formCurrency === 'KHR' ? 'border-indigo-500 bg-white text-indigo-700' : 'border-gray-200 text-gray-500'}`}
              >
                {CURRENCY_KHR} Riel
              </button>
              <button
                type="button"
                onClick={() => setFormCurrency('USD')}
                className={`flex-1 p-2 rounded-lg border text-sm font-bold ${formCurrency === 'USD' ? 'border-indigo-500 bg-white text-indigo-700' : 'border-gray-200 text-gray-500'}`}
              >
                {CURRENCY_USD} USD
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500">ចំនួន ({formCurrency})</label>
              <input
                type="number"
                step={formCurrency === 'USD' ? '0.01' : '1000'}
                min="0"
                className="w-full p-3 border rounded-lg text-lg font-bold"
                placeholder={formCurrency === 'USD' ? '300.00' : '500000'}
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!editingId && available.length === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {editingId ? 'រក្សាទុក (Save)' : 'បង្កើត (Create)'}
          </button>
        </form>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-xl font-bold text-gray-800">ថវិកា (Budgets)</h2>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <PieChart size={48} className="mx-auto mb-3 opacity-20" />
          <p>មិនទាន់មានថវិកានៅឡើយ</p>
          <p className="text-xs mt-1">Set a monthly spending limit for a category to start tracking.</p>
        </div>
      ) : (
        <>
          {/* Summary card for the current month */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Wallet size={16} className="text-indigo-600" />
                <span>ខែនេះ ({monthLabel})</span>
              </div>
              <span className={`text-sm font-bold ${textColor(totalPct)}`}>{totalPct.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">ចំណាយ (Spent)</p>
                <span className={`text-2xl font-bold ${textColor(totalPct)}`}>{fmt(totalSpent, preferredCurrency)}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">ថវិកាសរុប (Total Budget)</p>
                <span className="font-semibold text-gray-700">{fmt(totalBudgeted, preferredCurrency)}</span>
              </div>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${barColor(totalPct)}`} style={{ width: `${Math.min(100, totalPct)}%` }} />
            </div>
          </div>

          {/* Per-category budgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map(({ budget: b, spent, pct, remaining, category }) => {
              const over = pct >= 100;
              return (
                <div key={b._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category?.color || '#9CA3AF' }} />
                      <h3 className="font-bold text-gray-800 line-clamp-1">{category?.name || 'Unknown'}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(b)} className="text-gray-300 hover:text-indigo-500 p-1"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(b._id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline mb-2">
                    <span className={`text-lg font-bold ${textColor(pct)}`}>{fmt(spent, b.currency)}</span>
                    <span className="text-xs text-gray-400">/ {fmt(b.amount, b.currency)}</span>
                  </div>

                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className={`absolute top-0 left-0 h-full ${barColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium ${textColor(pct)}`}>{pct.toFixed(0)}%</span>
                    {over ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                        <AlertTriangle size={12} /> លើស {fmt(Math.abs(remaining), b.currency)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <CheckCircle2 size={12} className="text-green-500" /> នៅសល់ {fmt(remaining, b.currency)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetManager;
