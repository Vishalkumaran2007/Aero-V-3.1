/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Bot, 
  ShieldCheck, 
  History, 
  PlusCircle, 
  Settings,
  Plane,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  X,
  Shield,
  FileCheck,
  Activity,
  Calendar,
  Command,
  FileText,
  Sun,
  Moon,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AircraftProvider, useAircraft } from './context/AircraftContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Copilot from './components/Copilot';
import Compliance from './components/Compliance';
import TechnicianDashboard from './components/dashboards/TechnicianDashboard';
import EngineerDashboard from './components/dashboards/EngineerDashboard';
import SupervisorDashboard from './components/dashboards/SupervisorDashboard';
import QADashboard from './components/dashboards/QADashboard';
import PlannerDashboard from './components/dashboards/PlannerDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import AircraftManagement from './components/dashboards/AircraftManagement';
import AdminApprovals from './components/dashboards/AdminApprovals';
import AuditLogs from './components/dashboards/AuditLogs';
import About from './components/About';
import Documentation from './components/Documentation';
import { Logo } from './components/Logo';
import { notifyApi } from './services/api';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { aircrafts, selectedAircraft, setSelectedAircraft } = useAircraft();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotify, setShowNotify] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const getActiveView = () => {
    if (location.pathname === '/') return 'DASHBOARD';
    if (location.pathname === '/copilot') return 'COPILOT';
    if (location.pathname === '/compliance') return 'COMPLIANCE';
    if (location.pathname === '/history') return 'HISTORY';
    if (location.pathname === '/admin') return 'ADMIN';
    if (location.pathname === '/admin/approvals') return 'APPROVALS';
    if (location.pathname === '/profile') return 'PROFILE';
    if (location.pathname === '/aircraft') return 'AIRCRAFT';
    if (location.pathname === '/admin/audit-logs') return 'AUDIT';
    if (location.pathname === '/about') return 'ABOUT';
    if (location.pathname === '/docs') return 'DOCS';
    return '';
  };

  const navItems = useMemo(() => {
    const items = [
      { id: 'DASHBOARD', label: 'Monitor', icon: LayoutDashboard, path: '/' },
      { id: 'AIRCRAFT', label: 'Fleet Assets', icon: Plane, path: '/aircraft' },
    ];

    if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'qa_officer') {
      if (user?.role === 'admin') {
        items.unshift({ id: 'ADMIN', label: 'Command', icon: Command, path: '/admin' });
        items.splice(1, 0, { id: 'APPROVALS', label: 'Registry', icon: CheckCircle2, path: '/admin/approvals' });
        items.splice(2, 0, { id: 'AUDIT', label: 'Audit Logs', icon: Shield, path: '/admin/audit-logs' });
      } else {
        items.splice(1, 0, { id: 'AUDIT', label: 'Audit Logs', icon: Shield, path: '/admin/audit-logs' });
      }
    }

    if (user?.role === 'technician') {
      items.push({ id: 'COPILOT', label: 'Log Entry', icon: FileText, path: '/copilot' });
    }

    items.push({ id: 'PROFILE', label: 'Personnel', icon: UserIcon, path: '/profile' });
    items.push({ id: 'DOCS', label: 'Manuals', icon: FileText, path: '/docs' });
    items.push({ id: 'ABOUT', label: 'About', icon: Info, path: '/about' });

    return items;
  }, [user]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    try {
      eventSource = new EventSource('/api/notifications/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications(prev => [data, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
        } catch (err) {
          console.error("Failed to parse notification:", err);
        }
      };
      eventSource.onerror = (err) => {
        console.warn("EventSource failed. Reconnecting in 5s...", err);
        if (eventSource) eventSource.close();
      };
    } catch (err) {
      console.error("Failed to initialize EventSource:", err);
    }

    notifyApi.getNotifications().then(res => {
      setNotifications(res.data);
    }).catch(err => {
      console.error("Failed to fetch notifications:", err);
    });

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-aviator-black font-sans">
      <aside className="w-64 border-r border-aviator-border bg-aviator-slate flex flex-col z-20 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="scanline" />
        
        <div className="p-4 flex items-center gap-2.5 border-b border-aviator-border relative bg-black/10">
          <Logo size={32} className="text-white shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold tracking-[0.05em] text-lg text-aviator-text uppercase italic leading-none whitespace-nowrap truncate">
              Aero<span className="text-aviator-amber">Compliance</span>
            </h1>
            <p className="text-[7px] text-aviator-text-dim tracking-[0.1em] uppercase mt-1.5 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1 h-1 bg-aviator-green rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
              Operational Registry
            </p>
          </div>
        </div>

        <div className="px-4 py-3 bg-black/40 border-b border-aviator-border overflow-hidden h-10 flex items-center">
          <motion.div 
            animate={{ x: [250, -500] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="whitespace-nowrap font-mono text-[8px] text-aviator-amber/40 uppercase tracking-[0.3em] flex gap-8"
          >
            {[...Array(3)].map((_, i) => (
              <span key={i}>SYSTEM STATUS: NOMINAL // GPS LOCK: ACTIVE // V-LINK RELAY: STABLE // ENCRYPTION: AES-256-GCM // SIGNAL: 98.4%</span>
            ))}
          </motion.div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          <div className="tech-label px-2 mb-4 flex items-center justify-between">
            <span>Privilege Portal</span>
            <span className="text-aviator-amber font-mono text-[8px] animate-pulse">Tier: {user?.role.toUpperCase()}</span>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 transition-all rounded-sm mb-1 ${
                getActiveView() === item.id 
                  ? 'bg-aviator-amber/10 border-l-2 border-aviator-amber text-aviator-text shadow-inner shadow-aviator-amber/5' 
                  : 'text-aviator-text-dim hover:text-aviator-text hover:bg-black/5 dark:hover:bg-white/[0.02]'
              }`}
            >
              <item.icon className={`w-4 h-4 ${getActiveView() === item.id ? 'text-aviator-amber' : ''}`} />
              <span className="font-mono font-bold text-[10px] tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-aviator-border bg-black/20">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-2 rounded-sm hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-sm border border-white/10 bg-aviator-card flex items-center justify-center text-xs font-mono text-aviator-amber">
              {user?.name.substring(0, 2).toUpperCase() || '??'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[11px] font-bold text-aviator-text truncate">{user?.name}</div>
              <div className="text-[9px] text-aviator-text-dim font-mono tracking-tighter uppercase">{user?.role}</div>
            </div>
            <LogOut onClick={(e) => { e.stopPropagation(); logout(); }} className="w-4 h-4 text-aviator-text-dim hover:text-aviator-amber transition-colors" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 border-b border-aviator-border bg-aviator-slate/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="tech-label text-[9px]">Select Fleet Asset</div>
              <div className="relative group">
                <select 
                  value={selectedAircraft?.aircraft_id || ''}
                  onChange={(e) => {
                    const found = aircrafts.find(a => a.aircraft_id === e.target.value);
                    setSelectedAircraft(found || null);
                  }}
                  className="bg-aviator-black border border-white/10 text-aviator-amber font-mono text-[11px] font-bold uppercase py-1.5 px-4 pr-8 rounded-sm appearance-none cursor-pointer focus:border-aviator-amber transition-all glow-amber/10"
                >
                  <option value="">-- NO ASSET SELECTED --</option>
                  {aircrafts.map(a => (
                    <option key={a.id} value={a.aircraft_id}>{a.aircraft_id} // {a.type}</option>
                  ))}
                </select>
                <Plane className="w-3 h-3 text-aviator-amber absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                <div className={`absolute -right-2 top-0 w-2 h-2 rounded-full ${selectedAircraft ? 'bg-aviator-green animate-pulse glow-green' : 'bg-aviator-red animate-pulse glow-red'}`} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 text-aviator-text-dim hover:text-aviator-amber transition-all rounded-sm hover:bg-white/5"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => { setShowNotify(!showNotify); setUnreadCount(0); }}
                  className="p-2 text-aviator-text-dim hover:text-white transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-aviator-amber rounded-full glow-amber" />}
                </button>
                
                {showNotify && (
                  <div className="absolute right-0 mt-2 w-80 tech-card z-50 p-4 border-aviator-amber/20 shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center mb-4 border-b border-aviator-border pb-2">
                      <span className="tech-label">Operational Alerts</span>
                      <X className="w-3 h-3 text-slate-600 cursor-pointer hover:text-white" onClick={() => setShowNotify(false)} />
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-aviator-text-dim font-mono italic">No active notifications</p>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className={`p-3 border-l-2 panel-gradient ${n.type === 'CRITICAL' ? 'border-aviator-red bg-aviator-red/5' : 'border-aviator-amber bg-aviator-amber/5'}`}>
                            <p className="text-[10px] text-slate-200 leading-normal mb-1">{n.message}</p>
                            <span className="text-[8px] text-aviator-text-dim font-mono uppercase tracking-widest">{new Date(n.timestamp || Date.now()).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {user?.role === 'technician' && (
                <button 
                  onClick={() => navigate('/copilot')}
                  className="btn-primary py-2 h-9"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px]">NEW LOG ENTRY</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {!selectedAircraft && !['/aircraft', '/profile', '/about', '/docs', '/admin/audit-logs'].includes(location.pathname) ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="tech-card p-12 border-aviator-amber/30 bg-aviator-amber/5 max-w-md animate-in fade-in zoom-in duration-500">
                  <Plane className="w-16 h-16 text-aviator-amber mx-auto mb-6 animate-bounce" />
                  <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter">Asset Selection Required</h2>
                  <p className="text-aviator-text-dim text-[11px] font-mono leading-relaxed mb-6 uppercase tracking-widest">
                    You must link your session to an active fleet asset before accessing operational data.
                  </p>
                  <select 
                    onChange={(e) => {
                      const found = aircrafts.find(a => a.aircraft_id === e.target.value);
                      setSelectedAircraft(found || null);
                    }}
                    className="w-full bg-aviator-black border border-aviator-amber/40 text-aviator-amber font-mono text-xs p-3 rounded-sm outline-none focus:border-aviator-amber transition-all"
                  >
                    <option value="">Select Aircraft...</option>
                    {aircrafts.map(a => (
                      <option key={a.id} value={a.aircraft_id}>{a.aircraft_id} // {a.type}</option>
                    ))}
                  </select>
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => navigate('/aircraft')}
                      className="mt-6 text-xs font-mono text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]"
                    >
                      Management Interface →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname + (selectedAircraft?.aircraft_id || '')}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-aviator-black flex flex-col items-center justify-center font-mono text-aviator-amber gap-4">
      <div className="w-24 h-[1px] bg-aviator-amber/20 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-aviator-amber"
          animate={{ x: [-100, 100] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="text-[10px] tracking-[0.5em] animate-pulse">INITIATING SECURE SESSION...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return <AppLayout>{children}</AppLayout>;
}

function RoleDashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'technician': return <TechnicianDashboard />;
    case 'engineer': return <EngineerDashboard />;
    case 'supervisor': return <SupervisorDashboard />;
    case 'qa_officer': return <QADashboard />;
    case 'planner': return <PlannerDashboard />;
    case 'admin': return <AdminDashboard />;
    default: return <Dashboard />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AircraftProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute><RoleDashboard /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/approvals" element={<PrivateRoute roles={['admin']}><AdminApprovals /></PrivateRoute>} />
            <Route path="/aircraft" element={<PrivateRoute><AircraftManagement /></PrivateRoute>} />
            <Route path="/copilot" element={<PrivateRoute roles={['technician', 'admin']}><Copilot /></PrivateRoute>} />
            <Route path="/compliance" element={<PrivateRoute roles={['qa_officer', 'admin']}><Compliance /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
            <Route path="/docs" element={<PrivateRoute><Documentation /></PrivateRoute>} />
            <Route path="/admin/audit-logs" element={<PrivateRoute roles={['admin', 'supervisor', 'qa_officer']}><AuditLogs /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </AircraftProvider>
    </AuthProvider>
  );
}
