import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Activity, 
  ArrowUpDown, Download, Wifi, Zap, Flame, ShieldAlert
} from 'lucide-react';
import { ispDb } from '../utils/analytics';
import { UsageRecord } from '../types/isp';
import { formatGB } from '../utils/formatters';

interface UsageViewProps {
  onSelectCustomer: (customerId: number) => void;
}

export const UsageView: React.FC<UsageViewProps> = ({ onSelectCustomer }) => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<'All' | 'Heavy (>500GB)' | 'Medium (250-500GB)' | 'Light (<250GB)'>('All');
  const [sortField, setSortField] = useState<'usage_id' | 'usage_month' | 'total_usage_gb' | 'peak_usage_gb'>('total_usage_gb');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const customerMap = useMemo(() => {
    return new Map(ispDb.customers.map(c => [c.customer_id, c]));
  }, []);

  const subMap = useMemo(() => {
    return new Map(ispDb.subscriptions.map(s => [s.subscription_id, s]));
  }, []);

  const pkgMap = useMemo(() => {
    return new Map(ispDb.packages.map(p => [p.package_id, p]));
  }, []);

  const allMonths = useMemo(() => {
    return Array.from(new Set(ispDb.usage.map(u => u.usage_month))).sort();
  }, []);

  const filteredUsage = useMemo(() => {
    return ispDb.usage.filter((u) => {
      const cust = customerMap.get(u.customer_id);
      const matchesSearch = 
        String(u.usage_id).includes(search) ||
        String(u.customer_id).includes(search) ||
        (cust?.full_name.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesMonth = monthFilter === 'All' || u.usage_month === monthFilter;

      let matchesTier = true;
      if (tierFilter === 'Heavy (>500GB)') {
        matchesTier = u.total_usage_gb >= 500;
      } else if (tierFilter === 'Medium (250-500GB)') {
        matchesTier = u.total_usage_gb >= 250 && u.total_usage_gb < 500;
      } else if (tierFilter === 'Light (<250GB)') {
        matchesTier = u.total_usage_gb < 250;
      }

      return matchesSearch && matchesMonth && matchesTier;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB as string);
        return sortDirection === 'asc' ? comp : -comp;
      }
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [search, monthFilter, tierFilter, sortField, sortDirection, customerMap]);

  const totalPages = Math.ceil(filteredUsage.length / pageSize) || 1;
  const paginatedUsage = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsage.slice(start, start + pageSize);
  }, [filteredUsage, currentPage, pageSize]);

  const toggleSort = (field: 'usage_id' | 'usage_month' | 'total_usage_gb' | 'peak_usage_gb') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Usage ID', 'Customer ID', 'Subscriber Name', 'Plan Speed', 'Month', 'Total GB', 'Peak GB', 'Offpeak GB'];
    const rows = filteredUsage.map(u => {
      const cust = customerMap.get(u.customer_id);
      const sub = subMap.get(u.subscription_id);
      const pkg = sub ? pkgMap.get(sub.package_id) : undefined;
      return [
        u.usage_id,
        u.customer_id,
        `"${cust?.full_name || 'N/A'}"`,
        pkg ? `${pkg.speed_mbps} Mbps` : 'N/A',
        u.usage_month,
        u.total_usage_gb,
        u.peak_usage_gb,
        u.offpeak_usage_gb
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `isp_usage_${monthFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBandwidth = filteredUsage.reduce((acc, u) => acc + u.total_usage_gb, 0);
  const totalPeak = filteredUsage.reduce((acc, u) => acc + u.peak_usage_gb, 0);
  const totalOffpeak = filteredUsage.reduce((acc, u) => acc + u.offpeak_usage_gb, 0);
  const peakPct = totalBandwidth > 0 ? (totalPeak / totalBandwidth) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Aggregated Traffic</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {formatGB(totalBandwidth)}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {(totalBandwidth / 1024).toFixed(1)} TB
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-medium">Peak Hour Traffic</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatGB(totalPeak)}
            </span>
            <span className="text-xs font-mono text-slate-400">{peakPct.toFixed(1)}% peak</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-medium">Off-Peak Traffic</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatGB(totalOffpeak)}
            </span>
            <span className="text-xs font-mono text-slate-400">{(100 - peakPct).toFixed(1)}% offpeak</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Average / Session</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
              {filteredUsage.length > 0 ? formatGB(totalBandwidth / filteredUsage.length) : '0 GB'}
            </span>
            <span className="text-xs text-slate-400">monthly mean</span>
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
            placeholder="Search usage ID, subscriber name, CID..."
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

        {/* Tier Selector & CSV */}
        <div className="flex items-center gap-2 shrink-0">
          {(['All', 'Heavy (>500GB)', 'Medium (250-500GB)', 'Light (<250GB)'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => {
                setTierFilter(tier);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tierFilter === tier
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tier.split(' ')[0]}
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
                  onClick={() => toggleSort('usage_id')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Telemetry ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-mono">Subscriber</th>
                <th className="p-3">Assigned Plan</th>
                <th 
                  onClick={() => toggleSort('usage_month')}
                  className="p-3 font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Month
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('total_usage_gb')}
                  className="p-3 font-mono text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Volume
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('peak_usage_gb')}
                  className="p-3 font-mono text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Peak (18:00-00:00)
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-mono text-right">Off-Peak</th>
                <th className="p-3">Peak / Offpeak Meter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedUsage.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No bandwidth records found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedUsage.map((u) => {
                  const cust = customerMap.get(u.customer_id);
                  const sub = subMap.get(u.subscription_id);
                  const pkg = sub ? pkgMap.get(sub.package_id) : undefined;
                  const peakRatio = u.total_usage_gb > 0 ? (u.peak_usage_gb / u.total_usage_gb) * 100 : 0;

                  return (
                    <tr 
                      key={u.usage_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                        #{u.usage_id}
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
                          <span className="font-mono text-slate-400">CID: #{u.customer_id}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {pkg ? (
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {pkg.package_name} ({pkg.speed_mbps}M)
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                        {u.usage_month}
                      </td>
                      <td className="p-3 font-mono text-right font-bold text-slate-900 dark:text-white">
                        {formatGB(u.total_usage_gb)}
                      </td>
                      <td className="p-3 font-mono text-right text-amber-600 dark:text-amber-400">
                        {formatGB(u.peak_usage_gb)}
                      </td>
                      <td className="p-3 font-mono text-right text-emerald-600 dark:text-emerald-400">
                        {formatGB(u.offpeak_usage_gb)}
                      </td>
                      <td className="p-3 w-40">
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-amber-500 h-full" 
                              style={{ width: `${peakRatio}%` }} 
                              title={`Peak: ${peakRatio.toFixed(0)}%`}
                            />
                            <div 
                              className="bg-emerald-500 h-full" 
                              style={{ width: `${100 - peakRatio}%` }} 
                              title={`Offpeak: ${(100 - peakRatio).toFixed(0)}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Peak: {peakRatio.toFixed(0)}%</span>
                            <span>Off: {(100 - peakRatio).toFixed(0)}%</span>
                          </div>
                        </div>
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
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredUsage.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredUsage.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredUsage.length}</strong> records
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
