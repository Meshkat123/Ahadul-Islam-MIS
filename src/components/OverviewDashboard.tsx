import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, Users, Activity, AlertTriangle, 
  CheckCircle2, CreditCard, ArrowUpRight, BarChart3, 
  Calendar, Layers, Filter, ShieldCheck, Database
} from 'lucide-react';
import { 
  ispDb, computeKpis, getMonthlyTrends, getPaymentMethodBreakdown, 
  getPackageAnalytics 
} from '../utils/analytics';
import { formatBDT, formatCompactNumber, formatGB, formatPercent, getStatusBadgeClass } from '../utils/formatters';

interface OverviewDashboardProps {
  onSelectCustomer: (customerId: number) => void;
  onNavigateToView: (view: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onSelectCustomer,
  onNavigateToView,
}) => {
  const kpis = computeKpis(ispDb);
  const monthlyTrends = getMonthlyTrends(ispDb);
  const paymentMethods = getPaymentMethodBreakdown(ispDb);
  const packageAnalytics = getPackageAnalytics(ispDb);

  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Top unpaid accounts for debt watchlist
  const unpaidByCustomer = new Map<number, { count: number; total: number }>();
  ispDb.bills.filter(b => b.payment_status === 'Unpaid' || b.payment_status === 'Partial').forEach(b => {
    const curr = unpaidByCustomer.get(b.customer_id) || { count: 0, total: 0 };
    curr.count += 1;
    curr.total += b.total_amount_bdt;
    unpaidByCustomer.set(b.customer_id, curr);
  });

  const highRiskCustomers = Array.from(unpaidByCustomer.entries())
    .map(([custId, data]) => {
      const cust = ispDb.customers.find(c => c.customer_id === custId);
      const sub = ispDb.subscriptions.find(s => s.customer_id === custId);
      const pkg = sub ? ispDb.packages.find(p => p.package_id === sub.package_id) : undefined;
      return {
        customerId: custId,
        name: cust?.full_name || `Customer #${custId}`,
        phone: cust?.phone || 'N/A',
        status: cust?.status || 'Unknown',
        plan: pkg?.package_name || 'Standard Plan',
        unpaidCount: data.count,
        unpaidAmount: data.total,
      };
    })
    .sort((a, b) => b.unpaidAmount - a.unpaidAmount)
    .slice(0, 5);

  const maxMonthlyBilled = Math.max(...monthlyTrends.map(t => Math.max(t.billed, t.collected)), 1);

  return (
    <div className="space-y-6">
      {/* DB Summary & System Status Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight">MPMIS-514 ISP Database Active</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                3,695 Tuples Loaded
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              6 Normalized Relations (3NF/BCNF) · 200 Subscribers · 8 Tiers · 1,143 Invoices · 1,009 Payments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => onNavigateToView('erd')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors flex items-center gap-1.5 border border-white/10"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Inspect Schema & ERD
          </button>
          <button
            onClick={() => onNavigateToView('sql')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            SQL Console
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Total Invoiced</span>
            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatBDT(kpis.totalBilled)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>1,143 total bills generated</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">6 billing cycles</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Realized Collection</span>
            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatBDT(kpis.totalCollected)}
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Collection Realization</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {formatPercent(kpis.collectionRate)}
            </span>
          </div>
        </div>

        {/* Outstanding Overdue */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Overdue Balance</span>
            <div className="p-1.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
              {formatBDT(kpis.totalOutstanding)}
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Uncollected Receivables</span>
            <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
              {formatPercent(100 - kpis.collectionRate)}
            </span>
          </div>
        </div>

        {/* Active Subscribers & ARPU */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Subscribers & ARPU</span>
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {kpis.activeCustomers} <span className="text-sm font-normal text-slate-400">/ {ispDb.customers.length}</span>
            </span>
            <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
              {Math.round((kpis.activeCustomers / ispDb.customers.length) * 100)}% active
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Monthly ARPU</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatBDT(kpis.avgArpu)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing vs Collected Realization Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Monthly Revenue Generation vs Cash Collection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Billed invoices vs realized payment vouchers across cycles
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700" />
                <span className="text-slate-600 dark:text-slate-400">Invoiced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Collected</span>
              </div>
            </div>
          </div>

          {/* SVG / Bar Chart Representation */}
          <div className="mt-6 pt-2">
            <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2">
              {monthlyTrends.map((t) => {
                const billedHeight = Math.round((t.billed / maxMonthlyBilled) * 100);
                const collectedHeight = Math.round((t.collected / maxMonthlyBilled) * 100);
                const rate = t.billed > 0 ? (t.collected / t.billed) * 100 : 0;
                const isHovered = hoveredMonth === t.month;

                return (
                  <div 
                    key={t.month}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredMonth(t.month)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl font-mono whitespace-nowrap border border-slate-700 animate-in fade-in">
                        <div className="font-semibold text-emerald-400">{t.month}</div>
                        <div>Billed: {formatBDT(t.billed)}</div>
                        <div>Collected: {formatBDT(t.collected)} ({rate.toFixed(1)}%)</div>
                        <div className="text-[10px] text-slate-400">{t.unpaidCount} unpaid invoices</div>
                      </div>
                    )}

                    {/* Bars pair */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-2">
                      {/* Billed Bar */}
                      <div 
                        className="w-1/2 max-w-[28px] bg-slate-200 dark:bg-slate-700 rounded-t-sm transition-all duration-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                        style={{ height: `${billedHeight}%` }}
                      />
                      {/* Collected Bar */}
                      <div 
                        className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-400 rounded-t-sm transition-all duration-300 relative shadow-xs"
                        style={{ height: `${collectedHeight}%` }}
                      >
                        {rate >= 80 && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {Math.round(rate)}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Month Label */}
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">
                      {t.month.replace('2024-', 'M')}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Overall Average Realization: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatPercent(kpis.collectionRate)}</strong></span>
              <span className="font-mono text-[11px]">Period: Jan 2024 - Jun 2024</span>
            </div>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Payment Channels
              </h3>
              <span className="text-xs font-mono text-slate-400">1,009 Vouchers</span>
            </div>

            <div className="mt-4 space-y-3">
              {paymentMethods.map((pm) => (
                <div key={pm.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{pm.method}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {formatBDT(pm.totalAmount)} ({pm.sharePercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        pm.method === 'bKash' ? 'bg-pink-500' :
                        pm.method === 'Nagad' ? 'bg-amber-500' :
                        pm.method === 'Bank Transfer' ? 'bg-blue-600' :
                        pm.method === 'Card' ? 'bg-purple-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pm.sharePercentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>{pm.count} transactions</span>
                    <span>Avg {formatBDT(pm.totalAmount / (pm.count || 1))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>MFS Share (bKash+Nagad):</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {(paymentMethods.filter(p => p.method === 'bKash' || p.method === 'Nagad').reduce((a, c) => a + c.sharePercentage, 0)).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Package Breakdown & Bandwidth Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadband Tier Catalog & Revenue */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                Service Tier Distribution & Monthly Run-Rate (MRR)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                8 active catalog packages with subscriber density and data consumption
              </p>
            </div>
            <button
              onClick={() => onNavigateToView('packages')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
            >
              View Catalog <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="p-2.5 font-mono">ID</th>
                  <th className="p-2.5">Package Name</th>
                  <th className="p-2.5 font-mono text-right">Speed</th>
                  <th className="p-2.5 font-mono text-right">Fee (BDT)</th>
                  <th className="p-2.5 text-center">Subscribers</th>
                  <th className="p-2.5 font-mono text-right">Monthly MRR</th>
                  <th className="p-2.5 font-mono text-right">Total Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {packageAnalytics.map((pkg) => (
                  <tr key={pkg.package_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-slate-500">#{pkg.package_id}</td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                      {pkg.package_name}
                    </td>
                    <td className="p-2.5 font-mono text-right text-slate-600 dark:text-slate-300">
                      {pkg.speed_mbps} Mbps
                    </td>
                    <td className="p-2.5 font-mono text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatBDT(pkg.monthly_fee_bdt)}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {pkg.subscribersCount} ({pkg.sharePercentage.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBDT(pkg.totalMonthlyRevenue)}
                    </td>
                    <td className="p-2.5 font-mono text-right text-slate-600 dark:text-slate-400">
                      {formatGB(pkg.totalUsageGb)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* High Risk Receivables Watchlist */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Overdue Debt Watchlist
              </h3>
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-medium">
                Top Defaulters
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {highRiskCustomers.map((c) => (
                <div 
                  key={c.customerId}
                  onClick={() => onSelectCustomer(c.customerId)}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      {c.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-[11px]">{c.phone}</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                      {formatBDT(c.unpaidAmount)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{c.plan}</span>
                    <span className="font-mono text-rose-500">{c.unpaidCount} unpaid cycle(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => onNavigateToView('bills')}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1"
            >
              Inspect all overdue invoices in Bills ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
