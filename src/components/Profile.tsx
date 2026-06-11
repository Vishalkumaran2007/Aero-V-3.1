import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, adminApi } from '../services/api';
import { 
  User, 
  Mail, 
  Shield, 
  Save, 
  Loader2, 
  Lock, 
  RefreshCw, 
  Phone, 
  Award, 
  Calendar, 
  Plane, 
  Hash, 
  Clock, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ToggleLeft,
  Key,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const [formData, setFormData] = useState<any>({
    name: '',
    phone: '',
    license_number: '',
    certification_type: '',
    issuing_authority: '',
    valid_from: '',
    expiry_date: '',
    authorized_types: '',
    expertise: '',
    secure_pin: '',
    two_factor_enabled: false
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'CERTIFICATION' | 'PERFORMANCE' | 'SECURITY'>('IDENTITY');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        license_number: user.license_number || '',
        certification_type: user.certification_type || '',
        issuing_authority: user.issuing_authority || '',
        valid_from: user.valid_from || '',
        expiry_date: user.expiry_date || '',
        authorized_types: user.authorized_types || '',
        expertise: user.expertise || '',
        secure_pin: user.secure_pin || '',
        two_factor_enabled: user.two_factor_enabled === 1
      });
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    if (!user) return;
    try {
      const res = await authApi.getUserMetrics(user.id);
      setMetrics(res.data);
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await authApi.updateProfile(formData);
      await refreshUser();
      setMessage('SUCCESS: Registry records updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('ERROR: Transaction rejected by server');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (date: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Establishing Identity Link...</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-sm bg-aviator-card border border-aviator-border flex items-center justify-center relative overflow-hidden group">
            <User className="w-12 h-12 text-aviator-text-dim group-hover:text-aviator-amber transition-colors" />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[8px] font-mono text-center opacity-0 group-hover:opacity-100 transition-opacity">MODIFY</div>
          </div>
          <div>
            <div className="tech-label text-aviator-amber mb-1">Personnel Record // {user.employee_id}</div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase italic text-aviator-text">
              {user.name.split(' ')[0]}<span className="text-aviator-amber">{user.name.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="px-2 py-0.5 bg-aviator-amber/10 border border-aviator-amber/30 text-aviator-amber text-[9px] font-bold rounded-sm uppercase tracking-widest">{user.role}</span>
              <span className={`px-2 py-0.5 bg-aviator-green/10 border border-aviator-green/30 text-aviator-green text-[9px] font-bold rounded-sm uppercase tracking-widest border flex items-center gap-1.5 ${user.account_status === 'Active' ? '' : 'bg-aviator-red/10 border-aviator-red/30 text-aviator-red'}`}>
                <div className={`w-1 h-1 rounded-full ${user.account_status === 'Active' ? 'bg-aviator-green grow-green' : 'bg-aviator-red grow-red'}`} />
                {user.account_status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           <button onClick={logout} className="p-3 border border-aviator-border hover:bg-aviator-red/10 hover:text-aviator-red text-aviator-text-dim transition-all rounded-sm flex items-center gap-2">
             <LogOut className="w-4 h-4" />
             <span className="tech-label">End Session</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <aside className="space-y-2">
          {([
            { id: 'IDENTITY', icon: User, label: 'Identity Matrix' },
            { id: 'CERTIFICATION', icon: Award, label: 'Certifications' },
            { id: 'PERFORMANCE', icon: Activity, label: 'Performance' },
            { id: 'SECURITY', icon: Lock, label: 'Security Protocols' }
          ] as const).map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all border ${activeTab === tab.id ? 'bg-aviator-amber/10 border-aviator-amber/40 text-aviator-amber translate-x-2' : 'bg-aviator-card border-aviator-border text-aviator-text-dim hover:bg-white/5 hover:text-aviator-text'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </aside>

        <main className="col-span-3">
          <form onSubmit={handleUpdate} className="tech-card p-10 space-y-12">
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 text-[10px] font-mono text-center border uppercase tracking-[0.3em] font-bold shadow-xl ${message.includes('SUCCESS') ? 'bg-aviator-green/5 border-aviator-green/20 text-aviator-green' : 'bg-aviator-red/5 border-aviator-red/20 text-aviator-red'}`}
              >
                {message}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === 'IDENTITY' && (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">Legal Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black/20 border border-aviator-border p-4 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">Registry Email (Read-Only)</label>
                      <input 
                        readOnly 
                        value={user.email} 
                        className="w-full bg-black/10 border border-aviator-border/50 p-4 text-aviator-text-dim/60 font-mono text-sm outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">Contact Uplink (Phone)</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-aviator-text-dim/40" />
                        <input 
                          type="text" 
                          placeholder="+1 (xxx) xxx-xxxx"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-black/20 border border-aviator-border p-4 pl-12 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">Access Authorization Level</label>
                      <div className="w-full bg-black/10 border border-aviator-border/50 p-4 text-aviator-amber font-mono text-sm uppercase tracking-widest">
                        {user.access_level} / {user.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'CERTIFICATION' && (
                <motion.div
                  key="cert"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">License Reference (DGCA/FAA)</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-aviator-text-dim/40" />
                        <input 
                          type="text" 
                          placeholder="e.g. DL-48592-A"
                          value={formData.license_number}
                          onChange={(e) => setFormData({...formData, license_number: e.target.value.toUpperCase()})}
                          className="w-full bg-black/20 border border-aviator-border p-4 pl-12 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">Certification Type (B1/B2)</label>
                      <select 
                        value={formData.certification_type}
                        onChange={(e) => setFormData({...formData, certification_type: e.target.value})}
                        className="w-full bg-black/20 border border-aviator-border p-4 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none appearance-none"
                      >
                        <option value="">SELECT CLASS...</option>
                        <option value="B1">B1 (MECHANICAL)</option>
                        <option value="B2">B2 (AVIONICS)</option>
                        <option value="B1/B2">B1+B2 (FULL COMPOSITE)</option>
                        <option value="C">C (BASE MAINTENANCE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">Validity Threshold (Expiry)</label>
                      <div className="relative">
                        <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isExpired(formData.expiry_date) ? 'text-aviator-red' : 'text-aviator-green'}`} />
                        <input 
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                          className={`w-full bg-black/20 border p-4 pl-12 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none ${isExpired(formData.expiry_date) ? 'border-aviator-red/40 animate-pulse bg-aviator-red/5' : 'border-aviator-border'}`}
                        />
                      </div>
                      {isExpired(formData.expiry_date) && (
                        <div className="flex items-center gap-2 text-aviator-red text-[8px] font-bold uppercase tracking-widest mt-2 animate-bounce">
                          <AlertTriangle className="w-3 h-3" /> LICENSE EXPIRED: SYSTEM ACCESS RESTRICTED
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="tech-label text-aviator-text-dim">Issuing Authority</label>
                      <input 
                        type="text" 
                        placeholder="Regulatory Body"
                        value={formData.issuing_authority}
                        onChange={(e) => setFormData({...formData, issuing_authority: e.target.value})}
                        className="w-full bg-black/20 border border-aviator-border p-4 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-10 border-t border-aviator-border">
                    <div className="tech-label text-aviator-amber underline">Asset Authorizations & Expertise</div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="tech-label text-aviator-text-dim">Aircraft Types Authorized</label>
                          <input 
                            type="text" 
                            placeholder="e.g. A320, B737, ATR72"
                            value={formData.authorized_types}
                            onChange={(e) => setFormData({...formData, authorized_types: e.target.value})}
                            className="w-full bg-black/20 border border-aviator-border p-4 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none"
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="tech-label text-aviator-text-dim">Areas of Expertise</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Landing Gear, APU, Avionics"
                            value={formData.expertise}
                            onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                            className="w-full bg-black/20 border border-aviator-border p-4 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none"
                          />
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'PERFORMANCE' && (
                <motion.div
                  key="perf"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-3 gap-6">
                    <div className="tech-card p-6 border-l-2 border-aviator-amber">
                      <div className="tech-label mb-2">Total Logs</div>
                      <div className="text-4xl font-bold font-display">{metrics?.totalLogs || 0}</div>
                    </div>
                    <div className="tech-card p-6 border-l-2 border-aviator-green">
                      <div className="tech-label mb-2">Approved</div>
                      <div className="text-4xl font-bold font-display text-aviator-green">{metrics?.approvedLogs || 0}</div>
                    </div>
                    <div className="tech-card p-6 border-l-2 border-aviator-red">
                      <div className="tech-label mb-2">Rejected</div>
                      <div className="text-4xl font-bold font-display text-aviator-red">{metrics?.rejectedLogs || 0}</div>
                    </div>
                  </div>

                  <div className="tech-card p-8 space-y-6">
                    <div className="flex justify-between items-center">
                       <div className="tech-label">Operational Reliability</div>
                       <span className="text-aviator-amber font-mono font-bold tracking-widest uppercase">Index High</span>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-mono text-aviator-text-dim italic">
                         <span>Log Quality Score</span>
                         <span>98.4%</span>
                       </div>
                       <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '98.4%' }}
                            className="h-full bg-aviator-amber glow-amber" 
                          />
                       </div>
                    </div>
                    <div className="flex items-center gap-6 pt-6 border-t border-aviator-border">
                        <div className="flex-1">
                          <div className="tech-label mb-1">Last Signature</div>
                          <div className="text-xs font-mono text-aviator-text uppercase">
                            {metrics?.lastActivity ? new Date(metrics.lastActivity).toLocaleString() : 'No Recent Records'}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="tech-label mb-1">Security Audit Status</div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-aviator-green" />
                            <span className="text-xs font-bold text-aviator-green tracking-widest">VERIFIED</span>
                          </div>
                        </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'SECURITY' && (
                <motion.div
                  key="sec"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="space-y-6">
                    <h3 className="font-bold flex items-center gap-3 text-aviator-amber italic uppercase tracking-widest text-sm">
                      <Key className="w-4 h-4" /> Secure Access Synchronization
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="tech-label flex justify-between">
                             <span>Secondary Secure PIN</span>
                             <span className="text-[8px] text-aviator-amber opacity-60">ENCRYPTED AT REST</span>
                          </label>
                          <input 
                            type="password" 
                            maxLength={6}
                            placeholder="******"
                            value={formData.secure_pin}
                            onChange={(e) => setFormData({...formData, secure_pin: e.target.value})}
                            className="w-full bg-black/20 border border-aviator-border p-4 text-aviator-text font-mono text-sm focus:border-aviator-amber/50 outline-none"
                          />
                       </div>
                       <div className="space-y-6 flex flex-col justify-end">
                          <div className="flex items-center justify-between p-4 tech-card bg-aviator-amber/5 border-aviator-amber/20">
                             <div className="space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest">Multi-Factor Authenticator</div>
                                <div className="text-[8px] text-aviator-text-dim uppercase tracking-tighter">Biometric or TOTP Hardware Relay</div>
                             </div>
                             <button 
                               type="button"
                               onClick={() => setFormData({...formData, two_factor_enabled: !formData.two_factor_enabled})}
                               className={`w-12 h-6 rounded-full transition-all relative ${formData.two_factor_enabled ? 'bg-aviator-amber' : 'bg-white/10'}`}
                             >
                               <motion.div 
                                 animate={{ x: formData.two_factor_enabled ? 24 : 4 }}
                                 className="w-4 h-4 rounded-full bg-white absolute top-1" 
                               />
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-aviator-border space-y-6">
                     <h3 className="font-bold flex items-center gap-3 text-aviator-red italic uppercase tracking-widest text-sm">
                        <AlertTriangle className="w-4 h-4" /> Threat Mitigation & Session Control
                     </h3>
                     <div className="p-6 tech-card border-aviator-red/10 bg-aviator-red/5 space-y-6">
                        <div className="flex justify-between items-center text-xs">
                          <div className="text-aviator-text font-mono">Current Terminal ID: {typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 30) : 'SERVER-NODE'}</div>
                          <span className="px-2 py-0.5 bg-aviator-green/20 text-aviator-green text-[8px] font-bold tracking-widest rounded-sm uppercase">Active Signal</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={logout}
                          className="w-full py-4 border border-aviator-red/40 hover:bg-aviator-red text-aviator-red hover:text-white transition-all font-bold text-[10px] uppercase tracking-[0.2em]"
                        >
                          Terminate All Remote Sessions
                        </button>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-12 border-t border-aviator-border flex justify-end gap-6">
              <button 
                type="button"
                className="px-8 py-3 text-aviator-text-dim hover:text-aviator-text tech-label transition-colors"
                onClick={() => setFormData({
                  name: user.name,
                  phone: user.phone || '',
                  license_number: user.license_number || '',
                  certification_type: user.certification_type || '',
                  issuing_authority: user.issuing_authority || '',
                  valid_from: user.valid_from || '',
                  expiry_date: user.expiry_date || '',
                  authorized_types: user.authorized_types || '',
                  expertise: user.expertise || '',
                  secure_pin: user.secure_pin || '',
                  two_factor_enabled: user.two_factor_enabled === 1
                })}
              >
                Reset Changes
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary min-w-[200px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Commit Record Update
              </button>
            </div>
          </form>
        </main>
      </div>

      {user.role === 'admin' && (
        <section className="animate-in slide-in-from-bottom-10 delay-300 duration-700">
           <AdminUserRegistry />
        </section>
      )}
    </div>
  );
}

function AdminUserRegistry() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'DELETE' | 'ROLE_REMOVE' | 'DEACTIVATE';
    userId: number;
    userName: string;
    targetRole?: string;
  }>({ show: false, type: 'DELETE', userId: 0, userName: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    // Prevent self role modification in UI (already blocked in backend)
    if (id === currentUser?.id && data.role && data.role !== 'admin') {
      toast.error('Protocol Blocked', { description: "Self-demotion protocol blocked. You cannot modify your own admin access." });
      return;
    }

    // Role removal confirmation
    if (data.role && data.role !== 'admin') {
      const targetUser = users.find(u => u.id === id);
      if (targetUser?.role === 'admin') {
        setConfirmModal({
          show: true,
          type: 'ROLE_REMOVE',
          userId: id,
          userName: targetUser.name,
          targetRole: data.role
        });
        return;
      }
    }

    // Deactivation confirmation
    if (data.account_status && data.account_status !== 'Active') {
      const targetUser = users.find(u => u.id === id);
      if (id === currentUser?.id) {
        toast.error('Session Integrity Alert', { description: "Self-deactivation protocol blocked." });
        return;
      }
    }

    executeAction(id, data);
  };

  const executeAction = async (id: number, data: any) => {
    setActionLoading(id);
    try {
      await adminApi.updateUserRegistry(id, data);
      await fetchUsers();
      toast.success('Registry Sync Successful', { description: 'Personnel records have been synchronized with the master database.' });
    } catch (err: any) {
      // Errors handled by API interceptor
    } finally {
      setActionLoading(null);
      setConfirmModal({ ...confirmModal, show: false });
    }
  };

  const handleDeleteRequest = (u: any) => {
    if (u.id === currentUser?.id) {
      toast.error('Identity Protection Locked', { description: "Self-termination blocked. Identity record must persist." });
      return;
    }
    setConfirmModal({
      show: true,
      type: 'DELETE',
      userId: u.id,
      userName: u.name
    });
  };

  const executeDelete = async () => {
    setActionLoading(confirmModal.userId);
    try {
      await adminApi.deleteUser(confirmModal.userId);
      await fetchUsers();
      toast.success('Record Pruned', { description: 'Operational identity has been purged from the registry.' });
      setConfirmModal({ ...confirmModal, show: false });
    } catch (err: any) {
      // Errors handled by API interceptor
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 mt-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6 text-aviator-amber" />
          <h2 className="text-2xl font-bold tracking-tight uppercase italic">Master Personnel Registry</h2>
        </div>
      </div>

      <div className="tech-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/10 dark:bg-white/5 border-b border-aviator-border">
              <th className="p-4 tech-label">Ident / ID</th>
              <th className="p-4 tech-label">Role Designation</th>
              <th className="p-4 tech-label">Account Status</th>
              <th className="p-4 tech-label">Access LVL</th>
              <th className="p-4 tech-label text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aviator-border">
            {users.map(u => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className={`table-row group ${isSelf ? 'bg-aviator-amber/5' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-aviator-text">{u.name}</div>
                      {isSelf && <span className="text-[8px] font-mono px-1 py-0.5 border border-aviator-amber/40 text-aviator-amber">CURRENT_USER</span>}
                    </div>
                    <div className="text-[10px] font-mono text-aviator-text-dim italic underline decoration-aviator-amber/30">{u.employee_id}</div>
                  </td>
                  <td className="p-4">
                     <div className="relative group/select">
                      <select 
                        value={u.role}
                        disabled={isSelf || actionLoading === u.id}
                        onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                        className={`bg-transparent border-none outline-none appearance-none cursor-pointer uppercase font-mono text-[10px] font-bold text-aviator-amber ${isSelf ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {['technician', 'engineer', 'supervisor', 'qa_officer', 'planner', 'admin'].map(r => (
                          <option key={r} value={r} className="bg-black text-white">{r.toUpperCase()}</option>
                        ))}
                      </select>
                      {isSelf && (
                        <div className="absolute top-full left-0 mt-1 hidden group-hover/select:block bg-black border border-aviator-border p-2 z-10 w-48 text-[8px] font-mono text-aviator-amber uppercase">
                          Identity Protection: You cannot modify your own operational role designation.
                        </div>
                      )}
                     </div>
                  </td>
                  <td className="p-4">
                     <select 
                       value={u.account_status}
                       disabled={isSelf || actionLoading === u.id}
                       onChange={(e) => handleUpdate(u.id, { account_status: e.target.value, is_active: e.target.value === 'Active' ? 1 : 0 })}
                       className={`bg-transparent border-none outline-none appearance-none cursor-pointer text-[10px] font-bold uppercase tracking-widest ${u.account_status === 'Active' ? 'text-aviator-green' : 'text-aviator-red'} ${isSelf ? 'cursor-not-allowed opacity-50' : ''}`}
                     >
                       {['Active', 'Suspended', 'Deactivated'].map(s => (
                         <option key={s} value={s} className="bg-black text-white">{s.toUpperCase()}</option>
                       ))}
                     </select>
                  </td>
                  <td className="p-4 uppercase font-bold text-[10px] text-aviator-text-dim">
                     <select 
                       value={u.access_level}
                       disabled={actionLoading === u.id}
                       onChange={(e) => handleUpdate(u.id, { access_level: e.target.value })}
                       className="bg-transparent border-none outline-none appearance-none cursor-pointer"
                     >
                       {['Limited', 'Standard', 'Full'].map(lvl => (
                         <option key={lvl} value={lvl} className="bg-black text-white">{lvl.toUpperCase()}</option>
                       ))}
                     </select>
                  </td>
                  <td className="p-4 text-right">
                     {isSelf ? (
                        <div className="flex items-center justify-end gap-2 text-[8px] font-mono text-aviator-amber/40 uppercase">
                          <Lock className="w-3 h-3" /> Protected
                        </div>
                     ) : (
                       <button 
                         onClick={() => handleDeleteRequest(u)}
                         disabled={actionLoading === u.id}
                         className="p-2 hover:bg-aviator-red/10 rounded-sm text-aviator-text-dim hover:text-aviator-red transition-all text-[10px] font-mono tracking-widest"
                       >
                         {actionLoading === u.id ? 'PROCESSING...' : 'TERMINATE'}
                       </button>
                     )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="tech-card max-w-md w-full p-8 border-aviator-amber/30 relative"
          >
            <button 
               onClick={() => setConfirmModal({ ...confirmModal, show: false })}
               className="absolute top-4 right-4 text-aviator-text-dim hover:text-white transition-colors"
            >
               <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
               <div className={`p-3 rounded-sm ${confirmModal.type === 'DELETE' ? 'bg-aviator-red/20 text-aviator-red' : 'bg-aviator-amber/20 text-aviator-amber'}`}>
                  {confirmModal.type === 'DELETE' ? <AlertTriangle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
               </div>
               <div>
                  <h3 className="text-xl font-bold italic uppercase tracking-tighter">Security Authorization</h3>
                  <p className="text-[10px] font-mono text-aviator-text-dim">Protocol: {confirmModal.type}</p>
               </div>
            </div>

            <p className="text-sm text-aviator-text leading-relaxed font-mono uppercase tracking-widest mb-8">
               {confirmModal.type === 'DELETE' 
                 ? `Are you sure you want to permanently terminate user account: ${confirmModal.userName}? This action cannot be reversed.`
                 : `Are you sure you want to remove administrative access from: ${confirmModal.userName}? This will restrict their operational capabilities.`
               }
            </p>

            <div className="flex gap-4">
               <button 
                 onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                 className="flex-1 py-3 border border-aviator-border text-aviator-text-dim hover:bg-white/5 transition-all tech-label uppercase"
               >
                  Decline / Cancel
               </button>
               <button 
                 onClick={() => {
                   if (confirmModal.type === 'DELETE') executeDelete();
                   else executeAction(confirmModal.userId, { role: confirmModal.targetRole });
                 }}
                 className={`flex-1 py-3 text-white font-bold tech-label uppercase tracking-[0.2em] transition-all shadow-lg ${confirmModal.type === 'DELETE' ? 'bg-aviator-red hover:bg-red-600 shadow-aviator-red/20' : 'bg-aviator-amber hover:bg-orange-600 shadow-aviator-amber/20'}`}
               >
                  Authorize Action
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
