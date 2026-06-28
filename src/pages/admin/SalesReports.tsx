import React, { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const SalesReports: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, transRes] = await Promise.all([
          apiFetch<any>('/api/admin/reports/metrics'),
          apiFetch<any[]>('/api/admin/reports/transactions')
        ]);
        
        setMetrics(metricsRes);
        setTransactions(transRes);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !metrics) {
    return <div className="text-[#FF6900] text-center py-20">Loading Dashboard...</div>;
  }

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(2)} Jt`;
    }
    if (val >= 1000) {
      return `Rp ${(val / 1000).toFixed(0)} Rb`;
    }
    return `Rp ${val}`;
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const statusColors: any = {
    'Success': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'Failed': 'text-red-400 bg-red-400/10 border-red-400/20',
    'Pending': 'text-stone-400 bg-stone-400/10 border-stone-400/20'
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Sales Overview</h1>
          <p className="text-stone-400 text-sm">Real-time performance metrics and transaction history.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/20 text-stone-300 rounded text-sm hover:bg-white/5 transition-colors">
            <Calendar size={16} />
            This Month
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#FF6900]/50 text-[#FF6900] rounded text-sm hover:bg-[#FF6900]/10 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[#FF6900]/10 font-bold text-6xl">
            Rp
          </div>
          <p className="text-stone-500 text-xs font-semibold tracking-wider mb-2">TOTAL REVENUE</p>
          <h2 className="text-4xl font-bold text-white mb-4">{formatCurrency(metrics.total_revenue)}</h2>
        </div>

        {/* Card 2 */}
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[#FF6900]/10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M2 9v2h2v2H2v2h20v-2h-2v-2h2V9H2zm2-2h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H2c0-1.1.9-2 2-2V9c0-1.1-.9-2-2-2z"/></svg>
          </div>
          <p className="text-stone-500 text-xs font-semibold tracking-wider mb-2">TICKETS SOLD</p>
          <h2 className="text-4xl font-bold text-white mb-4">{new Intl.NumberFormat('en-US').format(metrics.tickets_sold)}</h2>
        </div>

        {/* Card 3 */}
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-stone-500 text-xs font-semibold tracking-wider mb-2">TOP PERFORMING MOVIE</p>
            <h3 className="text-[#FF6900] text-lg font-bold uppercase tracking-wide leading-tight">{metrics.top_movie}</h3>
            <p className="text-stone-400 text-xs">Top Movie by Sales</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-stone-400 text-xs">Revenue</span>
            <span className="text-white font-bold">{formatCurrency(metrics.top_movie_revenue)}</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#1C1A17] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <h3 className="text-white font-medium">Recent Transactions</h3>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search ID..." 
              className="bg-[#111111] border border-white/10 text-sm text-white rounded pl-9 pr-4 py-1.5 focus:outline-none focus:border-[#FF6900]/50"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-stone-500 text-xs uppercase bg-[#1A1815] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Movie</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((trx, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-300">{trx.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-white">{trx.movie}</p>
                    <p className="text-stone-500 text-xs">{trx.studio_seats}</p>
                  </td>
                  <td className="px-6 py-4 text-stone-400">{trx.datetime}</td>
                  <td className="px-6 py-4 text-stone-300">{formatIDR(trx.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded text-xs border ${statusColors[trx.status] || statusColors['Pending']}`}>
                      <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-current"></span>
                      {trx.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                    No recent transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-white/5 flex justify-between items-center text-sm text-stone-400">
          <div>
            Showing {transactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} entries
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-[#1A1815] border border-white/10 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(transactions.length / itemsPerPage)}
              className="px-3 py-1 bg-[#1A1815] border border-white/10 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
