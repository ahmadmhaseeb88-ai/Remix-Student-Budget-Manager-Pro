/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Transaction } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { QuickAddModal } from './components/QuickAddModal';
import { VoiceExpenseModal } from './components/VoiceExpenseModal';

import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { SemesterPlannerView } from './views/SemesterPlannerView';
import { SavingsGoalsView } from './views/SavingsGoalsView';
import { CamScannerView } from './views/CamScannerView';
import { AiCoachView } from './views/AiCoachView';
import { BillsRemindersView } from './views/BillsRemindersView';
import { ReportsView } from './views/ReportsView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { AdminView } from './views/AdminView';
import { SettingsView } from './views/SettingsView';
import { SmsSyncView } from './views/SmsSyncView';
import { FamilySharingView } from './views/FamilySharingView';

import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const [user, setUser] = useState<User | null>(() => api.getCachedUser());
  const [activeView, setActiveView] = useState<string>(() => (api.getCachedUser() ? 'dashboard' : 'landing'));
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'expense' | 'income'>('expense');
  const [quickAddPrefill, setQuickAddPrefill] = useState<Partial<Transaction> | undefined>(undefined);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Verify auth session and handle direct login/register/view URLs on mount
  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    const viewParam = params.get('view');

    const knownViews = new Set([
      'dashboard',
      'transactions',
      'budgets',
      'semester',
      'goals',
      'family',
      'camscanner',
      'sms',
      'coach',
      'bills',
      'reports',
      'subscriptions',
      'admin',
      'settings',
    ]);

    const normalizedPathView = pathname.replace(/^\//, '');
    const requestedAuthMode =
      authParam === 'register' || pathname === '/register' || pathname === '/signup' || pathname === '/auth/register'
        ? 'register'
        : authParam === 'login' || pathname === '/login' || pathname === '/signin' || pathname === '/auth/login'
        ? 'login'
        : null;

    if (pathname !== '/' || authParam || viewParam) {
      window.history.replaceState({}, '', '/');
    }

    if (api.getToken()) {
      api
        .getMe()
        .then((res) => {
          setUser(res.user);
          if (viewParam && knownViews.has(viewParam)) {
            setActiveView(viewParam);
          } else if (knownViews.has(normalizedPathView)) {
            setActiveView(normalizedPathView);
          } else if (activeView === 'landing') {
            setActiveView('dashboard');
          }
        })
        .catch(() => {
          api.clearAuth();
          setUser(null);
          setActiveView('landing');
          if (requestedAuthMode) {
            setAuthModalMode(requestedAuthMode);
            setAuthModalOpen(true);
          }
        });
    } else if (requestedAuthMode) {
      setAuthModalMode(requestedAuthMode);
      setAuthModalOpen(true);
    } else if (knownViews.has(normalizedPathView) || (viewParam && knownViews.has(viewParam))) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveView('dashboard');
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    api.clearAuth();
    setUser(null);
    setActiveView('landing');
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleExploreDemo = async () => {
    try {
      const res = await api.login({
        email: 'ahmadmhaseeb88@gmail.com',
        password: '11223344',
      });
      handleAuthSuccess(res.user);
    } catch {
      try {
        const res2 = await api.login({
          email: 'haseeb@gmail.com',
          password: '11223344',
        });
        handleAuthSuccess(res2.user);
      } catch {
        try {
          const res3 = await api.login({
            email: 'student@fast.edu.pk',
            password: 'student123',
          });
          handleAuthSuccess(res3.user);
        } catch {
          handleOpenAuth('login');
        }
      }
    }
  };

  const handleOpenQuickAdd = (type: 'expense' | 'income' = 'expense', prefill?: Partial<Transaction>) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setQuickAddType(type);
    setQuickAddPrefill(prefill);
    setQuickAddModalOpen(true);
  };

  const handleOpenVoice = () => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setVoiceModalOpen(true);
  };

  const handleOpenScanner = () => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setActiveView('camscanner');
  };

  const handleTransactionCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleConvertToTransactionFromScanner = (draft: Partial<Transaction>) => {
    handleOpenQuickAdd('expense', draft);
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'expense')}
        onOpenVoice={handleOpenVoice}
        onOpenScanner={handleOpenScanner}
        onNavigate={(v) => setActiveView(v)}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        activeView={activeView}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (Rendered if user is logged in) */}
        {user && (
          <Sidebar
            activeView={activeView}
            onNavigate={(v) => setActiveView(v)}
            user={user}
          />
        )}

        {/* Primary Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {!user || activeView === 'landing' ? (
            <LandingView
              onOpenAuth={handleOpenAuth}
              onExploreDemo={handleExploreDemo}
            />
          ) : activeView === 'dashboard' ? (
            <DashboardView
              key={refreshKey}
              user={user}
              onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'expense')}
              onOpenVoice={handleOpenVoice}
              onOpenScanner={handleOpenScanner}
              onNavigate={(v) => setActiveView(v)}
            />
          ) : activeView === 'transactions' ? (
            <TransactionsView
              key={refreshKey}
              user={user}
              onOpenQuickAdd={(type) => handleOpenQuickAdd(type || 'expense')}
              onOpenScanner={handleOpenScanner}
            />
          ) : activeView === 'budgets' ? (
            <BudgetsView user={user} />
          ) : activeView === 'semester' ? (
            <SemesterPlannerView user={user} />
          ) : activeView === 'goals' ? (
            <SavingsGoalsView user={user} />
          ) : activeView === 'family' ? (
            <FamilySharingView
              user={user}
              onDataChanged={() => setRefreshKey((k) => k + 1)}
            />
          ) : activeView === 'camscanner' ? (
            <CamScannerView
              user={user}
              onConvertToTransaction={handleConvertToTransactionFromScanner}
            />
          ) : activeView === 'sms' ? (
            <SmsSyncView
              user={user}
              onRefreshUserData={() => setRefreshKey((k) => k + 1)}
            />
          ) : activeView === 'coach' ? (
            <AiCoachView user={user} />
          ) : activeView === 'bills' ? (
            <BillsRemindersView user={user} />
          ) : activeView === 'reports' ? (
            <ReportsView user={user} />
          ) : activeView === 'subscriptions' ? (
            <SubscriptionsView
              user={user}
              onPlanUpdated={(newPlan) => setUser({ ...user, plan: newPlan })}
            />
          ) : activeView === 'admin' ? (
            <AdminView user={user} />
          ) : activeView === 'settings' ? (
            <SettingsView
              user={user}
              onUserUpdated={(u) => setUser(u)}
              onLogout={handleLogout}
            />
          ) : null}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      <QuickAddModal
        isOpen={quickAddModalOpen}
        onClose={() => setQuickAddModalOpen(false)}
        onSuccess={handleTransactionCreated}
        initialType={quickAddType}
        currency={user?.currency || 'PKR'}
        prefill={quickAddPrefill}
      />

      <VoiceExpenseModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSuccess={handleTransactionCreated}
        currency={user?.currency || 'PKR'}
      />
    </div>
    </LanguageProvider>
  );
}
