import { TableSchema, Relationship } from '../types/isp';

export const TABLES_SCHEMA: TableSchema[] = [
  {
    name: 'customers',
    primaryKey: 'customer_id',
    description: 'Subscriber master entity storing demographic and account registration records.',
    rowCount: 200,
    columns: [
      { name: 'customer_id', type: 'INT / SERIAL', isPk: true, nullable: false, description: 'Unique identifier for subscriber' },
      { name: 'first_name', type: 'VARCHAR(60)', nullable: false, description: 'Subscriber given name' },
      { name: 'last_name', type: 'VARCHAR(60)', nullable: false, description: 'Subscriber family name' },
      { name: 'phone', type: 'VARCHAR(20)', nullable: false, description: 'Mobile contact number (unique reach)' },
      { name: 'email', type: 'VARCHAR(120)', nullable: false, description: 'Electronic mail address for invoices' },
      { name: 'address', type: 'VARCHAR(255)', nullable: false, description: 'Physical installation address' },
      { name: 'join_date', type: 'DATE', nullable: false, description: 'Account onboard registration date' },
      { name: 'status', type: "ENUM('Active','Suspended','Inactive')", nullable: false, description: 'Current subscriber account lifecycle status' },
    ],
    indexes: [
      'PRIMARY KEY (customer_id)',
      'INDEX idx_customers_phone (phone)',
      'INDEX idx_customers_status (status)',
    ],
  },
  {
    name: 'packages',
    primaryKey: 'package_id',
    description: 'Catalog of broadband bandwidth plans, nominal speeds, and recurring tariffs.',
    rowCount: 8,
    columns: [
      { name: 'package_id', type: 'INT / SERIAL', isPk: true, nullable: false, description: 'Unique broadband plan identifier' },
      { name: 'package_name', type: 'VARCHAR(80)', nullable: false, description: 'Marketing tier label (e.g. Turbo 50, Home 20)' },
      { name: 'speed_mbps', type: 'INT', nullable: false, description: 'Nominal downlink/uplink speed bandwidth in Mbps' },
      { name: 'monthly_fee_bdt', type: 'DECIMAL(10,2)', nullable: false, description: 'Base monthly tariff rate in BDT' },
      { name: 'billing_cycle', type: 'VARCHAR(30)', nullable: false, description: 'Standard billing period (Monthly)' },
      { name: 'status', type: 'VARCHAR(20)', nullable: false, description: 'Catalog availability status (Active/Retired)' },
    ],
    indexes: [
      'PRIMARY KEY (package_id)',
      'INDEX idx_packages_speed (speed_mbps)',
    ],
  },
  {
    name: 'subscriptions',
    primaryKey: 'subscription_id',
    description: 'Associative bridge mapping customers to active broadband packages over contract lifespans.',
    rowCount: 200,
    columns: [
      { name: 'subscription_id', type: 'INT / SERIAL', isPk: true, nullable: false, description: 'Unique subscription line contract ID' },
      { name: 'customer_id', type: 'INT', isFk: true, references: { table: 'customers', column: 'customer_id' }, nullable: false, description: 'Subscriber assigned to this plan' },
      { name: 'package_id', type: 'INT', isFk: true, references: { table: 'packages', column: 'package_id' }, nullable: false, description: 'Internet broadband package provisioned' },
      { name: 'start_date', type: 'DATE', nullable: false, description: 'Service activation date' },
      { name: 'end_date', type: 'DATE', nullable: true, description: 'Contract termination date (NULL if currently active)' },
      { name: 'status', type: "ENUM('Active','Suspended','Terminated')", nullable: false, description: 'Operational service provisioning state' },
    ],
    indexes: [
      'PRIMARY KEY (subscription_id)',
      'FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE',
      'FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE RESTRICT ON UPDATE CASCADE',
      'INDEX idx_subs_customer (customer_id)',
      'INDEX idx_subs_status (status)',
    ],
  },
  {
    name: 'bills',
    primaryKey: 'bill_id',
    description: 'Periodic billing invoices calculated per subscription and calendar cycle with adjustments.',
    rowCount: 1143,
    columns: [
      { name: 'bill_id', type: 'INT / SERIAL', isPk: true, nullable: false, description: 'Unique invoice document number' },
      { name: 'customer_id', type: 'INT', isFk: true, references: { table: 'customers', column: 'customer_id' }, nullable: false, description: 'Customer receiving invoice' },
      { name: 'subscription_id', type: 'INT', isFk: true, references: { table: 'subscriptions', column: 'subscription_id' }, nullable: false, description: 'Specific active subscription line billed' },
      { name: 'billing_month', type: 'VARCHAR(7)', nullable: false, description: 'Service billing period in YYYY-MM format' },
      { name: 'issue_date', type: 'DATE', nullable: false, description: 'Date invoice was generated and delivered' },
      { name: 'due_date', type: 'DATE', nullable: false, description: 'Payment deadline before service interruption' },
      { name: 'base_amount_bdt', type: 'DECIMAL(10,2)', nullable: false, description: 'Standard package subscription fee' },
      { name: 'adjustment_bdt', type: 'DECIMAL(10,2)', nullable: false, description: 'Discounts, overtime fees, or outage credits' },
      { name: 'total_amount_bdt', type: 'DECIMAL(10,2)', nullable: false, description: 'Net payable total: base_amount + adjustment' },
      { name: 'payment_status', type: "ENUM('Paid','Partial','Unpaid')", nullable: false, description: 'Receivable settlement status' },
    ],
    indexes: [
      'PRIMARY KEY (bill_id)',
      'FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE',
      'FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE RESTRICT ON UPDATE CASCADE',
      'INDEX idx_bills_customer (customer_id)',
      'INDEX idx_bills_month (billing_month)',
      'INDEX idx_bills_status (payment_status)',
      'UNIQUE KEY uq_subscription_month (subscription_id, billing_month)',
    ],
  },
  {
    name: 'payments',
    primaryKey: 'payment_id',
    description: 'Financial ledger of transaction receipts credited against monthly billing statements.',
    rowCount: 1009,
    columns: [
      { name: 'payment_id', type: 'INT / SERIAL', isPk: true, nullable: false, description: 'Unique transaction voucher identifier' },
      { name: 'bill_id', type: 'INT', isFk: true, references: { table: 'bills', column: 'bill_id' }, nullable: false, description: 'Invoice bill settled by this payment' },
      { name: 'customer_id', type: 'INT', isFk: true, references: { table: 'customers', column: 'customer_id' }, nullable: false, description: 'Payer account reference' },
      { name: 'payment_date', type: 'DATE', nullable: false, description: 'Timestamp when funds cleared' },
      { name: 'amount_paid_bdt', type: 'DECIMAL(10,2)', nullable: false, description: 'Monetary sum credited in BDT' },
      { name: 'payment_method', type: "ENUM('bKash','Nagad','Bank Transfer','Card','Cash')", nullable: false, description: 'Financial clearing channel used' },
      { name: 'payment_status', type: "ENUM('Completed','Partial')", nullable: false, description: 'Transaction clearing integrity state' },
    ],
    indexes: [
      'PRIMARY KEY (payment_id)',
      'FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE ON UPDATE CASCADE',
      'FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE',
      'INDEX idx_payments_bill (bill_id)',
      'INDEX idx_payments_customer (customer_id)',
      'INDEX idx_payments_method (payment_method)',
    ],
  },
  {
    name: 'usage',
    primaryKey: 'usage_id',
    description: 'Network gateway telemetry aggregates measuring monthly bandwidth consumption per link.',
    rowCount: 1143,
    columns: [
      { name: 'usage_id', type: 'INT / SERIAL', isPk: true, nullable: false, description: 'Unique bandwidth session log ID' },
      { name: 'customer_id', type: 'INT', isFk: true, references: { table: 'customers', column: 'customer_id' }, nullable: false, description: 'Subscriber endpoint' },
      { name: 'subscription_id', type: 'INT', isFk: true, references: { table: 'subscriptions', column: 'subscription_id' }, nullable: false, description: 'Physical connection line' },
      { name: 'usage_month', type: 'VARCHAR(7)', nullable: false, description: 'Measurement cycle in YYYY-MM' },
      { name: 'total_usage_gb', type: 'DECIMAL(10,2)', nullable: false, description: 'Total aggregated download & upload in GB' },
      { name: 'peak_usage_gb', type: 'DECIMAL(10,2)', nullable: false, description: 'Consumption during high congestion hours (6 PM - 12 AM)' },
      { name: 'offpeak_usage_gb', type: 'DECIMAL(10,2)', nullable: false, description: 'Consumption during non-congested hours (12 AM - 6 PM)' },
    ],
    indexes: [
      'PRIMARY KEY (usage_id)',
      'FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE CASCADE ON UPDATE CASCADE',
      'FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE',
      'INDEX idx_usage_customer (customer_id)',
      'INDEX idx_usage_month (usage_month)',
      'UNIQUE KEY uq_subscription_usage_month (subscription_id, usage_month)',
    ],
  },
];

export const RELATIONSHIPS: Relationship[] = [
  {
    fromTable: 'customers',
    fromColumn: 'customer_id',
    toTable: 'subscriptions',
    toColumn: 'customer_id',
    type: '1:N',
    description: 'One customer can have multiple subscriptions over time or across multiple premises.',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  {
    fromTable: 'packages',
    fromColumn: 'package_id',
    toTable: 'subscriptions',
    toColumn: 'package_id',
    type: '1:N',
    description: 'One internet package plan is subscribed to by many customer subscriptions.',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  {
    fromTable: 'customers',
    fromColumn: 'customer_id',
    toTable: 'bills',
    toColumn: 'customer_id',
    type: '1:N',
    description: 'One customer receives recurring monthly invoices across their subscription lifetime.',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  {
    fromTable: 'subscriptions',
    fromColumn: 'subscription_id',
    toTable: 'bills',
    toColumn: 'subscription_id',
    type: '1:N',
    description: 'Each subscription line generates one billing invoice document per calendar month.',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  {
    fromTable: 'bills',
    fromColumn: 'bill_id',
    toTable: 'payments',
    toColumn: 'bill_id',
    type: '1:N',
    description: 'One bill can be settled in full with one payment or incrementally via installment payments.',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    fromTable: 'customers',
    fromColumn: 'customer_id',
    toTable: 'payments',
    toColumn: 'customer_id',
    type: '1:N',
    description: 'A customer executes financial clearing transactions for their account.',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  {
    fromTable: 'subscriptions',
    fromColumn: 'subscription_id',
    toTable: 'usage',
    toColumn: 'subscription_id',
    type: '1:N',
    description: 'Each subscription records network gateway traffic volume per billing month.',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
];

export const NORMALIZATION_REPORT = {
  title: 'Relational Database Normalization Analysis (MPMIS-514 Standard)',
  summary: 'The schema is structured in Third Normal Form (3NF) and complies with Boyce-Codd Normal Form (BCNF) requirements.',
  stages: [
    {
      form: '1NF (First Normal Form)',
      status: 'Satisfied',
      criteria: 'All attributes contain atomic values; each column holds single, non-repeating data; a primary key exists for every relation.',
      details: [
        'Phone, email, and address fields are atomic scalar values with no multi-valued arrays.',
        'No repeating groups (e.g. rather than month1_bill, month2_bill, bills are normalized into independent rows).',
        'Unique artificial primary keys (customer_id, package_id, subscription_id, bill_id, payment_id, usage_id) guarantee unique tuple identification.',
      ],
    },
    {
      form: '2NF (Second Normal Form)',
      status: 'Satisfied',
      criteria: 'In 1NF and every non-key attribute is fully functionally dependent on the primary key (no partial key dependencies).',
      details: [
        'All tables employ single-column surrogate primary keys, automatically preventing partial dependencies.',
        'In associative entities (subscriptions, bills, usage), attributes like base_amount_bdt, payment_date, and total_usage_gb depend on the surrogate key rather than a composite key.',
      ],
    },
    {
      form: '3NF (Third Normal Form)',
      status: 'Satisfied',
      criteria: 'In 2NF and no transitive dependencies exist (non-prime attributes must depend solely on the candidate key).',
      details: [
        'Package attributes (speed_mbps, monthly_fee_bdt) are strictly segregated into the Packages entity; Subscriptions only stores package_id, eliminating redundancy and update anomalies.',
        'Bills stores base_amount_bdt snapshot and adjustment_bdt to preserve historical billing integrity against future package price changes.',
        'Payments are decoupled from subscriptions and linked directly to bill_id.',
      ],
    },
    {
      form: 'BCNF (Boyce-Codd Normal Form)',
      status: 'Satisfied',
      criteria: 'For every functional dependency X → Y, X is a superkey.',
      details: [
        'Composite unique constraints (subscription_id, billing_month) on Bills and Usage ensure strict 1-bill-per-month and 1-usage-per-month invariants.',
        'All determinants are candidate keys or superkeys across all 6 relations.',
      ],
    },
  ],
};

export const POSTGRES_DDL = `-- ====================================================================
-- ISP Billing System - PostgreSQL DDL Schema
-- Academic Reference: MPMIS-514 Relational Database Design
-- Database: PostgreSQL 14+ / Cloud SQL for PostgreSQL
-- ====================================================================

-- 1. Create Enums
CREATE TYPE customer_status_enum AS ENUM ('Active', 'Suspended', 'Inactive');
CREATE TYPE subscription_status_enum AS ENUM ('Active', 'Suspended', 'Terminated');
CREATE TYPE bill_payment_status_enum AS ENUM ('Paid', 'Partial', 'Unpaid');
CREATE TYPE payment_method_enum AS ENUM ('bKash', 'Nagad', 'Bank Transfer', 'Card', 'Cash');
CREATE TYPE payment_status_enum AS ENUM ('Completed', 'Partial');

-- 2. Customers Table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status customer_status_enum NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_status ON customers(status);

-- 3. Packages Table
CREATE TABLE packages (
    package_id SERIAL PRIMARY KEY,
    package_name VARCHAR(80) NOT NULL UNIQUE,
    speed_mbps INT NOT NULL CHECK (speed_mbps > 0),
    monthly_fee_bdt NUMERIC(10, 2) NOT NULL CHECK (monthly_fee_bdt >= 0),
    billing_cycle VARCHAR(30) NOT NULL DEFAULT 'Monthly',
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

-- 4. Subscriptions Table
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    package_id INT NOT NULL REFERENCES packages(package_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status subscription_status_enum NOT NULL DEFAULT 'Active',
    CONSTRAINT chk_subscription_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_subs_customer ON subscriptions(customer_id);
CREATE INDEX idx_subs_package ON subscriptions(package_id);
CREATE INDEX idx_subs_status ON subscriptions(status);

-- 5. Bills Table
CREATE TABLE bills (
    bill_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    subscription_id INT NOT NULL REFERENCES subscriptions(subscription_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    billing_month VARCHAR(7) NOT NULL CHECK (billing_month ~ '^\\d{4}-\\d{2}$'),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    base_amount_bdt NUMERIC(10, 2) NOT NULL CHECK (base_amount_bdt >= 0),
    adjustment_bdt NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount_bdt NUMERIC(10, 2) NOT NULL CHECK (total_amount_bdt >= 0),
    payment_status bill_payment_status_enum NOT NULL DEFAULT 'Unpaid',
    CONSTRAINT uq_subscription_month UNIQUE (subscription_id, billing_month),
    CONSTRAINT chk_bill_dates CHECK (due_date >= issue_date)
);

CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_month ON bills(billing_month);
CREATE INDEX idx_bills_status ON bills(payment_status);

-- 6. Payments Table
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    bill_id INT NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE ON UPDATE CASCADE,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_paid_bdt NUMERIC(10, 2) NOT NULL CHECK (amount_paid_bdt > 0),
    payment_method payment_method_enum NOT NULL,
    payment_status payment_status_enum NOT NULL DEFAULT 'Completed'
);

CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- 7. Usage Table
CREATE TABLE usage (
    usage_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    subscription_id INT NOT NULL REFERENCES subscriptions(subscription_id) ON DELETE CASCADE ON UPDATE CASCADE,
    usage_month VARCHAR(7) NOT NULL CHECK (usage_month ~ '^\\d{4}-\\d{2}$'),
    total_usage_gb NUMERIC(10, 2) NOT NULL CHECK (total_usage_gb >= 0),
    peak_usage_gb NUMERIC(10, 2) NOT NULL CHECK (peak_usage_gb >= 0),
    offpeak_usage_gb NUMERIC(10, 2) NOT NULL CHECK (offpeak_usage_gb >= 0),
    CONSTRAINT uq_subscription_usage_month UNIQUE (subscription_id, usage_month),
    CONSTRAINT chk_usage_sum CHECK (total_usage_gb >= peak_usage_gb)
);

CREATE INDEX idx_usage_customer ON usage(customer_id);
CREATE INDEX idx_usage_month ON usage(usage_month);
`;

export const MYSQL_DDL = `-- ====================================================================
-- ISP Billing System - MySQL 8.0 DDL Schema
-- Engine: InnoDB | Character Set: utf8mb4
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments, usage_records, bills, subscriptions, packages, customers;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL,
    status ENUM('Active','Suspended','Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE packages (
    package_id INT AUTO_INCREMENT PRIMARY KEY,
    package_name VARCHAR(80) NOT NULL UNIQUE,
    speed_mbps INT NOT NULL,
    monthly_fee_bdt DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(30) NOT NULL DEFAULT 'Monthly',
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    package_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status ENUM('Active','Suspended','Terminated') NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_sub_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sub_package FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_sub_customer (customer_id),
    INDEX idx_sub_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    subscription_id INT NOT NULL,
    billing_month VARCHAR(7) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    base_amount_bdt DECIMAL(10,2) NOT NULL,
    adjustment_bdt DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount_bdt DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Paid','Partial','Unpaid') NOT NULL DEFAULT 'Unpaid',
    CONSTRAINT fk_bill_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bill_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_sub_month (subscription_id, billing_month),
    INDEX idx_bill_month (billing_month),
    INDEX idx_bill_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    customer_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount_paid_bdt DECIMAL(10,2) NOT NULL,
    payment_method ENUM('bKash','Nagad','Bank Transfer','Card','Cash') NOT NULL,
    payment_status ENUM('Completed','Partial') NOT NULL DEFAULT 'Completed',
    CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usage_records (
    usage_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    subscription_id INT NOT NULL,
    usage_month VARCHAR(7) NOT NULL,
    total_usage_gb DECIMAL(10,2) NOT NULL,
    peak_usage_gb DECIMAL(10,2) NOT NULL,
    offpeak_usage_gb DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_usage_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_usage_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_sub_usage_month (subscription_id, usage_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const PRISMA_SCHEMA = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum CustomerStatus {
  Active
  Suspended
  Inactive
}

enum SubscriptionStatus {
  Active
  Suspended
  Terminated
}

enum BillPaymentStatus {
  Paid
  Partial
  Unpaid
}

enum PaymentMethod {
  bKash
  Nagad
  Bank_Transfer @map("Bank Transfer")
  Card
  Cash
}

enum PaymentStatus {
  Completed
  Partial
}

model Customer {
  customerId     Int            @id @default(autoincrement()) @map("customer_id")
  firstName      String         @map("first_name") @db.VarChar(60)
  lastName       String         @map("last_name") @db.VarChar(60)
  phone          String         @unique @db.VarChar(20)
  email          String         @db.VarChar(120)
  address        String         @db.VarChar(255)
  joinDate       DateTime       @map("join_date") @db.Date
  status         CustomerStatus @default(Active)

  subscriptions  Subscription[]
  bills          Bill[]
  payments       Payment[]
  usageRecords   Usage[]

  @@map("customers")
}

model Package {
  packageId      Int            @id @default(autoincrement()) @map("package_id")
  packageName    String         @unique @map("package_name") @db.VarChar(80)
  speedMbps      Int            @map("speed_mbps")
  monthlyFeeBdt  Decimal        @map("monthly_fee_bdt") @db.Decimal(10, 2)
  billingCycle   String         @default("Monthly") @map("billing_cycle") @db.VarChar(30)
  status         String         @default("Active") @db.VarChar(20)

  subscriptions  Subscription[]

  @@map("packages")
}

model Subscription {
  subscriptionId Int                @id @default(autoincrement()) @map("subscription_id")
  customerId     Int                @map("customer_id")
  packageId      Int                @map("package_id")
  startDate      DateTime           @map("start_date") @db.Date
  endDate        DateTime?          @map("end_date") @db.Date
  status         SubscriptionStatus @default(Active)

  customer       Customer           @relation(fields: [customerId], references: [customerId], onDelete: Restrict)
  package        Package            @relation(fields: [packageId], references: [packageId], onDelete: Restrict)
  bills          Bill[]
  usageRecords   Usage[]

  @@map("subscriptions")
}

model Bill {
  billId         Int               @id @default(autoincrement()) @map("bill_id")
  customerId     Int               @map("customer_id")
  subscriptionId Int               @map("subscription_id")
  billingMonth   String            @map("billing_month") @db.VarChar(7)
  issueDate      DateTime          @map("issue_date") @db.Date
  dueDate        DateTime          @map("due_date") @db.Date
  baseAmountBdt  Decimal           @map("base_amount_bdt") @db.Decimal(10, 2)
  adjustmentBdt  Decimal           @default(0.00) @map("adjustment_bdt") @db.Decimal(10, 2)
  totalAmountBdt Decimal           @map("total_amount_bdt") @db.Decimal(10, 2)
  paymentStatus  BillPaymentStatus @default(Unpaid) @map("payment_status")

  customer       Customer          @relation(fields: [customerId], references: [customerId], onDelete: Restrict)
  subscription   Subscription      @relation(fields: [subscriptionId], references: [subscriptionId], onDelete: Restrict)
  payments       Payment[]

  @@unique([subscriptionId, billingMonth])
  @@map("bills")
}

model Payment {
  paymentId      Int           @id @default(autoincrement()) @map("payment_id")
  billId         Int           @map("bill_id")
  customerId     Int           @map("customer_id")
  paymentDate    DateTime      @map("payment_date") @db.Date
  amountPaidBdt  Decimal       @map("amount_paid_bdt") @db.Decimal(10, 2)
  paymentMethod  PaymentMethod @map("payment_method")
  paymentStatus  PaymentStatus @default(Completed) @map("payment_status")

  bill           Bill          @relation(fields: [billId], references: [billId], onDelete: Cascade)
  customer       Customer      @relation(fields: [customerId], references: [customerId], onDelete: Restrict)

  @@map("payments")
}

model Usage {
  usageId         Int          @id @default(autoincrement()) @map("usage_id")
  customerId      Int          @map("customer_id")
  subscriptionId  Int          @map("subscription_id")
  usageMonth      String       @map("usage_month") @db.VarChar(7)
  totalUsageGb    Decimal      @map("total_usage_gb") @db.Decimal(10, 2)
  peakUsageGb     Decimal      @map("peak_usage_gb") @db.Decimal(10, 2)
  offpeakUsageGb  Decimal      @map("offpeak_usage_gb") @db.Decimal(10, 2)

  customer        Customer     @relation(fields: [customerId], references: [customerId], onDelete: Restrict)
  subscription    Subscription @relation(fields: [subscriptionId], references: [subscriptionId], onDelete: Cascade)

  @@unique([subscriptionId, usageMonth])
  @@map("usage")
}
`;
