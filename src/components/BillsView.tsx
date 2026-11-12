import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, FileText, 
  ArrowUpDown, Download, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { ispDb } from '../utils/analytics';
import { Bill } from '../types/isp';
import { formatBDT, getStatusBadgeClass } from '../utils/formatters';

interface BillsViewProps {
  onSelectCustomer: (customerId: number) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({ onSelectCustomer }) => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [sortField, setSortField] = useState<'bill_id' | 'billing_month' | 'due_date' | 'total_amount_bdt'>('bill_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const customerMap = useMemo(() => {
    return new Map(ispDb.customers.map(c => [c.customer_id, c]));
  }, []);

  const allMonths = useMemo(() => {
    return Array.from(new Set(ispDb.bills.map(b => b.billing_month))).sort();
  }, []);

  const filteredBills = useMemo(() => {
    return ispDb.bills.filter((b) => {
      const cust = customerMap.get(b.customer_id);
      const matchesSearch = 
        String(b.bill_id).includes(search) ||
        String(b.customer_id).includes(search) ||
        (cust?.full_name.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesMonth = monthFilter === 'All' || b.billing_month === monthFilter;
      const matchesStatus = statusFilter === 'All' || b.payment_status === statusFilter;

      return matchesSearch && matchesMonth && matchesStatus;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB as string);
        return sortDirection === 'asc' ? comp : -comp;
      }
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [search, monthFilter, statusFilter, sortField, sortDirection, customerMap]);

  const totalPages = Math.ceil(filteredBills.length / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  const toggleSort = (field: 'bill_id' | 'billing_month' | 'due_date' | 'total_amount_bdt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Bill ID', 'Customer ID', 'Customer Name', 'Subscription ID', 'Billing Month', 'Issue Date', 'Due Date', 'Base Amount', 'Adjustment', 'Total Amount', 'Status'];
    const rows = filteredBills.map(b => {
      const cust = customerMap.get(b.customer_id);
      return [
        b.bill_id,
        b.customer_id,
        `"${cust?.full_name || 'N/A'}"`,
        b.subscription_id,
        b.billing_month,
        b.issue_date,
        b.due_date,
        b.base_amount_bdt,
        b.adjustment_bdt,
        b.total_amount_bdt,
        b.payment_status
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `isp_bills_${monthFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalInvoiced = filteredBills.reduce((acc, b) => acc + b.total_amount_bdt, 0);
  const paidCount = filteredBills.filter(b => b.payment_status === 'Paid').length;
  const unpaidCount = filteredBills.filter(b => b.payment_status === 'Unpaid').length;
  const partialCount = filteredBills.filter(b => b.payment_status === 'Partial').length;

  return (
    <div className="space-y-6">
      {/* Top Ledger Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Filtered Invoices</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {filteredBills.length}
            </span>
            <span className="text-xs text-slate-400">of 1,143 records</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Filtered Invoiced Sum</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {formatBDT(totalInvoiced)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-medium">Paid Invoices</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {paidCount}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {filteredBills.length > 0 ? Math.round((paidCount / filteredBills.length) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider font-medium">Unpaid & Partial</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {unpaidCount + partialCount}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {unpaidCount} unpaid / {partialCount} part
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search bill ID, customer name, CID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs text-slate-400 font-medium shrink-0">Month:</span>
          <button
            onClick={() => { setMonthFilter('All'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
              monthFilter === 'All' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All
          </button>
          {allMonths.map((m) => (
            <button
              key={m}
              onClick={() => { setMonthFilter(m); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors shrink-0 ${
                monthFilter === m ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Status Filter & CSV */}
        <div className="flex items-center gap-2 shrink-0">
          {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th 
                  onClick={() => toggleSort('bill_id')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Bill ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-mono">Customer</th>
                <th 
                  onClick={() => toggleSort('billing_month')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Month
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-mono">Issue Date</th>
                <th 
                  onClick={() => toggleSort('due_date')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Due Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-mono text-right">Base</th>
                <th className="p-3 font-mono text-right">Adjustment</th>
                <th 
                  onClick={() => toggleSort('total_amount_bdt')}
                  className="p-3 font-mono text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Invoiced
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No bills found matching search or filters.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b) => {
                  const cust = customerMap.get(b.customer_id);
                  return (
                    <tr 
                      key={b.bill_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                        #{b.bill_id}
                      </td>
                      <td className="p-3">
                        {cust ? (
                          <div 
                            onClick={() => onSelectCustomer(cust.customer_id)}
                            className="cursor-pointer group flex items-center gap-2"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {cust.full_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{cust.customer_id}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400">CID: #{b.customer_id}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                        {b.billing_month}
                      </td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                        {b.issue_date}
                      </td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                        {b.due_date}
                      </td>
                      <td className="p-3 font-mono text-right text-slate-600 dark:text-slate-400">
                        {formatBDT(b.base_amount_bdt)}
                      </td>
                      <td className="p-3 font-mono text-right text-slate-500">
                        {b.adjustment_bdt !== 0 ? (
                          <span className={b.adjustment_bdt < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                            {formatBDT(b.adjustment_bdt)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3 font-mono text-right font-bold text-slate-900 dark:text-white">
                        {formatBDT(b.total_amount_bdt)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadgeClass(b.payment_status)}`}>
                          {b.payment_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredBills.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredBills.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredBills.length}</strong> bills
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
