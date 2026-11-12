import { IspDatabase, Customer, Package, Subscription, Bill, Payment, UsageRecord } from '../types/isp';
import rawData from '../data/ispData.json';

export const ispDb = rawData as IspDatabase;

export interface KpiSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  activeCustomers: number;
  suspendedCustomers: number;
  inactiveCustomers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalBandwidthGb: number;
  peakBandwidthGb: number;
  offpeakBandwidthGb: number;
  avgArpu: number;
}

export function computeKpis(db: IspDatabase): KpiSummary {
  const totalBilled = db.bills.reduce((acc, b) => acc + b.total_amount_bdt, 0);
  const totalCollected = db.payments.reduce((acc, p) => acc + p.amount_paid_bdt, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  const activeCustomers = db.customers.filter(c => c.status === 'Active').length;
  const suspendedCustomers = db.customers.filter(c => c.status === 'Suspended').length;
  const inactiveCustomers = db.customers.filter(c => c.status === 'Inactive').length;

  const activeSubscriptions = db.subscriptions.filter(s => s.status === 'Active').length;

  const totalBandwidthGb = db.usage.reduce((acc, u) => acc + u.total_usage_gb, 0);
  const peakBandwidthGb = db.usage.reduce((acc, u) => acc + u.peak_usage_gb, 0);
  const offpeakBandwidthGb = db.usage.reduce((acc, u) => acc + u.offpeak_usage_gb, 0);

  // Average monthly revenue per active user
  const uniqueMonths = new Set(db.bills.map(b => b.billing_month)).size || 1;
  const avgMonthlyRevenue = totalCollected / uniqueMonths;
  const avgArpu = activeCustomers > 0 ? avgMonthlyRevenue / activeCustomers : 0;

  return {
    totalBilled,
    totalCollected,
    totalOutstanding,
    collectionRate,
    activeCustomers,
    suspendedCustomers,
    inactiveCustomers,
    totalSubscriptions: db.subscriptions.length,
    activeSubscriptions,
    totalBandwidthGb,
    peakBandwidthGb,
    offpeakBandwidthGb,
    avgArpu,
  };
}

export interface MonthlyTrend {
  month: string;
  billed: number;
  collected: number;
  billsCount: number;
  unpaidCount: number;
  usageGb: number;
}

export function getMonthlyTrends(db: IspDatabase): MonthlyTrend[] {
  const monthMap = new Map<string, MonthlyTrend>();

  // Init from bills
  db.bills.forEach(b => {
    if (!monthMap.has(b.billing_month)) {
      monthMap.set(b.billing_month, {
        month: b.billing_month,
        billed: 0,
        collected: 0,
        billsCount: 0,
        unpaidCount: 0,
        usageGb: 0,
      });
    }
    const item = monthMap.get(b.billing_month)!;
    item.billed += b.total_amount_bdt;
    item.billsCount += 1;
    if (b.payment_status === 'Unpaid') {
      item.unpaidCount += 1;
    }
  });

  // Calculate payments matching each month's bills
  const billMonthLookup = new Map<number, string>();
  db.bills.forEach(b => billMonthLookup.set(b.bill_id, b.billing_month));

  db.payments.forEach(p => {
    const month = billMonthLookup.get(p.bill_id);
    if (month && monthMap.has(month)) {
      monthMap.get(month)!.collected += p.amount_paid_bdt;
    }
  });

  // Usage per month
  db.usage.forEach(u => {
    if (monthMap.has(u.usage_month)) {
      monthMap.get(u.usage_month)!.usageGb += u.total_usage_gb;
    }
  });

  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export interface PaymentMethodBreakdown {
  method: string;
  totalAmount: number;
  count: number;
  sharePercentage: number;
}

export function getPaymentMethodBreakdown(db: IspDatabase): PaymentMethodBreakdown[] {
  const map = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  db.payments.forEach(p => {
    const curr = map.get(p.payment_method) || { total: 0, count: 0 };
    curr.total += p.amount_paid_bdt;
    curr.count += 1;
    map.set(p.payment_method, curr);
    grandTotal += p.amount_paid_bdt;
  });

  return Array.from(map.entries()).map(([method, data]) => ({
    method,
    totalAmount: data.total,
    count: data.count,
    sharePercentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
  })).sort((a, b) => b.totalAmount - a.totalAmount);
}

export interface PackageAnalytics {
  package_id: number;
  package_name: string;
  speed_mbps: number;
  monthly_fee_bdt: number;
  subscribersCount: number;
  activeSubscribersCount: number;
  totalMonthlyRevenue: number;
  totalUsageGb: number;
  sharePercentage: number;
}

export function getPackageAnalytics(db: IspDatabase): PackageAnalytics[] {
  const subsByPkg = new Map<number, { total: number; active: number }>();
  db.subscriptions.forEach(s => {
    const curr = subsByPkg.get(s.package_id) || { total: 0, active: 0 };
    curr.total += 1;
    if (s.status === 'Active') curr.active += 1;
    subsByPkg.set(s.package_id, curr);
  });

  // usage by subscription
  const subToPkg = new Map<number, number>();
  db.subscriptions.forEach(s => subToPkg.set(s.subscription_id, s.package_id));

  const usageByPkg = new Map<number, number>();
  db.usage.forEach(u => {
    const pkgId = subToPkg.get(u.subscription_id);
    if (pkgId) {
      usageByPkg.set(pkgId, (usageByPkg.get(pkgId) || 0) + u.total_usage_gb);
    }
  });

  const totalSubs = db.subscriptions.length;

  return db.packages.map(p => {
    const subData = subsByPkg.get(p.package_id) || { total: 0, active: 0 };
    return {
      package_id: p.package_id,
      package_name: p.package_name,
      speed_mbps: p.speed_mbps,
      monthly_fee_bdt: p.monthly_fee_bdt,
      subscribersCount: subData.total,
      activeSubscribersCount: subData.active,
      totalMonthlyRevenue: subData.active * p.monthly_fee_bdt,
      totalUsageGb: usageByPkg.get(p.package_id) || 0,
      sharePercentage: totalSubs > 0 ? (subData.total / totalSubs) * 100 : 0,
    };
  }).sort((a, b) => b.totalMonthlyRevenue - a.totalMonthlyRevenue);
}

export interface Customer360 {
  customer: Customer;
  subscription: (Subscription & { package?: Package }) | null;
  bills: Bill[];
  payments: Payment[];
  usage: UsageRecord[];
  totalBilled: number;
  totalPaid: number;
  dueBalance: number;
  avgMonthlyUsageGb: number;
}

export function getCustomer360(customerId: number, db: IspDatabase): Customer360 | null {
  const customer = db.customers.find(c => c.customer_id === customerId);
  if (!customer) return null;

  const subscriptionRaw = db.subscriptions.find(s => s.customer_id === customerId) || null;
  let subscription: (Subscription & { package?: Package }) | null = null;
  if (subscriptionRaw) {
    const pkg = db.packages.find(p => p.package_id === subscriptionRaw.package_id);
    subscription = { ...subscriptionRaw, package: pkg };
  }

  const bills = db.bills.filter(b => b.customer_id === customerId).sort((a, b) => b.billing_month.localeCompare(a.billing_month));
  const payments = db.payments.filter(p => p.customer_id === customerId).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const usage = db.usage.filter(u => u.customer_id === customerId).sort((a, b) => a.usage_month.localeCompare(b.usage_month));

  const totalBilled = bills.reduce((acc, b) => acc + b.total_amount_bdt, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount_paid_bdt, 0);
  const dueBalance = Math.max(0, totalBilled - totalPaid);

  const avgMonthlyUsageGb = usage.length > 0
    ? usage.reduce((acc, u) => acc + u.total_usage_gb, 0) / usage.length
    : 0;

  return {
    customer,
    subscription,
    bills,
    payments,
    usage,
    totalBilled,
    totalPaid,
    dueBalance,
    avgMonthlyUsageGb,
  };
}

export interface PresetQuery {
  id: string;
  title: string;
  description: string;
  sql: string;
  execute: (db: IspDatabase) => { columns: string[]; rows: (string | number)[][] };
}

export const PRESET_QUERIES: PresetQuery[] = [
  {
    id: 'top-consumers',
    title: 'Top 10 Heavy Bandwidth Consumers & Plan Speed',
    description: 'Ranks subscribers by total gigabytes downloaded/uploaded, showing assigned tier and speed ratio.',
    sql: `SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    p.package_name,
    p.speed_mbps,
    ROUND(SUM(u.total_usage_gb), 2) AS total_gb,
    ROUND(AVG(u.peak_usage_gb), 2) AS avg_peak_gb,
    c.status
FROM customers c
JOIN subscriptions s ON c.customer_id = s.customer_id
JOIN packages p ON s.package_id = p.package_id
JOIN usage u ON s.subscription_id = u.subscription_id
GROUP BY c.customer_id, c.first_name, c.last_name, p.package_name, p.speed_mbps, c.status
ORDER BY total_gb DESC
LIMIT 10;`,
    execute: (db) => {
      const pkgMap = new Map(db.packages.map(p => [p.package_id, p]));
      const subMap = new Map(db.subscriptions.map(s => [s.subscription_id, s]));
      const customerMap = new Map(db.customers.map(c => [c.customer_id, c]));

      const usageByCustomer = new Map<number, { total: number; peak: number; count: number }>();
      db.usage.forEach(u => {
        const curr = usageByCustomer.get(u.customer_id) || { total: 0, peak: 0, count: 0 };
        curr.total += u.total_usage_gb;
        curr.peak += u.peak_usage_gb;
        curr.count += 1;
        usageByCustomer.set(u.customer_id, curr);
      });

      const sorted = Array.from(usageByCustomer.entries())
        .map(([custId, uData]) => {
          const cust = customerMap.get(custId);
          const sub = db.subscriptions.find(s => s.customer_id === custId);
          const pkg = sub ? pkgMap.get(sub.package_id) : undefined;
          return {
            id: custId,
            name: cust ? cust.full_name : 'Unknown',
            plan: pkg ? pkg.package_name : 'N/A',
            speed: pkg ? `${pkg.speed_mbps} Mbps` : 'N/A',
            totalGb: Number(uData.total.toFixed(2)),
            avgPeak: Number((uData.peak / (uData.count || 1)).toFixed(2)),
            status: cust ? cust.status : 'N/A',
          };
        })
        .sort((a, b) => b.totalGb - a.totalGb)
        .slice(0, 10);

      return {
        columns: ['Customer ID', 'Subscriber Name', 'Plan Tier', 'Speed', 'Total GB Consumed', 'Avg Peak GB', 'Status'],
        rows: sorted.map(s => [s.id, s.name, s.plan, s.speed, s.totalGb, s.avgPeak, s.status]),
      };
    },
  },
  {
    id: 'unpaid-defaulters',
    title: 'Defaulters Report: Accounts with Overdue Unpaid Bills',
    description: 'Identifies all delinquent accounts with Unpaid or Partial invoices, contact phones, and outstanding debt balance.',
    sql: `SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.phone,
    COUNT(b.bill_id) AS unpaid_bills_count,
    ROUND(SUM(b.total_amount_bdt), 2) AS total_unpaid_amount,
    c.status AS account_status
FROM customers c
JOIN bills b ON c.customer_id = b.customer_id
WHERE b.payment_status IN ('Unpaid', 'Partial')
GROUP BY c.customer_id, c.first_name, c.last_name, c.phone, c.status
HAVING SUM(b.total_amount_bdt) > 2000
ORDER BY total_unpaid_amount DESC;`,
    execute: (db) => {
      const customerMap = new Map(db.customers.map(c => [c.customer_id, c]));
      const unpaidMap = new Map<number, { count: number; total: number }>();

      db.bills.filter(b => b.payment_status === 'Unpaid' || b.payment_status === 'Partial').forEach(b => {
        const curr = unpaidMap.get(b.customer_id) || { count: 0, total: 0 };
        curr.count += 1;
        curr.total += b.total_amount_bdt;
        unpaidMap.set(b.customer_id, curr);
      });

      const rows = Array.from(unpaidMap.entries())
        .filter(([_, d]) => d.total > 2000)
        .map(([custId, d]) => {
          const c = customerMap.get(custId);
          return [
            custId,
            c ? c.full_name : 'Unknown',
            c ? c.phone : 'N/A',
            d.count,
            `৳${d.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            c ? c.status : 'N/A',
          ];
        })
        .sort((a, b) => {
          const numA = parseFloat((a[4] as string).replace(/[^0-9.]/g, ''));
          const numB = parseFloat((b[4] as string).replace(/[^0-9.]/g, ''));
          return numB - numA;
        });

      return {
        columns: ['Customer ID', 'Customer Name', 'Phone Number', 'Unpaid Invoices', 'Total Overdue Debt', 'Account Status'],
        rows,
      };
    },
  },
  {
    id: 'payment-channel-analysis',
    title: 'Financial Realization by Payment Channel & Gateway',
    description: 'Summarizes total transactions, gross collected revenue, and clearing volume across MFS, Cards, and Banks.',
    sql: `SELECT 
    payment_method,
    COUNT(payment_id) AS total_transactions,
    ROUND(SUM(amount_paid_bdt), 2) AS total_cleared_bdt,
    ROUND(AVG(amount_paid_bdt), 2) AS average_voucher_amount,
    ROUND((SUM(amount_paid_bdt) * 100.0 / (SELECT SUM(amount_paid_bdt) FROM payments)), 2) AS revenue_share_pct
FROM payments
GROUP BY payment_method
ORDER BY total_cleared_bdt DESC;`,
    execute: (db) => {
      const breakdown = getPaymentMethodBreakdown(db);
      return {
        columns: ['Payment Channel', 'Total Transactions', 'Gross Cleared BDT', 'Average Voucher BDT', 'Revenue Share %'],
        rows: breakdown.map(b => [
          b.method,
          b.count,
          `৳${b.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `৳${(b.totalAmount / (b.count || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `${b.sharePercentage.toFixed(2)}%`,
        ]),
      };
    },
  },
  {
    id: 'package-profitability',
    title: 'Package Tier Profitability, Subscriptions & ARPU',
    description: 'Evaluates each broadband tier catalog item by subscriber density, monthly MRR run-rate, and bandwidth consumption.',
    sql: `SELECT 
    p.package_id,
    p.package_name,
    p.speed_mbps,
    p.monthly_fee_bdt,
    COUNT(s.subscription_id) AS total_subscribers,
    SUM(CASE WHEN s.status = 'Active' THEN 1 ELSE 0 END) AS active_subscribers,
    ROUND(SUM(CASE WHEN s.status = 'Active' THEN p.monthly_fee_bdt ELSE 0 END), 2) AS monthly_mrr_bdt
FROM packages p
LEFT JOIN subscriptions s ON p.package_id = s.package_id
GROUP BY p.package_id, p.package_name, p.speed_mbps, p.monthly_fee_bdt
ORDER BY monthly_mrr_bdt DESC;`,
    execute: (db) => {
      const analytics = getPackageAnalytics(db);
      return {
        columns: ['Plan ID', 'Plan Name', 'Speed (Mbps)', 'Tariff Rate', 'Total Subs', 'Active Subs', 'Monthly MRR', 'Share %'],
        rows: analytics.map(a => [
          a.package_id,
          a.package_name,
          `${a.speed_mbps} Mbps`,
          `৳${a.monthly_fee_bdt.toLocaleString('en-US')}`,
          a.subscribersCount,
          a.activeSubscribersCount,
          `৳${a.totalMonthlyRevenue.toLocaleString('en-US')}`,
          `${a.sharePercentage.toFixed(1)}%`,
        ]),
      };
    },
  },
  {
    id: 'monthly-collection-efficiency',
    title: 'Monthly Invoicing vs Realized Collection Efficiency',
    description: 'Tracks billed vs cleared funds month-over-month to determine cash conversion and collection leakage.',
    sql: `SELECT 
    b.billing_month,
    COUNT(b.bill_id) AS invoices_issued,
    ROUND(SUM(b.total_amount_bdt), 2) AS total_billed_bdt,
    ROUND(COALESCE(SUM(p.amount_paid_bdt), 0), 2) AS total_collected_bdt,
    ROUND((COALESCE(SUM(p.amount_paid_bdt), 0) * 100.0 / NULLIF(SUM(b.total_amount_bdt), 0)), 2) AS collection_rate_pct
FROM bills b
LEFT JOIN payments p ON b.bill_id = p.bill_id
GROUP BY b.billing_month
ORDER BY b.billing_month ASC;`,
    execute: (db) => {
      const trends = getMonthlyTrends(db);
      return {
        columns: ['Billing Month', 'Invoices Issued', 'Total Invoiced BDT', 'Total Cleared BDT', 'Realization %', 'Unpaid Count'],
        rows: trends.map(t => [
          t.month,
          t.billsCount,
          `৳${t.billed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `৳${t.collected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `${t.billed > 0 ? ((t.collected / t.billed) * 100).toFixed(2) : '0.00'}%`,
          t.unpaidCount,
        ]),
      };
    },
  },
];
