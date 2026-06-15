
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Category, Transaction, Currency, UserProfile } from '../types';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import * as storage from '../services/storageService';
import { checkNotifications } from '../services/notificationService';
import { Brain, Wallet, ArrowUpCircle, ArrowDownCircle, AlertCircle, User, Copy } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  categories: Category[];
  transactions: Transaction[];
  preferredCurrency: Currency;
  currentUser?: UserProfile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ categories, transactions, preferredCurrency, currentUser }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Helper to normalize amount to the PREFERRED currency
  const getNormalizedAmount = (amount: number, txCurrency: Currency) => {
    // If transaction currency matches preference, no conversion
    if (txCurrency === preferredCurrency) return amount;
    
    // If preference is USD, convert KHR -> USD
    if (preferredCurrency === 'USD') {
        return amount / EXCHANGE_RATE;
    }
    
    // If preference is KHR, convert USD -> KHR
    return amount * EXCHANGE_RATE;
  };

  const formatAmount = (val: number) => {
    if (preferredCurrency === 'KHR') {
        return `${new Intl.NumberFormat('km-KH').format(val)}${CURRENCY_KHR}`;
    }
    return `${CURRENCY_USD}${val.toFixed(2)}`;
  };

  // Calculate totals in Preferred Currency
  const totalIncome = transactions
    .filter(t => {
      const cat = categories.find(c => c._id === t.categoryId);
      return cat && !cat.chomnay;
    })
    .reduce((acc, curr) => acc + getNormalizedAmount(curr.amount, curr.currency || 'USD'), 0);

  const totalExpense = transactions
    .filter(t => {
      const cat = categories.find(c => c._id === t.categoryId);
      return cat && cat.chomnay;
    })
    .reduce((acc, curr) => acc + getNormalizedAmount(curr.amount, curr.currency || 'USD'), 0);

  const balance = totalIncome - totalExpense;

  // Prepare Chart Data (Income)
  const incomeData = categories
    .filter(c => !c.chomnay)
    .map(c => {
      const value = transactions
        .filter(t => t.categoryId === c._id)
        .reduce((acc, curr) => acc + getNormalizedAmount(curr.amount, curr.currency || 'USD'), 0);
      return { name: c.name, value, color: c.color };
    })
    .filter(d => d.value > 0);

  // Prepare Chart Data (Expenses)
  const expenseData = categories
    .filter(c => c.chomnay)
    .map(c => {
      const value = transactions
        .filter(t => t.categoryId === c._id)
        .reduce((acc, curr) => acc + getNormalizedAmount(curr.amount, curr.currency || 'USD'), 0);
      return { name: c.name, value, color: c.color };
    })
    .filter(d => d.value > 0);

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    
    // Fetch holistic data for better AI context
    const lendings = storage.getLendings();
    const savings = storage.getSavings();
    const crypto = storage.getCryptoAssets();
    const notifications = checkNotifications();

    const result = await getFinancialAdvice(transactions, categories, lendings, savings, crypto, notifications);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in">
      
      {/* Header Card / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-sm font-medium opacity-80 mb-1">សមតុល្យសរុប (Total Balance)</h2>
                        <div className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                            <Wallet className="w-8 h-8 md:w-10 md:h-10" />
                            {formatAmount(balance)}
                        </div>
                        <p className="text-[10px] opacity-60 mt-1">
                            {preferredCurrency === 'USD' ? `គិតជាដុល្លារ` : `គិតជាប្រាក់រៀល`} (1$ = {EXCHANGE_RATE}៛)
                        </p>
                    </div>
                    {currentUser && (
                        <div className="md:hidden flex flex-col items-end">
                            <div className="bg-white/20 p-1 rounded-full backdrop-blur-md mb-1">
                                {currentUser.picture ? (
                                    <img src={currentUser.picture} alt="User" className="w-8 h-8 rounded-full border border-white/50" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-bold">
                                        {currentUser.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Quick Stats on Mobile/Small screens inside the main card */}
            <div className="mt-4 flex gap-4 md:hidden">
                <div className="bg-white/20 rounded-xl p-3 flex-1 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowUpCircle className="w-4 h-4 text-green-300" />
                        <span className="text-xs font-medium opacity-90">ចំណូល (Income)</span>
                    </div>
                    <p className="font-semibold text-lg">{formatAmount(totalIncome)}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-3 flex-1 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowDownCircle className="w-4 h-4 text-red-300" />
                        <span className="text-xs font-medium opacity-90">ចំណាយ (Expense)</span>
                    </div>
                    <p className="font-semibold text-lg">{formatAmount(totalExpense)}</p>
                </div>
            </div>

            {/* Decorative circle */}
            <div className="absolute -right-5 -top-5 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Desktop Income/Expense Cards (Stacked on right) */}
        <div className="hidden md:flex flex-col gap-4">
            <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <ArrowUpCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">ចំណូល (Income)</span>
                </div>
                <p className="font-bold text-2xl text-green-600">{formatAmount(totalIncome)}</p>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                     <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <ArrowDownCircle className="w-5 h-5" />
                     </div>
                    <span className="text-sm font-medium text-gray-500">ចំណាយ (Expense)</span>
                </div>
                <p className="font-bold text-2xl text-red-600">{formatAmount(totalExpense)}</p>
            </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Advice Section - Takes 1 column */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <Brain className="w-6 h-6 text-purple-600" />
                AI ជំនួយការ (AI Insights)
              </h3>
              <button 
                onClick={handleGetAdvice}
                disabled={loadingAdvice}
                className="text-xs bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                {loadingAdvice ? 'កំពុងគិត...' : 'វិភាគទិន្នន័យ (Analyze)'}
              </button>
            </div>
            {advice ? (
               <div className="p-4 bg-purple-50 rounded-xl text-sm text-gray-700 leading-relaxed border border-purple-100 flex-1 overflow-y-auto max-h-80">
                 <ReactMarkdown 
                    components={{
                        strong: ({node, ...props}) => <span className="font-bold text-gray-900" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                    }}
                 >
                    {advice}
                 </ReactMarkdown>
               </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-3 text-sm text-gray-400 italic flex-1 min-h-[200px]">
                 <Brain size={48} className="opacity-20" />
                 <span>ចុចប៊ូតុង "វិភាគទិន្នន័យ" ដើម្បីទទួលបានដំបូន្មាន</span>
                 <span className="text-xs">(Press "Analyze" to get advice)</span>
              </div>
            )}
          </div>

          {/* Charts Section - Takes 2 columns, grid inside */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Income Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">
                    ចំណូលតាមប្រភេទ (Revenue)
                </h3>
                {incomeData.length > 0 ? (
                  <div className="h-64 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {incomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatAmount(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm flex-1">
                    មិនទាន់មានទិន្នន័យចំណូល
                  </div>
                )}
              </div>

              {/* Expense Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">
                    ការចំណាយតាមប្រភេទ (Expenses)
                </h3>
                {expenseData.length > 0 ? (
                  <div className="h-64 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatAmount(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm flex-1">
                    មិនទាន់មានទិន្នន័យចំណាយ
                  </div>
                )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
