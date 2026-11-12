import React from 'react';
import { Database, Moon, Sun, Download, Table2, Layers, Cpu, Sparkles, UserCheck } from 'lucide-react';
import { KpiSummary, computeKpis, ispDb } from '../utils/analytics';
import { formatBDT } from '../utils/formatters';
import { POSTGRES_DDL } from '../data/dbSchema';

interface NavbarProps {
  kpis?: KpiSummary;
  darkMode: boolean;
  setDarkMode?: (val: boolean) => void;
  onToggleDarkMode?: () => void;
  activeView: string;
  onNavigate?: (view: any) => void;
  onExportSql?: () => void;
  onOpenRandomCustomer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  kpis = computeKpis(ispDb),
  darkMode,
  setDarkMode,
  onToggleDarkMode,
  activeView,
  onNavigate,
  onExportSql,
  onOpenRandomCustomer,
}) => {
  const handleToggleTheme = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    } else if (setDarkMode) {
      setDarkMode(!darkMode);
    }
  };

  const handleExportSqlFile = () => {
    if (onExportSql) {
      onExportSql();
      return;
    }
    const blob = new Blob([POSTGRES_DDL], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'isp_billing_schema_postgresql.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'overview':
        return 'Executive Overview & Billing Analytics';
      case 'erd':
        return 'Relational Database Schema & ERD Architecture';
      case 'customers':
        return 'Subscriber Master Directory & 360 Profiles';
      case 'bills':
        return 'Billing Statements & Receivable Invoices';
      case 'payments':
        return 'Payment Transactions & Cash Clearance';
      case 'usage':
        return 'Network Bandwidth Telemetry & Usage Logs';
      case 'packages':
        return 'Broadband Tariff Catalog & Plan Matrix';
      case 'sql':
        return 'SQL Analytical Query Console';
      default:
        return 'ISP Billing Management';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div 
          onClick={() => onNavigate && onNavigate('overview')}
          className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs cursor-pointer hover:bg-emerald-500 transition-colors"
        >
          <Database className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span 
              onClick={() => onNavigate && onNavigate('overview')}
              className="font-bold text-base tracking-tight text-slate-900 dark:text-white cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              ApexNet Billing System
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
              MPMIS-514
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Relational DB Engine · 3NF Normalized · 3,695 Records
          </span>
        </div>
      </div>

      {/* Zone 2: Contextual Navigation & Live Statistics */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-slate-900 dark:text-white">{getViewTitle()}</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div>
            <span className="text-slate-400">Active Subs:</span>{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{kpis.activeCustomers}</span>
            <span className="text-slate-400">/200</span>
          </div>
          <div>
            <span className="text-slate-400">Collection Rate:</span>{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {kpis.collectionRate.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400">Total Billed:</span>{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatBDT(kpis.totalBilled)}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 3: Actions & Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onOpenRandomCustomer && (
          <button
            onClick={onOpenRandomCustomer}
            title="Random Customer 360 Preview"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sample 360</span>
          </button>
        )}

        <button
          onClick={handleExportSqlFile}
          title="Export PostgreSQL DDL Script"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-700"
        >
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Export SQL DDL</span>
          <span className="sm:hidden">DDL</span>
        </button>

        <button
          onClick={handleToggleTheme}
          aria-label="Toggle Color Theme"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
