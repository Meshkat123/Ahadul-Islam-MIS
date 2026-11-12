import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, User, Phone, 
  Mail, MapPin, ArrowUpDown, ExternalLink, Download, UserCheck,
  UserX, AlertCircle
} from 'lucide-react';
import { ispDb } from '../utils/analytics';
import { Customer } from '../types/isp';
import { getStatusBadgeClass } from '../utils/formatters';

interface CustomersViewProps {
  onSelectCustomer: (customerId: number) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onSelectCustomer }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended' | 'Inactive'>('All');
  const [sortField, setSortField] = useState<'customer_id' | 'full_name' | 'join_date'>('customer_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Pre-join subscriptions and packages for instant display
  const subMap = useMemo(() => {
    return new Map(ispDb.subscriptions.map(s => [s.customer_id, s]));
  }, []);

  const pkgMap = useMemo(() => {
    return new Map(ispDb.packages.map(p => [p.package_id, p]));
  }, []);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    return ispDb.customers.filter((c) => {
      const matchesSearch = 
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase()) ||
        String(c.customer_id).includes(search);
      
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB as string);
        return sortDirection === 'asc' ? comp : -comp;
      }
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [search, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const toggleSort = (field: 'customer_id' | 'full_name' | 'join_date') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Customer ID', 'Full Name', 'Phone', 'Email', 'Address', 'Status', 'Join Date', 'Plan Name', 'Speed Mbps'];
    const rows = filteredCustomers.map(c => {
      const sub = subMap.get(c.customer_id);
      const pkg = sub ? pkgMap.get(sub.package_id) : undefined;
      return [
        c.customer_id,
        `"${c.full_name}"`,
        `"${c.phone}"`,
        `"${c.email}"`,
        `"${c.address.replace(/"/g, '""')}"`,
        c.status,
        c.join_date,
        pkg?.package_name || 'N/A',
        pkg?.speed_mbps || 0
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `isp_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = ispDb.customers.filter(c => c.status === 'Active').length;
  const suspendedCount = ispDb.customers.filter(c => c.status === 'Suspended').length;
  const inactiveCount = ispDb.customers.filter(c => c.status === 'Inactive').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Directory</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {ispDb.customers.length}
            </span>
            <span className="text-xs text-slate-400">100% indexed</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-medium">Active Accounts</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </span>
            <span className="text-xs font-mono text-slate-400">{Math.round((activeCount / ispDb.customers.length) * 100)}%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-medium">Suspended</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {suspendedCount}
            </span>
            <span className="text-xs font-mono text-slate-400">{Math.round((suspendedCount / ispDb.customers.length) * 100)}%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider font-medium">Terminated / Inactive</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {inactiveCount}
            </span>
            <span className="text-xs font-mono text-slate-400">{Math.round((inactiveCount / ispDb.customers.length) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, ID, phone, email, address..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Active', 'Suspended', 'Inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status}
              {status === 'All' ? ` (${ispDb.customers.length})` : 
               status === 'Active' ? ` (${activeCount})` : 
               status === 'Suspended' ? ` (${suspendedCount})` : ` (${inactiveCount})`}
            </button>
          ))}

          <button
            onClick={handleExportCsv}
            className="ml-auto sm:ml-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
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
                  onClick={() => toggleSort('customer_id')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    CID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('full_name')}
                  className="p-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Subscriber Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Address</th>
                <th className="p-3">Assigned Plan</th>
                <th className="p-3 text-center">Status</th>
                <th 
                  onClick={() => toggleSort('join_date')}
                  className="p-3 cursor-pointer hover:text-slate-900 dark:hover:text-white font-mono"
                >
                  <div className="flex items-center gap-1">
                    Join Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No customers found matching filter &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const sub = subMap.get(c.customer_id);
                  const pkg = sub ? pkgMap.get(sub.package_id) : undefined;
                  return (
                    <tr 
                      key={c.customer_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                        #{c.customer_id}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center font-mono text-[11px] shrink-0">
                            {c.first_name[0]}{c.last_name[0]}
                          </div>
                          <div>
                            <span 
                              onClick={() => onSelectCustomer(c.customer_id)}
                              className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors block"
                            >
                              {c.full_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                        {c.phone}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 font-mono truncate max-w-[140px]">
                        {c.email}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={c.address}>
                        {c.address}
                      </td>
                      <td className="p-3">
                        {pkg ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{pkg.package_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{pkg.speed_mbps} Mbps</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No plan</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadgeClass(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                        {c.join_date}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onSelectCustomer(c.customer_id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-white font-medium text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          360 Profile <ExternalLink className="w-3 h-3" />
                        </button>
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
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredCustomers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredCustomers.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredCustomers.length}</strong> matching records
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
