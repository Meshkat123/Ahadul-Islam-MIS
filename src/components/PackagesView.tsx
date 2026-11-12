import React, { useState } from 'react';
import { 
  Wifi, Zap, Users, DollarSign, Activity, CheckCircle, 
  ArrowUpRight, Sparkles, Sliders, ShieldCheck
} from 'lucide-react';
import { ispDb, getPackageAnalytics } from '../utils/analytics';
import { formatBDT, formatGB } from '../utils/formatters';

interface PackagesViewProps {
  onNavigateToCustomers?: () => void;
}

export const PackagesView: React.FC<PackagesViewProps> = ({ onNavigateToCustomers }) => {
  const packageAnalytics = getPackageAnalytics(ispDb);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  const totalMrr = packageAnalytics.reduce((acc, p) => acc + p.totalMonthlyRevenue, 0);
  const totalSubscribers = packageAnalytics.reduce((acc, p) => acc + p.subscribersCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Catalog Tiers</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {packageAnalytics.length} Tiers
            </span>
            <span className="text-xs text-slate-400">10 to 200 Mbps</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-medium">Monthly Active MRR</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatBDT(totalMrr)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Total Subscribed Base</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
              {totalSubscribers} Accounts
            </span>
            <span className="text-xs text-slate-400">100% assigned</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-medium">Top Revenue Tier</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-bold text-slate-900 dark:text-white truncate">
              {packageAnalytics[0]?.package_name || 'N/A'}
            </span>
            <span className="text-xs font-mono text-emerald-600 font-medium">
              {formatBDT(packageAnalytics[0]?.totalMonthlyRevenue || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Package Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packageAnalytics.map((pkg) => {
          const costPerMbps = (pkg.monthly_fee_bdt / pkg.speed_mbps).toFixed(1);
          const isSelected = selectedPackageId === pkg.package_id;

          return (
            <div 
              key={pkg.package_id}
              onClick={() => setSelectedPackageId(isSelected ? null : pkg.package_id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-md' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">PLAN #{pkg.package_id}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                      {pkg.package_name}
                    </h3>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                    {pkg.speed_mbps} Mbps
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                      {formatBDT(pkg.monthly_fee_bdt)}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    ৳{costPerMbps} per Mbps
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subscribers</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {pkg.subscribersCount} ({pkg.sharePercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Monthly MRR</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBDT(pkg.totalMonthlyRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Traffic Carried</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {formatGB(pkg.totalUsageGb)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Symmetrical QoS
                </span>
                <span className="font-mono">ID: {pkg.package_id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Tier Comparison Matrix */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Broadband Catalog Comparative Analysis & Unit Economics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluating tariff rate, subscriber density, bandwidth cost ratio, and gross run-rate
            </p>
          </div>
          {onNavigateToCustomers && (
            <button
              onClick={onNavigateToCustomers}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
            >
              Inspect Subscribers <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="p-3 font-mono">Plan ID</th>
                <th className="p-3">Service Tier</th>
                <th className="p-3 font-mono text-right">Speed</th>
                <th className="p-3 font-mono text-right">Tariff (BDT)</th>
                <th className="p-3 font-mono text-right">Rate / Mbps</th>
                <th className="p-3 text-center">Subscribers</th>
                <th className="p-3 text-center">Active Subs</th>
                <th className="p-3 font-mono text-right">Monthly MRR</th>
                <th className="p-3 font-mono text-right">Total Bandwidth</th>
                <th className="p-3 font-mono text-right">Avg / User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {packageAnalytics.map((pkg) => {
                const costPerMbps = (pkg.monthly_fee_bdt / pkg.speed_mbps).toFixed(1);
                const avgPerUser = pkg.subscribersCount > 0 ? pkg.totalUsageGb / pkg.subscribersCount : 0;

                return (
                  <tr key={pkg.package_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-500">#{pkg.package_id}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {pkg.package_name}
                    </td>
                    <td className="p-3 font-mono text-right text-slate-700 dark:text-slate-300">
                      {pkg.speed_mbps} Mbps
                    </td>
                    <td className="p-3 font-mono text-right font-medium text-slate-900 dark:text-white">
                      {formatBDT(pkg.monthly_fee_bdt)}
                    </td>
                    <td className="p-3 font-mono text-right text-slate-500">
                      ৳{costPerMbps}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {pkg.subscribersCount}
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      {pkg.activeSubscribersCount}
                    </td>
                    <td className="p-3 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBDT(pkg.totalMonthlyRevenue)}
                    </td>
                    <td className="p-3 font-mono text-right text-slate-600 dark:text-slate-300">
                      {formatGB(pkg.totalUsageGb)}
                    </td>
                    <td className="p-3 font-mono text-right text-slate-500">
                      {formatGB(avgPerUser)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
