import React from 'react';
import {
  LayoutDashboard,
  Network,
  Users,
  Receipt,
  CreditCard,
  Activity,
  Package,
  Terminal,
  ShieldCheck,
  HardDriveDownload,
  Info,
} from 'lucide-react';
import { IspDatabase } from '../types/isp';
import { ispDb } from '../utils/analytics';

interface SidebarProps {
  activeView: string;
  setActiveView?: (view: any) => void;
  onSelectView?: (view: any) => void;
  db?: IspDatabase;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  onSelectView, 
  db = ispDb 
}) => {
  const handleNav = (viewId: any) => {
    if (onSelectView) {
      onSelectView(viewId);
    } else if (setActiveView) {
      setActiveView(viewId);
    }
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Executive Dashboard',
      badge: 'KPIs',
      icon: LayoutDashboard,
      description: 'Revenue, collection, and churn metrics',
    },
    {
      id: 'erd',
      label: 'Database Design & ERD',
      badge: '3NF',
      icon: Network,
      description: 'Interactive ERD, schemas & DDL',
      highlight: true,
    },
    {
      id: 'customers',
      label: 'Subscribers Directory',
      badge: `${db.customers.length}`,
      icon: Users,
      description: 'Customer master & 360 drawers',
    },
    {
      id: 'bills',
      label: 'Billing Statements',
      badge: `${db.bills.length}`,
      icon: Receipt,
      description: 'Monthly invoices & receivables',
    },
    {
      id: 'payments',
      label: 'Payments & Clearance',
      badge: `${db.payments.length}`,
      icon: CreditCard,
      description: 'MFS, card & bank transactions',
    },
    {
      id: 'usage',
      label: 'Bandwidth & Usage',
      badge: `${db.usage.length}`,
      icon: Activity,
      description: 'Peak vs off-peak consumption',
    },
    {
      id: 'packages',
      label: 'Broadband Packages',
      badge: `${db.packages.length}`,
      icon: Package,
      description: 'Tariffs, speeds & subscribers',
    },
    {
      id: 'sql',
      label: 'SQL Query Console',
      badge: 'Playground',
      icon: Terminal,
      description: 'Interactive analytical queries',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none hidden md:flex">
      <div className="p-4 flex flex-col gap-6 overflow-y-auto">
        {/* Navigation items */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            ISP Operations
          </div>
          {navItems.slice(0, 1).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-700/80 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Database Architecture Section */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Relational Architecture
          </div>
          {navItems.slice(1, 2).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-950 dark:text-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  <span className="truncate font-semibold">{item.label}</span>
                </div>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Operational Records */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Operational Entities
          </div>
          {navItems.slice(2, 7).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-emerald-700/80 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Query Engine */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            SQL & Reporting
          </div>
          {navItems.slice(7).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-emerald-700/80 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Database Status footer card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Database Integrity</span>
            </span>
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
              3NF / BCNF
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Relations: 6</span>
            <span>Tuples: 3,695</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/60 pt-1.5 mt-0.5">
            Foreign keys & cascades enforced
          </div>
        </div>
      </div>
    </aside>
  );
};
