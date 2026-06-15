
import React, { useState, useMemo } from 'react';
import { Transaction, Category, Family, Currency } from '../types';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Filter, Calendar, Users, Tag, ChevronDown, ChevronUp, PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';

interface TransactionAnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  familyMembers: Family[];
  preferredCurrency: Currency;
}

type TimeRange = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'ALL';
type ChartType = 'TREND' | 'CATEGORY' | 'FAMILY';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
    THIS_MONTH: 'ខែនេះ (This Month)',
    LAST_MONTH: 'ខែមុន (Last Month)',
    LAST_3_MONTHS: '៣ខែចុងក្រោយ (3 Months)',
    THIS_YEAR: 'ឆ្នាំនេះ (This Year)',
    ALL: 'ទាំងអស់ (All Time)'
};

const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({ 
  transactions, categories, familyMembers, preferredCurrency 
}) => {
  // --- State ---
  const [timeRange, setTimeRange] = useState<TimeRange>('THIS_MONTH');
  const [chartType, setChartType] = useState<ChartType>('TREND');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // --- Helpers ---
  const getNormalizedAmount = (amount: number, txCurrency: Currency) => {
    if (txCurrency === preferredCurrency) return amount;
    if (preferredCurrency === 'USD') return amount / EXCHANGE_RATE;
    return amount * EXCHANGE_RATE;
  };

  const formatAmount = (val: number) => {
    if (preferredCurrency === 'KHR') {
        return `${new Intl.NumberFormat('km-KH', { maximumFractionDigits: 0 }).format(val)}${CURRENCY_KHR}`;
    }
    return `${CURRENCY_USD}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
  };

  const getCategory = (id: string) => categories.find(c => c._id === id);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Epoch
    let endDate = new Date();

    // 1. Date Filter
    if (timeRange === 'THIS_MONTH') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'LAST_MONTH') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (timeRange === 'LAST_3_MONTHS') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (timeRange === 'THIS_YEAR') {
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    return transactions.filter(t => {
        const tDate = new Date(t.date);
        const matchDate = tDate >= startDate && tDate <= endDate;
        const matchFamily = selectedFamilyId === 'ALL' || t.familyId === selectedFamilyId;
        const matchCategory = selectedCategoryId === 'ALL' || t.categoryId === selectedCategoryId;
        return matchDate && matchFamily && matchCategory;
    });
  }, [transactions, timeRange, selectedFamilyId, selectedCategoryId]);

  // --- Aggregation Logic ---

  // 1. Key Metrics
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredData.forEach(t => {
        const val = getNormalizedAmount(t.amount, t.currency);
        const cat = getCategory(t.categoryId);
        if (cat?.chomnay) expense += val;
        else income += val;
    });
    return { income, expense, net: income - expense };
  }, [filteredData, preferredCurrency]);

  // 2. Trend Data (By Day or Month)
  const trendData = useMemo(() => {
      // If range is large (Year), group by Month. Else group by Day.
      const groupByMonth = timeRange === 'THIS_YEAR' || timeRange === 'ALL';
      const map = new Map<string, { name: string, income: number, expense: number, dateObj: Date }>();

      filteredData.forEach(t => {
          const date = new Date(t.date);
          let key = '';
          let name = '';

          if (groupByMonth) {
              key = `${date.getFullYear()}-${date.getMonth()}`;
              name = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          } else {
              key = t.date; // YYYY-MM-DD
              name = date.toLocaleDateString('km-KH', { day: 'numeric', month: 'short' });
          }

          if (!map.has(key)) {
              map.set(key, { name, income: 0, expense: 0, dateObj: date });
          }

          const entry = map.get(key)!;
          const val = getNormalizedAmount(t.amount, t.currency);
          const cat = getCategory(t.categoryId);
          
          if (cat?.chomnay) entry.expense += val;
          else entry.income += val;
      });

      return Array.from(map.values()).sort((a,b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [filteredData, preferredCurrency, timeRange]);

  // 3. Category Data (Expense Only)
  const categoryData = useMemo(() => {
      const map = new Map<string, { name: string, value: number, color: string }>();
      
      filteredData.forEach(t => {
          const cat = getCategory(t.categoryId);
          if (cat && cat.chomnay) { // Only expenses
              if (!map.has(cat._id)) {
                  map.set(cat._id, { name: cat.name, value: 0, color: cat.color });
              }
              const val = getNormalizedAmount(t.amount, t.currency);
              const entry = map.get(cat._id)!;
              entry.value += val;
          }
      });

      return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [filteredData, preferredCurrency]);

  // 4. Family Data
  const familyData = useMemo(() => {
      const map = new Map<string, { name: string, expense: number }>();
      // Initialize with all members to show 0 spenders
      familyMembers.forEach(f => {
          map.set(f._id, { name: f.name, expense: 0 });
      });
      // Add 'Me' or 'Unassigned'
      map.set('undefined', { name: 'Me (Unassigned)', expense: 0 });

      filteredData.forEach(t => {
          const cat = getCategory(t.categoryId);
          if (cat && cat.chomnay) {
              const key = t.familyId || 'undefined';
              if (!map.has(key)) { // Fallback if ID not in list
                  map.set(key, { name: 'Unknown', expense: 0 }); 
              }
              const val = getNormalizedAmount(t.amount, t.currency);
              map.get(key)!.expense += val;
          }
      });

      return Array.from(map.values()).filter(d => d.expense > 0).sort((a,b) => b.expense - a.expense);
  }, [filteredData, preferredCurrency, familyMembers]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      
      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" />
                  វិភាគទិន្នន័យ (Analytics)
              </h2>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
              >
                  <Filter size={14} /> ចម្រោះ (Filters) {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
          </div>

          {/* Time Range Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide mb-4 gap-1">
              {['THIS_MONTH', 'LAST_MONTH', 'LAST_3_MONTHS', 'THIS_YEAR'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as TimeRange)}
                    className={`flex-none px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${timeRange === range ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:bg-gray-200'}`}
                  >
                      {TIME_RANGE_LABELS[range as TimeRange]}
                  </button>
              ))}
          </div>

          {/* Detailed Filters */}
          {showFilters && (
              <div className="grid grid-cols-2 gap-3 mb-4 animate-in slide-in-from-top-2">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">ប្រភេទ (Category)</label>
                      <div className="relative">
                        <select 
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full p-2 pl-7 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none"
                        >
                            <option value="ALL">គ្រប់ប្រភេទ (All Categories)</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <Tag className="absolute left-2 top-2.5 text-gray-400 w-3 h-3" />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">សមាជិក (Family)</label>
                      <div className="relative">
                        <select 
                            value={selectedFamilyId}
                            onChange={(e) => setSelectedFamilyId(e.target.value)}
                            className="w-full p-2 pl-7 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none"
                        >
                            <option value="ALL">គ្រប់សមាជិក (All Members)</option>
                            {familyMembers.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                        </select>
                        <Users className="absolute left-2 top-2.5 text-gray-400 w-3 h-3" />
                      </div>
                  </div>
              </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-[10px] text-green-600 font-medium">ចំណូល (Income)</p>
                  <p className="text-sm font-bold text-green-700 truncate">{formatAmount(summary.income)}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-[10px] text-red-600 font-medium">ចំណាយ (Expense)</p>
                  <p className="text-sm font-bold text-red-700 truncate">{formatAmount(summary.expense)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-medium">សល់ (Net)</p>
                  <p className={`text-sm font-bold truncate ${summary.net >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                      {formatAmount(summary.net)}
                  </p>
              </div>
          </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex justify-center gap-4">
          <button 
            onClick={() => setChartType('TREND')}
            className={`flex flex-col items-center gap-1 ${chartType === 'TREND' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
              <div className={`p-3 rounded-full ${chartType === 'TREND' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <BarChart3 size={20} />
              </div>
              <span className="text-[10px] font-medium">និន្នាការ (Trends)</span>
          </button>
          <button 
            onClick={() => setChartType('CATEGORY')}
            className={`flex flex-col items-center gap-1 ${chartType === 'CATEGORY' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
              <div className={`p-3 rounded-full ${chartType === 'CATEGORY' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <PieIcon size={20} />
              </div>
              <span className="text-[10px] font-medium">ប្រភេទ (Categories)</span>
          </button>
          <button 
            onClick={() => setChartType('FAMILY')}
            className={`flex flex-col items-center gap-1 ${chartType === 'FAMILY' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
              <div className={`p-3 rounded-full ${chartType === 'FAMILY' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Users size={20} />
              </div>
              <span className="text-[10px] font-medium">គ្រួសារ (Family)</span>
          </button>
      </div>

      {/* Chart Display */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
          {filteredData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                  គ្មានទិន្នន័យសម្រាប់រយៈពេលនេះទេ
              </div>
          ) : (
             <>
                {chartType === 'TREND' && (
                    <div className="h-64 w-full">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">ចំណូល vs ចំណាយ (Income vs Expense)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                                <Tooltip 
                                    formatter={(value: number) => formatAmount(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                                <Area type="monotone" dataKey="income" name="ចំណូល (Income)" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" name="ចំណាយ (Expense)" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {chartType === 'CATEGORY' && (
                    <div className="h-72 w-full">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 text-center">ចំណាយតាមប្រភេទ (Expense by Category)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatAmount(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {chartType === 'FAMILY' && (
                    <div className="h-64 w-full">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">ចំណាយតាមសមាជិក (Expense by Family)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={familyData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" fontSize={10} hide />
                                <YAxis dataKey="name" type="category" width={100} fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    formatter={(value: number) => formatAmount(value)}
                                    cursor={{fill: '#F3F4F6'}}
                                />
                                <Bar dataKey="expense" name="ចំណាយ" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                    {familyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366F1' : '#818CF8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
             </>
          )}
      </div>

      {/* Pro Tips / Insights */}
      {filteredData.length > 0 && chartType === 'TREND' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
              <div className="bg-white p-2 rounded-full h-fit text-indigo-600 shadow-sm">
                  <TrendingUp size={18} />
              </div>
              <div>
                  <h4 className="font-bold text-indigo-900 text-sm">ការវិភាគខ្លីៗ (Insights)</h4>
                  <p className="text-xs text-indigo-700 mt-1">
                      ចំណាយមធ្យមប្រចាំថ្ងៃ (Avg Daily): <span className="font-bold">{formatAmount(summary.expense / (trendData.length || 1))}</span>
                  </p>
                  <p className="text-xs text-indigo-700">
                      ចំណាយច្រើនជាងគេលើ (Highest): <span className="font-bold">{categoryData[0]?.name || 'គ្មាន (None)'}</span>
                  </p>
              </div>
          </div>
      )}

    </div>
  );
};

export default TransactionAnalytics;
