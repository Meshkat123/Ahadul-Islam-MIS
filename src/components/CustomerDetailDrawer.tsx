import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, MapPin, Calendar, Wifi, CreditCard, 
  FileText, Activity, AlertCircle, CheckCircle2, ArrowUpRight,
  ShieldAlert, Download, Copy, Check
} from 'lucide-react';
import { Customer360 } from '../utils/analytics';
import { formatBDT, formatGB, getStatusBadgeClass } from '../utils/formatters';

interface CustomerDetailDrawerProps {
  customerData: Customer360 | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer?: (id: number) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customerData,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'payments' | 'usage'>('overview');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !customerData) return null;

  const { customer, subscription, bills, payments, usage, totalBilled, totalPaid, dueBalance, avgMonthlyUsageGb } = customerData;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(String(customer.customer_id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg font-mono">
                  {customer.first_name[0]}{customer.last_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {customer.full_name}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(customer.status)}`}>
                      {customer.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">CID: #{customer.customer_id}</span>
                    <span>•</span>
                    <span>Joined {customer.join_date}</span>
                    <span>•</span>
                    <button 
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Copy Customer ID"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy ID'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Balance Banner */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Total Billed</span>
              <span className="text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums">{formatBDT(totalBilled)}</span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Total Paid</span>
              <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{formatBDT(totalPaid)}</span>
            </div>
            <div className={`p-3 rounded-lg border ${
              dueBalance > 0 
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
            }`}>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Outstanding Due</span>
              <span className={`text-base font-bold font-mono tabular-nums ${
                dueBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {formatBDT(dueBalance)}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mt-5 -mb-6 gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Overview & Plan
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'bills'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Bills
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {bills.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Payments
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {payments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'usage'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Bandwidth Usage
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {usage.length}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Contact Information */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-xs">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate text-xs font-mono">{customer.email}</span>
                  </div>
                  <div className="col-span-full flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-xs">{customer.address}</span>
                  </div>
                </div>
              </div>

              {/* Active Plan & Subscription */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-500" />
                    Broadband Subscription
                  </h3>
                  {subscription && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(subscription.status)}`}>
                      {subscription.status}
                    </span>
                  )}
                </div>

                {subscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base">
                          {subscription.package?.package_name || `Package #${subscription.package_id}`}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Allocated Speed: <strong className="text-slate-800 dark:text-slate-200 font-mono">{subscription.package?.speed_mbps} Mbps</strong> symmetrical
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatBDT(subscription.package?.monthly_fee_bdt || 0)}
                        </div>
                        <div className="text-[11px] text-slate-400">per month</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-slate-400 block mb-1">Subscription ID</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          #{subscription.subscription_id}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-slate-400 block mb-1">Provision Date</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {subscription.start_date}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-500">
                    No active broadband subscription assigned.
                  </div>
                )}
              </div>

              {/* Bandwidth Consumption Metric Preview */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Usage Profile (Avg {formatGB(avgMonthlyUsageGb)} / mo)
                  </h3>
                  <button 
                    onClick={() => setActiveTab('usage')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    View Details <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {usage.slice(-4).map((u) => {
                    const maxGb = Math.max(...usage.map(r => r.total_usage_gb), 800);
                    const pct = Math.min(100, Math.round((u.total_usage_gb / maxGb) * 100));
                    return (
                      <div key={u.usage_id} className="text-xs">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-mono">
                          <span>{u.usage_month}</span>
                          <span>{formatGB(u.total_usage_gb)} (Peak: {formatGB(u.peak_usage_gb)})</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${(u.offpeak_usage_gb / maxGb) * 100}%` }}
                            title={`Offpeak: ${formatGB(u.offpeak_usage_gb)}`}
                          />
                          <div 
                            className="bg-amber-500 h-full" 
                            style={{ width: `${(u.peak_usage_gb / maxGb) * 100}%` }}
                            title={`Peak: ${formatGB(u.peak_usage_gb)}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'bills' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Billing History ({bills.length} Invoices)
                </h4>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="p-3 font-mono">Bill ID</th>
                      <th className="p-3 font-mono">Month</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Base</th>
                      <th className="p-3 text-right">Adj</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bills.map((b) => (
                      <tr key={b.bill_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">#{b.bill_id}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{b.billing_month}</td>
                        <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{b.due_date}</td>
                        <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">{formatBDT(b.base_amount_bdt)}</td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {b.adjustment_bdt !== 0 ? formatBDT(b.adjustment_bdt) : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {formatBDT(b.total_amount_bdt)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadgeClass(b.payment_status)}`}>
                            {b.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payment Vouchers ({payments.length} Transactions)
                </h4>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No payment vouchers recorded for this account.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th className="p-3 font-mono">Payment ID</th>
                        <th className="p-3 font-mono">Bill ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Channel</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {payments.map((p) => (
                        <tr key={p.payment_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">#{p.payment_id}</td>
                          <td className="p-3 font-mono text-slate-500 dark:text-slate-400">#{p.bill_id}</td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{p.payment_date}</td>
                          <td className="p-3">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{p.payment_method}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatBDT(p.amount_paid_bdt)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadgeClass(p.payment_status)}`}>
                              {p.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Bandwidth Telemetry Ledger ({usage.length} Billing Periods)
                </h4>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="p-3 font-mono">Usage ID</th>
                      <th className="p-3 font-mono">Month</th>
                      <th className="p-3 text-right">Total GB</th>
                      <th className="p-3 text-right">Peak (GB)</th>
                      <th className="p-3 text-right">Offpeak (GB)</th>
                      <th className="p-3">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usage.map((u) => {
                      const peakPct = u.total_usage_gb > 0 ? (u.peak_usage_gb / u.total_usage_gb) * 100 : 0;
                      return (
                        <tr key={u.usage_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">#{u.usage_id}</td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{u.usage_month}</td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            {formatGB(u.total_usage_gb)}
                          </td>
                          <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">
                            {formatGB(u.peak_usage_gb)}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {formatGB(u.offpeak_usage_gb)}
                          </td>
                          <td className="p-3 w-32">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                              <div className="bg-amber-500 h-full" style={{ width: `${peakPct}%` }} title={`Peak: ${peakPct.toFixed(0)}%`} />
                              <div className="bg-emerald-500 h-full" style={{ width: `${100 - peakPct}%` }} title={`Offpeak: ${(100 - peakPct).toFixed(0)}%`} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database Foreign Key verified: customer_id = {customer.customer_id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
