import { useState, useEffect, useRef, lazy, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { 
  LayoutDashboard, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  Bell, 
  User as UserIcon, 
  X,
  Moon,
  Sun,
  Zap,
  ShieldCheck,
  ChevronLeft,
  Gift,
  HelpCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'react-hot-toast';

// Lazy loaded components
const Splash = lazy(() => import('./components/auth/Splash'));
const Auth = lazy(() => import('./components/auth/Auth'));
const Onboarding = lazy(() => import('./components/auth/Onboarding'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Airtime = lazy(() => import('./components/payments/Airtime'));
const Data = lazy(() => import('./components/payments/Data'));
const Electricity = lazy(() => import('./components/payments/Electricity'));
const CableTV = lazy(() => import('./components/payments/CableTV'));
const History = lazy(() => import('./components/history/History'));
const Settings = lazy(() => import('./components/settings/Settings'));
const TermsAndPolicies = lazy(() => import('./components/settings/TermsAndPolicies'));
const Rewards = lazy(() => import('./components/rewards/Rewards'));
const Recommended = lazy(() => import('./components/dashboard/Recommended'));
const Bills = lazy(() => import('./components/payments/Bills'));
const Betting = lazy(() => import('./components/payments/Betting'));
const Internet = lazy(() => import('./components/payments/Internet'));
const Education = lazy(() => import('./components/payments/Education'));
const OtherUtilities = lazy(() => import('./components/payments/OtherUtilities'));
const SubWallets = lazy(() => import('./components/payments/SubWallets'));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard'));
const AgentDashboard = lazy(() => import('./components/dashboard/AgentDashboard'));
const CustomerCareDashboard = lazy(() => import('./components/dashboard/CustomerCareDashboard'));
const Policies = lazy(() => import('./components/settings/Policies'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const SupportChat = lazy(() => import('./components/support/SupportChat'));
const Transfer = lazy(() => import('./components/payments/Transfer'));
const LandingPage = lazy(() => import('./components/landing/LandingPage'));

import { getCurrentSeason, getSeasonStyles } from './utils/seasons';
import Logo from './components/common/Logo';
import { storage } from './utils/storage';
import { View, User, AppNotification } from './types';

// Loading fallback
const LoadingView = () => (
  <div className="fixed inset-0 bg-slate-50 dark:bg-[#020817] flex flex-col items-center justify-center gap-4 z-40">
    <div className="w-14 h-14 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 tracking-wide animate-pulse">Loading…</p>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-red-100 dark:border-red-900/20 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4">Something went wrong</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
              {this.state.error?.message?.includes('auth/invalid-api-key') 
                ? 'Firebase configuration error: Invalid API Key. Please check your project settings.'
                : this.state.error?.message?.includes('Service firestore is not available')
                ? 'Firestore service is currently unavailable. This might be due to ongoing configuration. Please wait a moment and refresh.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-left text-xs overflow-auto max-h-40 text-red-500 font-mono">
                {this.state.error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [appState, setAppState] = useState<'landing' | 'splash' | 'auth' | 'onboarding' | 'app' | 'reset-password'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/reset-password' || urlParams.has('token')) {
      setAppState('reset-password');
    }
    // If user is already logged in, skip landing
    const savedUser = storage.get('kosi_user');
    if (savedUser) {
      setAppState('splash');
    }
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewHistory, setViewHistory] = useState<View[]>(['dashboard']);

  const season = getCurrentSeason();
  const seasonStyles = getSeasonStyles(season);

  const navigateTo = (view: View) => {
    setCurrentView(view);
    setViewHistory(prev => [...prev, view]);
  };

  const navigateBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      setViewHistory(newHistory);
      setCurrentView(newHistory[newHistory.length - 1]);
    }
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notificationsFetchedRef = useRef(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | undefined>();
  const [retryData, setRetryData] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return storage.get('theme') === 'dark' || 
      (!storage.get('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      storage.set('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      storage.set('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Check for saved user session
    const savedUser = storage.get('kosi_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure new fields exist
        if (!parsedUser.tier) parsedUser.tier = 'Basic';
        if (parsedUser.isLiveMode === undefined) parsedUser.isLiveMode = false;
        if (parsedUser.isBiometricEnabled === undefined) parsedUser.isBiometricEnabled = false;
        
        // Verify session with server (credentials: 'include' sends the JWT cookie)
        fetch(`/api/user/${parsedUser.id}`, { credentials: 'include' })
          .then(res => {
            if (!res.ok) {
              storage.remove('kosi_user');
              setUser(null);
              setAppState('auth');
            } else {
              res.json().then(data => {
                if (data.success) {
                  setUser(data.user);
                  storage.set('kosi_user', JSON.stringify(data.user));
                }
              });
            }
          })
          .catch(() => {
            // If network fails, keep user from local storage to allow offline-ish mode
            setUser(parsedUser);
          });
          
        setUser(parsedUser); // Optimistically set user
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        if (!user?.id) return;
        
        try {
          const res = await fetch(`${window.location.origin}/api/notifications/${user.id}`, { credentials: 'include' });
          
          if (res.status === 401 || res.status === 403) {
            handleLogout();
            return;
          }
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${res.statusText}`);
          }
          
          const data = await res.json();
          if (data.success) {
            setNotifications(data.notifications);
            notificationsFetchedRef.current = true;
          } else {
            throw new Error(data.error || 'Failed to fetch notifications');
          }
        } catch (error: any) {
          console.error('Failed to fetch notifications:', error.message);
        }
      };
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  const markNotificationAsRead = async (id: string, transactionId?: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (user) {
      try {
        await fetch(`/api/notifications/${user.id}/read/${id}`, { method: 'PUT', credentials: 'include' });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    if (transactionId) {
      setSelectedTransactionId(transactionId);
      navigateTo('history');
      setShowNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user) {
      try {
        await fetch(`/api/notifications/${user.id}/read`, { method: 'PUT', credentials: 'include' });
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    
    setNotifications([]);
    if (user) {
      try {
        await fetch(`/api/notifications/${user.id}`, { method: 'DELETE', credentials: 'include' });
        toast.success('All notifications deleted');
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
        toast.error('Failed to delete notifications');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogin = (userData: any) => {
    const fullUser: User = {
      ...userData,
      tier: userData.tier || 'Basic',
      isLiveMode: userData.isLiveMode || false,
      isBiometricEnabled: userData.isBiometricEnabled || false,
      pin: userData.pin || null,
    };
    setUser(fullUser);
    storage.set('kosi_user', JSON.stringify(fullUser));
    
    if (!fullUser.phone || fullUser.pin === '1234') {
      setAppState('onboarding');
    } else {
      // Auto-route role-specific users to their dashboard
      if (fullUser.isAdmin) setCurrentView('admin');
      else if (fullUser.isCustomerCare) setCurrentView('customer_care');
      else if (fullUser.isAgent) setCurrentView('agent');
      setAppState('app');
    }
  };

  const handleLogout = () => {
    setUser(null);
    storage.remove('kosi_user');
    setAppState('landing');
    setCurrentView('dashboard');
    setViewHistory(['dashboard']);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storage.set('kosi_user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
      const registerPush = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered');

          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Notification permission denied');
            return;
          }

          const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) {
            console.warn('VITE_VAPID_PUBLIC_KEY not set');
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey
          });

          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, subscription })
          });
          console.log('Push subscription successful');
        } catch (error) {
          console.error('Push registration failed:', error);
        }
      };
      registerPush();
    }
  }, [user]);

  if (appState === 'landing') {
    return (
      <Suspense fallback={<LoadingView />}>
        <LandingPage
          onGetStarted={() => { setAuthMode('signup'); setAppState('auth'); }}
          onLogin={() => { setAuthMode('login'); setAppState('auth'); }}
        />
      </Suspense>
    );
  }

  if (appState === 'splash') {
    return (
      <Suspense fallback={<LoadingView />}>
        <Splash onComplete={() => setAppState(user ? 'app' : 'auth')} />
      </Suspense>
    );
  }

  if (appState === 'auth') {
    return (
      <Suspense fallback={<LoadingView />}>
        <>
          <Auth onLogin={handleLogin} initialMode={authMode} />
          <Toaster position="top-center" toastOptions={{ className: 'font-bold rounded-2xl shadow-xl', duration: 4000 }} />
        </>
      </Suspense>
    );
  }

  if (appState === 'reset-password') {
    return (
      <Suspense fallback={<LoadingView />}>
        <ResetPassword onComplete={() => {
          window.history.replaceState({}, document.title, "/");
          setAppState('auth');
        }} />
      </Suspense>
    );
  }

  if (appState === 'onboarding' && user) {
    return (
      <Suspense fallback={<LoadingView />}>
        <Onboarding 
          user={user} 
          onComplete={(updatedUser) => {
            updateUser(updatedUser);
            setAppState('app');
          }} 
        />
      </Suspense>
    );
  }

  const bottomNav = user?.isAdmin ? [
    { name: 'Home', view: 'admin' as View, icon: LayoutDashboard },
    { name: 'Bills', view: 'bills' as View, icon: Tv },
    { name: 'History', view: 'history' as View, icon: HistoryIcon },
    { name: 'Settings', view: 'settings' as View, icon: SettingsIcon },
  ] : user?.isCustomerCare ? [
    { name: 'Home', view: 'customer_care' as View, icon: LayoutDashboard },
    { name: 'Bills', view: 'bills' as View, icon: Tv },
    { name: 'History', view: 'history' as View, icon: HistoryIcon },
    { name: 'Settings', view: 'settings' as View, icon: SettingsIcon },
  ] : user?.isAgent ? [
    { name: 'Home', view: 'agent' as View, icon: LayoutDashboard },
    { name: 'Bills', view: 'bills' as View, icon: Tv },
    { name: 'History', view: 'history' as View, icon: HistoryIcon },
    { name: 'Settings', view: 'settings' as View, icon: SettingsIcon },
  ] : [
    { name: 'Home', view: 'dashboard' as View, icon: LayoutDashboard },
    { name: 'Bills', view: 'bills' as View, icon: Tv },
    { name: 'Rewards', view: 'rewards' as View, icon: Gift },
    { name: 'Settings', view: 'settings' as View, icon: SettingsIcon },
  ];

  const renderView = () => {
    if (!user) return null;
    switch (currentView) {
      case 'dashboard': return <Dashboard setView={navigateTo} user={user} setUser={updateUser} />;
      case 'bills': return <Bills setView={navigateTo} />;
      case 'rewards': return <Rewards user={user} />;
      case 'recommended': return <Recommended user={user} />;
      case 'airtime': return <Airtime user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'data': return <Data user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'electricity': return <Electricity user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'cable': return <CableTV user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'betting': return <Betting user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'internet': return <Internet user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'education': return <Education user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'other-utilities': return <OtherUtilities user={user} setUser={updateUser} setView={navigateTo} retryData={retryData} clearRetryData={() => setRetryData(null)} />;
      case 'history': return <History user={user} initialTransactionId={selectedTransactionId} onTransactionViewed={() => setSelectedTransactionId(undefined)} onRetry={(view, data) => { setRetryData(data); navigateTo(view); }} />;
      case 'sub-wallets': return <SubWallets user={user} onUpdate={async () => {
        try {
          const res = await fetch(`/api/user/${user.id}`, { credentials: 'include' });
          const data = await res.json();
          if (data.success) updateUser(data.user);
        } catch (e) {
          console.error("Failed to update user after sub-wallet change:", e);
        }
      }} />;
      case 'transfer': return <Transfer user={user} setView={navigateTo} setUser={updateUser} />;
      case 'admin': return <AdminDashboard user={user} onBack={navigateBack} />;
      case 'agent': return <AgentDashboard user={user} setView={navigateTo} />;
      case 'customer_care': return <CustomerCareDashboard user={user} />;
      case 'support': return <SupportChat user={user} />;
      case 'policies': return <Policies />;
      case 'settings': return <Settings user={user} setUser={updateUser} onLogout={handleLogout} setView={navigateTo} />;
      case 'terms': return <TermsAndPolicies onBack={navigateBack} />;
      default: return <Dashboard setView={navigateTo} user={user} setUser={updateUser} />;
    }
  };

  const homeView = user?.isAdmin ? 'admin' : user?.isCustomerCare ? 'customer_care' : user?.isAgent ? 'agent' : 'dashboard';
  const isMainTab = ['dashboard', 'bills', 'rewards', 'settings', 'admin', 'agent', 'customer_care'].includes(currentView);

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#020817] flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            {!isMainTab ? (
              <button 
                onClick={navigateBack}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1"
                aria-label="Back"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="font-bold hidden sm:block">Back</span>
              </button>
            ) : (
              <button 
                onClick={() => navigateTo(homeView as View)}
                className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
                aria-label="Go to home"
              >
                <Logo className="w-8 h-8" />
                <span className="hidden sm:block">Kosi Bills</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize hidden sm:block">
                {currentView === 'terms' ? 'Terms & Policies' :
                 currentView === 'sub-wallets' ? 'Sub Wallets' :
                 currentView === 'other-utilities' ? 'Other Utilities' :
                 currentView === 'cable' ? 'Cable TV' :
                 currentView === 'customer_care' ? 'Customer Care' :
                 currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </h1>
              {user?.isLiveMode && (
                <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Live
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setShowNotifications(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                        <div className="flex items-center gap-3">
                          {notifications.length > 0 && (
                            <button 
                              onClick={deleteAllNotifications}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                              title="Delete all notifications"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto p-2">
                        {notifications.length > 0 ? (
                          <div className="space-y-1">
                            {notifications.map(notification => (
                              <div 
                                key={notification.id} 
                                onClick={() => markNotificationAsRead(notification.id, notification.transactionId)}
                                className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notification.type === 'alert' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                  notification.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                  notification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                }`}>
                                  {notification.type === 'alert' ? <ShieldCheck className="w-5 h-5" /> : 
                                   notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                   notification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                                   <Info className="w-5 h-5" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-bold ${!notification.read ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                      {notification.title}
                                    </p>
                                    {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notification.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(notification.date).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No notifications</p>
                          </div>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                          <button onClick={markAllAsRead} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">Mark all as read</button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div 
              onClick={() => setCurrentView('settings')}
              className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 relative overflow-hidden">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-slate-700 dark:text-slate-200 leading-tight">{user?.name || 'User'}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{user?.tier} Account</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Suspense fallback={<LoadingView />}>
              {renderView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.name}
                  onClick={() => navigateTo(item.view)}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-all active:scale-90"
                >
                  {isActive && (
                    <motion.div layoutId="nav-indicator"
                      className="absolute top-2 w-8 h-1 bg-emerald-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/50' : ''}`}>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-slate-100 font-bold rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700',
          duration: 4000,
        }}
      />
    </div>
  );
}
