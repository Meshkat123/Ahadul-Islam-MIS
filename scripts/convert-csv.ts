import fs from 'fs';
import path from 'path';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    return row;
  });
}

function parseCurrency(val: string): number {
  if (!val) return 0;
  // Handle "-₨50.00", "₨2,200.00", "₨0.00", etc.
  const isNegative = val.includes('-');
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned) || 0;
  return isNegative ? -num : num;
}

const assetsDir = path.resolve('public/assets/aistudio');

const customersRaw = fs.readFileSync(path.join(assetsDir, 'ISP_Billing_System_Large_Sample_Data-Customers_888d3778.csv'), 'utf-8');
const packagesRaw = fs.readFileSync(path.join(assetsDir, 'ISP_Billing_System_Large_Sample_Data-Packages_5366d5e5.csv'), 'utf-8');
const subscriptionsRaw = fs.readFileSync(path.join(assetsDir, 'ISP_Billing_System_Large_Sample_Data-Subscriptions_4b06ab24.csv'), 'utf-8');
const billsRaw = fs.readFileSync(path.join(assetsDir, 'ISP_Billing_System_Large_Sample_Data-Bills_8fdc26e1.csv'), 'utf-8');
const paymentsRaw = fs.readFileSync(path.join(assetsDir, 'ISP_Billing_System_Large_Sample_Data-Payments_a1654d4a.csv'), 'utf-8');
const usageRaw = fs.readFileSync(path.join(assetsDir, 'ISP_Billing_System_Large_Sample_Data-Usage_22c818b0.csv'), 'utf-8');

const customers = parseCSV(customersRaw).map(c => ({
  customer_id: parseInt(c.customer_id, 10),
  first_name: c.first_name,
  last_name: c.last_name,
  full_name: `${c.first_name} ${c.last_name}`,
  phone: c.phone,
  email: c.email,
  address: c.address,
  join_date: c.join_date,
  status: c.status as 'Active' | 'Suspended' | 'Inactive',
}));

const packages = parseCSV(packagesRaw).map(p => ({
  package_id: parseInt(p.package_id, 10),
  package_name: p.package_name,
  speed_mbps: parseInt(p.speed_mbps, 10),
  monthly_fee_bdt: parseCurrency(p.monthly_fee_bdt),
  billing_cycle: p.billing_cycle,
  status: p.status,
}));

const subscriptions = parseCSV(subscriptionsRaw).map(s => ({
  subscription_id: parseInt(s.subscription_id, 10),
  customer_id: parseInt(s.customer_id, 10),
  package_id: parseInt(s.package_id, 10),
  start_date: s.start_date,
  end_date: s.end_date || null,
  status: s.status as 'Active' | 'Suspended' | 'Terminated',
}));

const bills = parseCSV(billsRaw).map(b => ({
  bill_id: parseInt(b.bill_id, 10),
  customer_id: parseInt(b.customer_id, 10),
  subscription_id: parseInt(b.subscription_id, 10),
  billing_month: b.billing_month,
  issue_date: b.issue_date,
  due_date: b.due_date,
  base_amount_bdt: parseCurrency(b.base_amount_bdt),
  adjustment_bdt: parseCurrency(b.adjustment_bdt),
  total_amount_bdt: parseCurrency(b.total_amount_bdt),
  payment_status: b.payment_status as 'Paid' | 'Partial' | 'Unpaid',
}));

const payments = parseCSV(paymentsRaw).map(p => ({
  payment_id: parseInt(p.payment_id, 10),
  bill_id: parseInt(p.bill_id, 10),
  customer_id: parseInt(p.customer_id, 10),
  payment_date: p.payment_date,
  amount_paid_bdt: parseCurrency(p.amount_paid_bdt),
  payment_method: p.payment_method as 'bKash' | 'Nagad' | 'Bank Transfer' | 'Card' | 'Cash',
  payment_status: p.payment_status as 'Completed' | 'Partial',
}));

const usage = parseCSV(usageRaw).map(u => ({
  usage_id: parseInt(u.usage_id, 10),
  customer_id: parseInt(u.customer_id, 10),
  subscription_id: parseInt(u.subscription_id, 10),
  usage_month: u.usage_month,
  total_usage_gb: parseFloat(u.total_usage_gb) || 0,
  peak_usage_gb: parseFloat(u.peak_usage_gb) || 0,
  offpeak_usage_gb: parseFloat(u.offpeak_usage_gb) || 0,
}));

const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalCustomers: customers.length,
    totalPackages: packages.length,
    totalSubscriptions: subscriptions.length,
    totalBills: bills.length,
    totalPayments: payments.length,
    totalUsageRecords: usage.length,
  },
  customers,
  packages,
  subscriptions,
  bills,
  payments,
  usage,
};

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/ispData.json', JSON.stringify(output, null, 2), 'utf-8');
console.log('Conversion successful:', output.metadata);
