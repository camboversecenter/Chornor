
import React, { useMemo } from 'react';
import { CryptoAsset, Currency } from '../types';
import { CURRENCY_USD, CURRENCY_KHR, EXCHANGE_RATE } from '../constants';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon } from 'lucide-react';

interface CryptoAnalyticsProps {
  assets: CryptoAsset[];
  preferredCurrency: Currency;
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

const CryptoAnalytics: React.FC<CryptoAnalyticsProps> = ({ assets, preferredCurrency }) => {
  
  // --- Helpers ---
  const getValue = (usdAmount: number) => {
    if (preferredCurrency === 'KHR') return usdAmount * EXCHANGE_RATE;
    return usdAmount;
  };

  const formatMoney = (val: number) => {
    if (preferredCurrency === 'KHR') {
        return `${new Intl.NumberFormat('km-KH', { maximumFractionDigits: 0 }).format(val)}${CURRENCY_KHR}`;
    }
    return `${CURRENCY_USD}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(val)}`;
  };

  // --- Data Preparation ---
  const { allocationData, performanceData, summary } = useMemo(() => {
      let totalCost = 0;
      let totalValue = 0;

      const allocation = assets
          .filter(a => a.quantity > 0)
          .map((a, index) => {
              const val = getValue(a.quantity * a.currentPrice);
              const cost = getValue(a.quantity * a.averageBuyPrice);
              
              totalValue += val;
              totalCost += cost;

              return {
                  name: a.symbol,
                  value: val,
                  color: COLORS[index % COLORS.length]
              };
          })
          .sort((a, b) => b.value - a.value);

      const performance = assets
          .filter(a => a.quantity > 0)
          .map(a => ({
              name: a.symbol,
              Invested: getValue(a.quantity * a.averageBuyPrice),
              Value: getValue(a.quantity * a.currentPrice)
          }))
          .sort((a, b) => b.Value - a.Value);

      return {
          allocationData: allocation,
          performanceData: performance,
          summary: {
              totalCost,
              totalValue,
              pnl: totalValue - totalCost
          }
      };
  }, [assets, preferredCurrency]);

  const pnlPercent = summary.totalCost > 0 ? (summary.pnl / summary.totalCost) * 100 : 0;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <p className="text-xs text-gray-500 mb-1">វិនិយោគសរុប (Total Cost)</p>
                 <p className="text-lg font-bold text-gray-800">{formatMoney(summary.totalCost)}</p>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <p className="text-xs text-gray-500 mb-1">ចំណេញ / ខាត (Profit / Loss)</p>
                 <div className="flex items-center gap-1">
                     <p className={`text-lg font-bold ${summary.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {summary.pnl >= 0 ? '+' : ''}{formatMoney(summary.pnl)}
                     </p>
                     {summary.pnl !== 0 && (
                         <span className={`text-xs px-1.5 py-0.5 rounded-md ${summary.pnl >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {pnlPercent.toFixed(1)}%
                         </span>
                     )}
                 </div>
             </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allocation Chart */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <PieIcon size={18} className="text-indigo-600" />
                    ការបែងចែកទ្រព្យ (Allocation)
                </h3>
                {allocationData.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatMoney(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                        មិនមានទិន្នន័យ (No assets)
                    </div>
                )}
            </div>

            {/* Performance Chart */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-600" />
                    វិនិយោគ vs តម្លៃបច្ចុប្បន្ន (ROI)
                </h3>
                {performanceData.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(val) => preferredCurrency === 'KHR' && val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `${val/1000}k` : val)} 
                                />
                                <Tooltip 
                                    formatter={(value: number) => formatMoney(value)}
                                    cursor={{fill: '#F3F4F6'}}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="Invested" name="ដើមទុន (Cost)" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Value" name="តម្លៃបច្ចុប្បន្ន (Value)" fill="#6366F1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                        មិនមានទិន្នន័យ (No data)
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default CryptoAnalytics;
