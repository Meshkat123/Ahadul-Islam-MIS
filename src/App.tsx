import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { InteractiveERD } from './components/InteractiveERD';
import { CustomersView } from './components/CustomersView';
import { BillsView } from './components/BillsView';
import { PaymentsView } from './components/PaymentsView';
import { UsageView } from './components/UsageView';
import { PackagesView } from './components/PackagesView';
import { SqlConsole } from './components/SqlConsole';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { ispDb, getCustomer360 } from './utils/analytics';

export type ActiveView = 
  | 'overview' 
  | 'erd' 
  | 'customers' 
  | 'bills' 
  | 'payments' 
  | 'usage' 
  | 'packages' 
  | 'sql';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isp_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('isp_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('isp_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const customer360Data = selectedCustomerId ? getCustomer360(selectedCustomerId, ispDb) : null;

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar 
        activeView={activeView}
        onNavigate={setActiveView}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenRandomCustomer={() => {
          const randomCust = ispDb.customers[Math.floor(Math.random() * ispDb.customers.length)];
          handleSelectCustomer(randomCust.customer_id);
        }}
      />

      <div className="flex-1 flex max-w-(--breakpoint-2xl) w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeView={activeView}
          onSelectView={setActiveView}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeView === 'overview' && (
            <OverviewDashboard 
              onSelectCustomer={handleSelectCustomer}
              onNavigateToView={setActiveView}
            />
          )}

          {activeView === 'erd' && (
            <InteractiveERD />
          )}

          {activeView === 'customers' && (
            <CustomersView 
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {activeView === 'bills' && (
            <BillsView 
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {activeView === 'payments' && (
            <PaymentsView 
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {activeView === 'usage' && (
            <UsageView 
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {activeView === 'packages' && (
            <PackagesView 
              onNavigateToCustomers={() => setActiveView('customers')}
            />
          )}

          {activeView === 'sql' && (
            <SqlConsole />
          )}
        </main>
      </div>

      {/* Customer 360 Slide-over Drawer */}
      <CustomerDetailDrawer 
        customerData={customer360Data}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSelectCustomer={handleSelectCustomer}
      />
    </div>
  );
}
