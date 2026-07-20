// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState, useEffect, useRef } from 'react';
import { TabView, Category, Transaction, Family, Currency, AppNotification, UserProfile, TransactionRequest } from './types';
import * as storage from './services/storageService';
import * as authService from './services/authService';
import { checkNotifications } from './services/notificationService';
import { generateAndSaveDailyPosts } from './services/geminiService';
import { showAlert } from './services/alertService';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import CategoryManager from './components/CategoryManager';
import FamilyManager from './components/FamilyManager';
import TransactionForm from './components/TransactionForm';
import LendingManager from './components/LendingManager';
import SavingManager from './components/SavingManager';
import BudgetManager from './components/BudgetManager';
import CryptoManager from './components/CryptoManager';
import CommunityHub from './components/CommunityHub';
import LoginScreen from './components/LoginScreen';
import HowToGuide from './components/HowToGuide';
import CommunityLicense from './components/CommunityLicense';
import AdminDashboard from './components/AdminDashboard';
import CreditsModal from './components/CreditsModal';
import LandingPage from './components/LandingPage';
import { LayoutDashboard, List, PlusCircle, Settings, Coins, PiggyBank, Bitcoin, CheckCircle2, Bell, X, Calendar, AlertTriangle, Globe, Loader2, BookOpen, ShieldCheck, WifiOff, FileText, Menu, LogOut, Code2, DownloadCloud, Check, XCircle, Play, Tag, Users, Sun, Moon, PieChart } from 'lucide-react';
import { CURRENCY_KHR, CURRENCY_USD } from './constants';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './theme';

const ROUTES: Record<TabView, string> = {
  [TabView.DASHBOARD]: '/',
  [TabView.TRANSACTIONS]: '/transactions',
  [TabView.ADD]: '/transactions/new',
  [TabView.CATEGORIES]: '/settings',
  [TabView.BUDGET]: '/budgets',
  [TabView.LENDING]: '/lending',
  [TabView.SAVING]: '/savings',
  [TabView.CRYPTO]: '/crypto',
  [TabView.COMMUNITY]: '/community',
  [TabView.ADMIN]: '/admin',
};

const getTabFromPath = (path: string): TabView => {
  const normalizedPath = path.replace(/\/+$/, '') || '/';
  const route = Object.entries(ROUTES).find(([, value]) => value === normalizedPath);
  return (route?.[0] as TabView | undefined) || TabView.DASHBOARD;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const activeUserIdRef = useRef<string | null>(null);
  const isInitializingUserRef = useRef(false);
  const hasLoadedDataRef = useRef(false);

  // App Data State
  const [activeTab, setActiveTab] = useState<TabView>(() => getTabFromPath(window.location.pathname));
  const [manageTab, setManageTab] = useState<'categories' | 'family' | 'settings'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Family[]>([]);
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>('KHR');
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modals
  const [showHowTo, setShowHowTo] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<TransactionRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Approval Configuration State
  const [requestConfigs, setRequestConfigs] = useState<Record<string, { categoryId: string, familyId: string }>>({});

  useEffect(() => {
    // Listen for Auth Changes
    const unsubscribe = authService.subscribeToAuth(async (user) => {
        if (user) {
            handleLogin(user);
        } else {
            activeUserIdRef.current = null;
            isInitializingUserRef.current = false;
            hasLoadedDataRef.current = false;
            setCurrentUser(null);
            setIsLoading(false);
            setIsDataLoading(false);
        }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
        setEditingTransaction(null);
        setActiveTab(getTabFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeData = storage.subscribeToDataChanges(loadData);
    const unsubscribeRealtime = storage.subscribeToRealtimeUpdates();

    return () => {
        unsubscribeData();
        unsubscribeRealtime();
    };
  }, [currentUser]);

  const navigateTo = (tab: TabView, options: { replace?: boolean } = {}) => {
      const path = ROUTES[tab];
      setActiveTab(tab);

      if (window.location.pathname !== path) {
          if (options.replace) {
              window.history.replaceState(null, '', path);
          } else {
              window.history.pushState(null, '', path);
          }
      }
  };

  const handleLogin = async (user: UserProfile) => {
      const isSameUser = activeUserIdRef.current === user.id;
      if (isSameUser && (isInitializingUserRef.current || hasLoadedDataRef.current)) {
          setCurrentUser(user);
          setIsLoading(false);
          return;
      }

      activeUserIdRef.current = user.id;
      isInitializingUserRef.current = true;
      setCurrentUser(user);
      setIsLoading(false);
      setIsDataLoading(true);

      try {
          // Fetch Data from Firestore (or Local Storage if offline mode)
          await storage.initializeData(user);
          
          // Load local state
          loadData();
          
          // Run background jobs (only if not local, or maybe allow local to gen posts too?)
          // Let's allow local AI posts for fun
          generateAndSaveDailyPosts();
          hasLoadedDataRef.current = true;
      } finally {
          isInitializingUserRef.current = false;
          setIsDataLoading(false);
      }
  };

  const loadData = () => {
    setCategories([...storage.getCategories()]);
    setTransactions([...storage.getTransactions()]);
    setFamilyMembers([...storage.getFamilyMembers()]);
    setPreferredCurrency(storage.getPreferredCurrency());
    
    // Check notifications
    const alerts = checkNotifications();
    setNotifications(alerts);
  };

  const handleSaveTransaction = (t: Transaction) => {
    storage.saveTransaction(t);
    loadData(); // Update UI immediately
    setEditingTransaction(null); // Clear edit mode if active
    navigateTo(TabView.TRANSACTIONS);
  };

  const handleDeleteTransaction = (id: string) => {
      // Confirmation handled in UI component
      storage.deleteTransaction(id);
      loadData();
  };

  const handleEditTransaction = (t: Transaction) => {
      setEditingTransaction(t);
      navigateTo(TabView.ADD);
  };

  const handleCancelEdit = () => {
      setEditingTransaction(null);
      navigateTo(TabView.DASHBOARD);
  }

  const handleAddCategory = (c: Category) => {
    storage.saveCategory(c);
    setCategories([...storage.getCategories()]);
  };

  const handleDeleteCategory = (id: string) => {
      // Confirmation handled in UI component
      storage.deleteCategory(id); // Double check: storage delete is idempotent/safe
      setCategories(storage.getCategories());
  }

  const handleAddFamilyMember = (f: Family) => {
      const updated = [...familyMembers, f];
      storage.saveFamilyMembers(updated);
      setFamilyMembers(updated);
  };

  const handleDeleteFamilyMember = (id: string) => {
      // Confirmation handled in UI component
      storage.deleteFamilyMember(id);
      setFamilyMembers(storage.getFamilyMembers());
  };

  const handleUpdateCurrency = (c: Currency) => {
      storage.savePreferredCurrency(c);
      setPreferredCurrency(c);
  };

  const initRequestConfigs = (requests: TransactionRequest[]) => {
      const config: Record<string, { categoryId: string, familyId: string }> = {};
      const defaultCat = storage.getCategories()[0]?._id || '';
      requests.forEach(r => {
          // Check if we already have a config for this ID to preserve selection
          if (!requestConfigs[r._id]) {
              config[r._id] = { categoryId: defaultCat, familyId: '' };
          } else {
              config[r._id] = requestConfigs[r._id];
          }
      });
      setRequestConfigs(prev => ({...prev, ...config}));
  };

  const handleNotificationClick = (n: AppNotification) => {
      setShowNotifications(false);
      if (n.type === 'LENDING') navigateTo(TabView.LENDING);
      if (n.type === 'SAVING') navigateTo(TabView.SAVING);
      if (n.type === 'BUDGET') navigateTo(TabView.BUDGET);
      if (n.type === 'TRANSACTION') navigateTo(TabView.TRANSACTIONS);
      if (n.type === 'EXTERNAL_REQUEST' && n.data) {
          setPendingRequests(n.data);
          initRequestConfigs(n.data);
          setShowRequestModal(true);
      }
  };

  const handleConfigRequestChange = (reqId: string, field: 'categoryId' | 'familyId', value: string) => {
      setRequestConfigs(prev => ({
          ...prev,
          [reqId]: {
              ...prev[reqId],
              [field]: value
          }
      }));
  };

  const handleApproveRequest = async (req: TransactionRequest) => {
      const config = requestConfigs[req._id];
      const categoryId = config?.categoryId || categories[0]?._id;
      const familyId = config?.familyId || undefined;

      if (!categoryId) {
          showAlert("ព័ត៌មានមិនគ្រប់គ្រាន់ (Missing Info)", "សូមបង្កើតប្រភេទជាមុនសិន។ (Please create a category first)", "warning");
          return;
      }

      await storage.approveTransactionRequest(req, categoryId, familyId);
      
      // Remove from pending UI
      const remaining = pendingRequests.filter(r => r._id !== req._id);
      setPendingRequests(remaining);
      
      if (remaining.length === 0) setShowRequestModal(false);
      loadData();
  };

  const handleRejectRequest = async (id: string) => {
      await storage.rejectTransactionRequest(id);
      const remaining = pendingRequests.filter(r => r._id !== id);
      setPendingRequests(remaining);
      if (remaining.length === 0) setShowRequestModal(false);
      loadData(); // To clear notification
  };

  const handleSimulateRequest = () => {
      storage.mockReceiveExternalRequest("Grab");
      loadData();
  };

  const renderContent = () => {
    switch (activeTab) {
      case TabView.DASHBOARD:
        return <Dashboard categories={categories} transactions={transactions} preferredCurrency={preferredCurrency} currentUser={currentUser} />;
      case TabView.TRANSACTIONS:
        return (
            <TransactionList 
                categories={categories} 
                transactions={transactions} 
                familyMembers={familyMembers} 
                preferredCurrency={preferredCurrency}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
            />
        );
      case TabView.ADD:
        return (
          <div className="max-w-2xl mx-auto">
             <TransactionForm 
                categories={categories}
                familyMembers={familyMembers}
                defaultCurrency={preferredCurrency}
                initialData={editingTransaction}
                onSave={handleSaveTransaction} 
                onCancel={handleCancelEdit} 
             />
          </div>
        );
      case TabView.BUDGET:
        return <BudgetManager categories={categories} transactions={transactions} preferredCurrency={preferredCurrency} />;
      case TabView.LENDING:
        return <LendingManager familyMembers={familyMembers} preferredCurrency={preferredCurrency} />;
      case TabView.SAVING:
        return <SavingManager familyMembers={familyMembers} preferredCurrency={preferredCurrency} />;
      case TabView.CRYPTO:
        return <CryptoManager preferredCurrency={preferredCurrency} currentUser={currentUser} />;
      case TabView.COMMUNITY:
        return <CommunityHub />;
      case TabView.ADMIN:
        return currentUser?.isAdmin ? <AdminDashboard /> : <div>Access Denied</div>;
      case TabView.CATEGORIES:
        return (
            <div className="pb-24 max-w-4xl mx-auto">
                <div className="flex p-1 bg-gray-200 rounded-xl mb-6 mt-2">
                    <button 
                        onClick={() => setManageTab('categories')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${manageTab === 'categories' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                    >
                        ប្រភេទ
                    </button>
                    <button 
                        onClick={() => setManageTab('family')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${manageTab === 'family' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                    >
                        គ្រួសារ
                    </button>
                    <button 
                        onClick={() => setManageTab('settings')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${manageTab === 'settings' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                    >
                        ការកំណត់
                    </button>
                </div>

                {manageTab === 'categories' && (
                     <CategoryManager categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} />
                )}

                {manageTab === 'family' && (
                     <FamilyManager members={familyMembers} onAdd={handleAddFamilyMember} onDelete={handleDeleteFamilyMember} />
                )}

                {manageTab === 'settings' && (
                     <div className="space-y-4">
                         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                             <h2 className="text-lg font-bold text-gray-800 mb-4">ការកំណត់ទូទៅ (Settings)</h2>
                             
                             <div className="mb-6">
                                 <p className="text-sm font-medium text-gray-700 mb-2">រូបិយប័ណ្ណដើម (Default Currency)</p>
                                 <div className="flex gap-3">
                                     <button 
                                        onClick={() => handleUpdateCurrency('KHR')}
                                        className={`flex-1 p-3 rounded-xl border flex items-center justify-between ${preferredCurrency === 'KHR' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}
                                     >
                                         <span className="font-bold">{CURRENCY_KHR} Riel</span>
                                         {preferredCurrency === 'KHR' && <CheckCircle2 size={20} />}
                                     </button>
                                     <button 
                                        onClick={() => handleUpdateCurrency('USD')}
                                        className={`flex-1 p-3 rounded-xl border flex items-center justify-between ${preferredCurrency === 'USD' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}
                                     >
                                         <span className="font-bold">{CURRENCY_USD} USD</span>
                                         {preferredCurrency === 'USD' && <CheckCircle2 size={20} />}
                                     </button>
                                 </div>
                             </div>

                             <div className="mb-6">
                                 <p className="text-sm font-medium text-gray-700 mb-2">រូបរាង (Appearance)</p>
                                 <div className="flex gap-3">
                                     <button
                                        onClick={() => setTheme('light')}
                                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${theme === 'light' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                                     >
                                         <Sun size={18} />
                                         <span className="font-bold">ភ្លឺ (Light)</span>
                                     </button>
                                     <button
                                        onClick={() => setTheme('dark')}
                                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${theme === 'dark' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                                     >
                                         <Moon size={18} />
                                         <span className="font-bold">ងងឹត (Dark)</span>
                                     </button>
                                 </div>
                             </div>

                             {/* Demo Button for External Request (Only if Local/Test) */}
                             {currentUser?.isTestUser && (
                                 <button 
                                    onClick={handleSimulateRequest}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors mb-3"
                                 >
                                     <div className="flex items-center gap-2">
                                         <Play size={20} className="text-orange-500" />
                                         <span className="font-medium text-gray-700">Simulate External App Request (Demo)</span>
                                     </div>
                                 </button>
                             )}

                             {/* How-To Link */}
                             <button 
                                onClick={() => setShowHowTo(true)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                             >
                                 <div className="flex items-center gap-2">
                                     <BookOpen size={20} className="text-indigo-600" />
                                     <span className="font-medium text-gray-700">សៀវភៅណែនាំ (How To Use)</span>
                                 </div>
                             </button>
                         </div>
                         
                         {/* Logout Section */}
                         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">គណនី (Account)</h2>
                            <div className="flex items-center gap-3 mb-4">
                                {currentUser?.picture ? (
                                    <img src={currentUser.picture} alt="Profile" className="w-12 h-12 rounded-full border border-gray-200" />
                                ) : (
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                        {currentUser?.name?.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-800">{currentUser?.name}</p>
                                    <p className="text-sm text-gray-500">{currentUser?.email}</p>
                                    {currentUser?.isTestUser && <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-600">Guest</span>}
                                    {currentUser?.isAdmin && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded ml-1 font-bold">Admin</span>}
                                </div>
                            </div>
                            <button 
                                onClick={authService.logout}
                                className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50"
                            >
                                ចាកចេញ (Logout)
                            </button>
                         </div>
                         
                         {/* Version Footer */}
                         <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-300 py-4 font-mono">
                             <span>Ver. 0.02 (Beta)</span>
                             <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowLicense(true)}
                                    className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                                >
                                    <FileText size={10} />
                                    Community License
                                </button>
                                <button 
                                    onClick={() => setShowCredits(true)}
                                    className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                                >
                                    <Code2 size={10} />
                                    Credits
                                </button>
                             </div>
                         </div>
                     </div>
                )}
            </div>
        );
      default:
        return <Dashboard categories={categories} transactions={transactions} preferredCurrency={preferredCurrency} currentUser={currentUser} />;
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: TabView, icon: any, label: string }) => (
      <button
        onClick={() => {
            setEditingTransaction(null);
            navigateTo(tab);
        }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left ${
            activeTab === tab 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
      </button>
  );

  if (isLoading) {
      return (
          <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
          </div>
      );
  }

  if (!currentUser) {
      if (!showLogin) {
          return <LandingPage onGetStarted={() => setShowLogin(true)} />;
      }
      return (
        <>
            <LoginScreen onLogin={handleLogin} />
            <div className="fixed bottom-2 w-full text-center text-xs text-white/50 font-mono z-50 pointer-events-none">
                Ver. 0.02 (Beta)
            </div>
        </>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200 h-screen sticky top-0 z-30">
          <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">C</div>
              <div>
                  <h1 className="text-xl font-bold text-gray-800 leading-none">CHORNOR <span className="text-xs text-indigo-500 font-medium">(Beta)</span></h1>
                  <span className="text-[10px] text-gray-400 font-medium">Finance Manager</span>
              </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide py-4">
              <NavItem tab={TabView.DASHBOARD} icon={LayoutDashboard} label="ទំព័រមុខ (Dashboard)" />
              <NavItem tab={TabView.TRANSACTIONS} icon={List} label="ប្រវត្តិ (History)" />
              <button 
                  onClick={() => {
                    setEditingTransaction(null);
                    navigateTo(TabView.ADD);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left ${activeTab === TabView.ADD ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
              >
                  <PlusCircle size={20} />
                  <span className="font-medium text-sm">បង្កើតថ្មី (Add New)</span>
              </button>
              
              <div className="my-4 border-t border-gray-100"></div>
              
              <NavItem tab={TabView.BUDGET} icon={PieChart} label="ថវិកា (Budgets)" />
              <NavItem tab={TabView.LENDING} icon={Coins} label="កម្ចី (Lending)" />
              <NavItem tab={TabView.SAVING} icon={PiggyBank} label="ការសន្សំ (Saving)" />
              <NavItem tab={TabView.CRYPTO} icon={Bitcoin} label="គ្រីបតូ (Crypto)" />
              <NavItem tab={TabView.COMMUNITY} icon={Globe} label="សហគមន៍ (Hub)" />
              
              {currentUser.isAdmin && (
                   <NavItem tab={TabView.ADMIN} icon={ShieldCheck} label="Admin Panel" />
              )}
          </nav>

          <div className="p-4 border-t border-gray-100">
              <NavItem tab={TabView.CATEGORIES} icon={Settings} label="ការកំណត់ (Settings)" />
              <div className="flex items-center gap-3 mt-4 px-4">
                  {currentUser?.picture ? (
                        <img src={currentUser.picture} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                    ) : (
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                            {currentUser?.name?.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-700 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
                    </div>
              </div>
          </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* HEADER (Mobile & Desktop Shared) */}
          <header className="bg-white px-4 py-3 md:py-4 md:px-8 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100 md:border-b-0 md:bg-gray-50/50 md:backdrop-blur-sm">
            <div className="flex items-center gap-2 md:hidden">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                <div>
                    <h1 className="text-lg font-bold text-gray-800 leading-none">CHORNOR <span className="text-[10px] text-indigo-500 font-medium">(Beta)</span></h1>
                    <div className="flex items-center gap-1">
                        {currentUser.id.startsWith('local_') && (
                            <span className="flex items-center gap-0.5 text-[9px] bg-gray-200 text-gray-600 px-1 rounded">
                                <WifiOff size={8} /> Local
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Header Title (Optional) */}
            <div className="hidden md:block">
               <h2 className="text-2xl font-bold text-gray-800">
                   {activeTab === TabView.DASHBOARD && 'Dashboard Overview'}
                   {activeTab === TabView.TRANSACTIONS && 'Transaction History'}
                   {activeTab === TabView.ADD && 'New Transaction'}
                   {activeTab === TabView.BUDGET && 'Budgets'}
                   {activeTab === TabView.LENDING && 'Lending Management'}
                   {activeTab === TabView.SAVING && 'Savings Goals'}
                   {activeTab === TabView.CRYPTO && 'Crypto Portfolio'}
                   {activeTab === TabView.COMMUNITY && 'Community Hub'}
                   {activeTab === TabView.CATEGORIES && 'Settings'}
               </h2>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
                {/* Admin Icon (Mobile Only - Desktop in Sidebar) */}
                <div className="md:hidden">
                    {currentUser?.isAdmin && (
                        <button 
                            onClick={() => navigateTo(TabView.ADMIN)}
                            className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${activeTab === TabView.ADMIN ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
                        >
                            <ShieldCheck size={24} />
                        </button>
                    )}
                </div>

                {/* Help */}
                <button 
                    onClick={() => setShowHowTo(true)}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-indigo-600 bg-white shadow-sm border border-gray-100"
                    title="Help Guide"
                >
                    <BookOpen size={20} />
                </button>

                {/* Budgets (Mobile Only - Desktop in Sidebar) */}
                <div className="md:hidden">
                    <button
                        onClick={() => navigateTo(TabView.BUDGET)}
                        className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${activeTab === TabView.BUDGET ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
                    >
                        <PieChart size={24} />
                    </button>
                </div>

                {/* Community (Mobile Only - Desktop in Sidebar) */}
                <div className="md:hidden">
                    <button
                        onClick={() => navigateTo(TabView.COMMUNITY)}
                        className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${activeTab === TabView.COMMUNITY ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
                    >
                        <Globe size={24} />
                    </button>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle className="p-2 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-100" size={20} />

                {/* Notification Bell */}
                <button
                    onClick={() => setShowNotifications(true)}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-100"
                >
                    <Bell size={20} className={`text-gray-600 ${notifications.some(n => n.type === 'EXTERNAL_REQUEST') ? 'animate-pulse text-indigo-600' : ''}`} />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                <div className="hidden md:flex items-center gap-2">
                     <button onClick={authService.logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                         <LogOut size={20} />
                     </button>
                </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
            <div className="max-w-7xl mx-auto w-full pb-20 md:pb-0">
               {renderContent()}
            </div>
          </main>
      </div>

      {isDataLoading && (
          <div className="fixed top-4 right-4 z-[70] flex items-center gap-2 rounded-full border border-indigo-100 bg-white/95 px-4 py-2 text-sm font-medium text-indigo-700 shadow-lg backdrop-blur">
              <Loader2 size={16} className="animate-spin" />
              <span>កំពុង Sync...</span>
          </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 md:justify-end md:p-8" onClick={() => setShowNotifications(false)}>
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
              <div 
                  className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in slide-in-from-top-4"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Bell size={18} className="text-indigo-600" />
                          ការជូនដំណឹង (Notifications)
                      </h3>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                              <CheckCircle2 size={48} className="mx-auto mb-2 opacity-20" />
                              <p className="text-sm">គ្មានការជូនដំណឹងទេ</p>
                              <p className="text-xs">No pending alerts</p>
                          </div>
                      ) : (
                          <div className="divide-y divide-gray-100">
                              {notifications.map(n => (
                                  <div 
                                    key={n.id} 
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors border-l-4 ${
                                        n.type === 'EXTERNAL_REQUEST' ? 'border-l-indigo-500 bg-indigo-50/20' :
                                        n.isOverdue ? 'border-l-red-500' : 'border-l-yellow-500'
                                    }`}
                                  >
                                      <div className="flex justify-between items-start mb-1">
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                              n.type === 'EXTERNAL_REQUEST' ? 'bg-indigo-100 text-indigo-700' :
                                              n.type === 'LENDING' ? 'bg-blue-100 text-blue-700' :
                                              n.type === 'SAVING' ? 'bg-green-100 text-green-700' :
                                              n.type === 'BUDGET' ? 'bg-purple-100 text-purple-700' :
                                              'bg-orange-100 text-orange-700'}`}>
                                              {n.type}
                                          </span>
                                          {n.isOverdue && n.type !== 'EXTERNAL_REQUEST' && (
                                              <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold">
                                                  <AlertTriangle size={10} /> Overdue
                                              </span>
                                          )}
                                      </div>
                                      <h4 className="font-bold text-gray-800 text-sm mb-0.5">{n.title}</h4>
                                      <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                                      <div className="flex items-center gap-1 text-xs text-gray-400">
                                          <Calendar size={12} />
                                          <span>{new Date(n.date).toLocaleDateString('km-KH')}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Request Approval Modal */}
      {showRequestModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowRequestModal(false)}>
              <div 
                  className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                      <h2 className="font-bold flex items-center gap-2">
                          <DownloadCloud size={20} />
                          Review Requests
                      </h2>
                      <button onClick={() => setShowRequestModal(false)} className="p-1 hover:bg-indigo-500 rounded-full text-indigo-100">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-800">
                      These apps want to add transactions to your history. Please select a category and confirm.
                  </div>

                  <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                      {pendingRequests.map(req => {
                          const config = requestConfigs[req._id] || { categoryId: '', familyId: '' };
                          return (
                            <div key={req._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                                        App: {req.sourceAppName}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(req.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <p className="font-bold text-gray-800 text-sm">{req.description}</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {req.currency === 'USD' ? '$' : '៛'}{req.amount}
                                    </p>
                                </div>
                                
                                {/* Selectors */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Tag size={14} className="text-gray-400 shrink-0" />
                                        <select 
                                            value={config.categoryId}
                                            onChange={(e) => handleConfigRequestChange(req._id, 'categoryId', e.target.value)}
                                            className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none"
                                        >
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-gray-400 shrink-0" />
                                        <select 
                                            value={config.familyId}
                                            onChange={(e) => handleConfigRequestChange(req._id, 'familyId', e.target.value)}
                                            className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none"
                                        >
                                            <option value="">(Me)</option>
                                            {familyMembers.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleRejectRequest(req._id)}
                                        className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-1"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                    <button 
                                        onClick={() => handleApproveRequest(req)}
                                        className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-1 shadow-md"
                                    >
                                        <Check size={14} /> Approve
                                    </button>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* How To Modal */}
      {showHowTo && <HowToGuide onClose={() => setShowHowTo(false)} />}
      
      {/* Community License Modal */}
      {showLicense && <CommunityLicense onClose={() => setShowLicense(false)} />}

      {/* Credits Modal */}
      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden bg-white border-t border-gray-200 p-2 fixed bottom-0 w-full z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center px-1">
          <button
            onClick={() => {
                setEditingTransaction(null);
                navigateTo(TabView.DASHBOARD);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === TabView.DASHBOARD ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[9px] font-medium">ទំព័រមុខ</span>
          </button>
          
          <button
            onClick={() => {
                setEditingTransaction(null);
                navigateTo(TabView.TRANSACTIONS);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === TabView.TRANSACTIONS ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List size={20} />
            <span className="text-[9px] font-medium">ប្រវត្តិ</span>
          </button>

          <button
            onClick={() => {
                setEditingTransaction(null);
                navigateTo(TabView.LENDING);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === TabView.LENDING ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Coins size={20} />
            <span className="text-[9px] font-medium">កម្ចី</span>
          </button>

          <button
            onClick={() => {
                setEditingTransaction(null);
                navigateTo(TabView.ADD);
            }}
            className="flex flex-col items-center justify-center -mt-8"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                activeTab === TabView.ADD ? 'bg-indigo-700 scale-110' : 'bg-indigo-600 hover:scale-105'
            }`}>
                <PlusCircle size={28} className="text-white" />
            </div>
          </button>

          <button
            onClick={() => {
                setEditingTransaction(null);
                navigateTo(TabView.SAVING);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === TabView.SAVING ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <PiggyBank size={20} />
            <span className="text-[9px] font-medium">សន្សំ</span>
          </button>

          <button
            onClick={() => {
                setEditingTransaction(null);
                navigateTo(TabView.CRYPTO);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === TabView.CRYPTO ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Bitcoin size={20} />
            <span className="text-[9px] font-medium">គ្រីបតូ</span>
          </button>

          <button
            onClick={() => {
                setEditingTransaction(null);
                navigateTo(TabView.CATEGORIES);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === TabView.CATEGORIES || activeTab === TabView.ADMIN ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Settings size={20} />
            <span className="text-[9px] font-medium">កំណត់</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
