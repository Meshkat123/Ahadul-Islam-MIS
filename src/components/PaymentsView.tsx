import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, CreditCard, 
  ArrowUpDown, Download, CheckCircle, Smartphone, Building, 
  Banknote
} from 'lucide-react';
import { ispDb } from '../utils/analytics';
import { Payment } from '../types/isp';
import { formatBDT, getStatusBadgeClass } from '../utils/formatters';

interface PaymentsViewProps {
  onSelectCustomer: (customerId: number) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ onSelectCustomer }) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'payment_id' | 'payment_date' | 'amount_paid_bdt'>('payment_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const customerMap = useMemo(() => {
    return new Map(ispDb.customers.map(c => [c.customer_id, c]));
  }, []);

  const methods = ['All', 'bKash', 'Nagad', 'Bank Transfer', 'Card', 'Cash'] as const;

  const filteredPayments = useMemo(() => {
    return ispDb.payments.filter((p) => {
      const cust = customerMap.get(p.customer_id);
      const matchesSearch = 
        String(p.payment_id).includes(search) ||
        String(p.bill_id).includes(search) ||
        String(p.customer_id).includes(search) ||
        (cust?.full_name.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesMethod = methodFilter === 'All' || p.payment_method === methodFilter;

      return matchesSearch && matchesMethod;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB as string);
        return sortDirection === 'asc' ? comp : -comp;
      }
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [search, methodFilter, sortField, sortDirection, customerMap]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const toggleSort = (field: 'payment_id' | 'payment_date' | 'amount_paid_bdt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Payment ID', 'Bill ID', 'Customer ID', 'Customer Name', 'Payment Date', 'Method', 'Amount Paid BDT', 'Status'];
    const rows = filteredPayments.map(p => {
      const cust = customerMap.get(p.customer_id);
      return [
        p.payment_id,
        p.bill_id,
        p.customer_id,
        `"${cust?.full_name || 'N/A'}"`,
        p.payment_date,
        p.payment_method,
        p.amount_paid_bdt,
        p.payment_status
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `isp_payments_${methodFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.amount_paid_bdt, 0);
  const avgVoucher = filteredPayments.length > 0 ? totalCollected / filteredPayments.length : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Cleared Receipts</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {filteredPayments.length}
            </span>
            <span className="text-xs text-slate-400">of 1,009 vouchers</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-medium">Gross Cleared Funds</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatBDT(totalCollected)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Average Voucher</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
              {formatBDT(avgVoucher)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Filtered Channel</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-bold text-slate-900 dark:text-white truncate">
              {methodFilter}
            </span>
            <span className="text-xs font-mono text-slate-400">Selected</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search payment ID, bill ID, subscriber..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Channels */}
        <div className="flex flex-wrap items-center gap-2">
          {methods.map((method) => (
            <button
              key={method}
              onClick={() => {
                setMethodFilter(method);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                methodFilter === method
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {method}
            </button>
          ))}

          <button
            onClick={handleExportCsv}
            className="ml-auto sm:ml-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
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
                  onClick={() => toggleSort('payment_id')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Receipt ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-mono">Invoice Bill ID</th>
                <th className="p-3 font-mono">Subscriber</th>
                <th 
                  onClick={() => toggleSort('payment_date')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Payment Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Payment Channel</th>
                <th 
                  onClick={() => toggleSort('amount_paid_bdt')}
                  className="p-3 font-mono text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount Paid
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-center">Receipt Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No payment receipts found matching filter &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  const cust = customerMap.get(p.customer_id);
                  return (
                    <tr 
                      key={p.payment_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                        #{p.payment_id}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        #{p.bill_id}
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
                          <span className="font-mono text-slate-400">CID: #{p.customer_id}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                        {p.payment_date}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(p.amount_paid_bdt)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadgeClass(p.payment_status)}`}>
                          {p.payment_status}
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
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredPayments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredPayments.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredPayments.length}</strong> payments
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
