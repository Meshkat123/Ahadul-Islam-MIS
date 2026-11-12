export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  join_date: string;
  status: 'Active' | 'Suspended' | 'Inactive';
}

export interface Package {
  package_id: number;
  package_name: string;
  speed_mbps: number;
  monthly_fee_bdt: number;
  billing_cycle: string;
  status: string;
}

export interface Subscription {
  subscription_id: number;
  customer_id: number;
  package_id: number;
  start_date: string;
  end_date: string | null;
  status: 'Active' | 'Suspended' | 'Terminated';
}

export interface Bill {
  bill_id: number;
  customer_id: number;
  subscription_id: number;
  billing_month: string;
  issue_date: string;
  due_date: string;
  base_amount_bdt: number;
  adjustment_bdt: number;
  total_amount_bdt: number;
  payment_status: 'Paid' | 'Partial' | 'Unpaid';
}

export interface Payment {
  payment_id: number;
  bill_id: number;
  customer_id: number;
  payment_date: string;
  amount_paid_bdt: number;
  payment_method: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Card' | 'Cash';
  payment_status: 'Completed' | 'Partial';
}

export interface UsageRecord {
  usage_id: number;
  customer_id: number;
  subscription_id: number;
  usage_month: string;
  total_usage_gb: number;
  peak_usage_gb: number;
  offpeak_usage_gb: number;
}

export interface IspDatabase {
  metadata: {
    generatedAt: string;
    totalCustomers: number;
    totalPackages: number;
    totalSubscriptions: number;
    totalBills: number;
    totalPayments: number;
    totalUsageRecords: number;
  };
  customers: Customer[];
  packages: Package[];
  subscriptions: Subscription[];
  bills: Bill[];
  payments: Payment[];
  usage: UsageRecord[];
}

export interface TableColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  references?: {
    table: string;
    column: string;
  };
  nullable: boolean;
  description: string;
}

export interface TableSchema {
  name: string;
  primaryKey: string;
  description: string;
  rowCount: number;
  columns: TableColumn[];
  indexes: string[];
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: '1:N' | '1:1' | 'N:M';
  description: string;
  onDelete: 'RESTRICT' | 'CASCADE' | 'SET NULL';
  onUpdate: 'CASCADE' | 'RESTRICT';
}
