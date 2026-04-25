import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, logApi } from '../../services/api';
import { Users, Trash2, Shield, Settings, Activity, Loader2, UserPlus, RefreshCw, Smartphone, X, Command } from 'lucide-react';
import { motion } from 'motion/react';

import AdminSettings from './AdminSettings';
import SystemStatus from './SystemStatus';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'USERS' | 'SECURITY' | 'SYSTEM'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [uRes, lRes, sRes] = await Promise.all([
        adminApi.getUsers(),
        logApi.getLogs(),
        adminApi.getSystemStatus()
      ]);
      setUsers(uRes.data);
      setLogs(lRes.data);
      setStatus(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setProcessingId(userId);
    setErrorMsg('');
    try {
      await adminApi.updateUserRegistry(userId, { role: newRole });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Role update failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (user: any) => {
    setProcessingId(user.id);
    setErrorMsg('');
    try {
      await adminApi.updateUserRegistry(user.id, { is_active: !user.is_active });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Status update failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setProcessingId(confirmDelete);
    setErrorMsg('');
    try {
      await adminApi.deleteUser(confirmDelete);
      setConfirmDelete(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Deletetion protocol failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && activeTab === 'USERS' && users.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Initializing Root Access...</div>
    </div>
  );

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* ERROR OVERLAY */}
      {errorMsg && (
        <div className="fixed top-12 right-12 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-aviator-red/10 border border-aviator-red/30 text-aviator-red p-8 font-mono text-[11px] uppercase tracking-[0.3em] flex items-center gap-6 backdrop-blur-2xl shadow-2xl border-l-[6px]">
            <Shield className="w-6 h-6 glow-red" /> 
            <div>
              <div className="font-bold text-white mb-1">SYSTEM OVERRIDE DETECTED</div>
              <div className="opacity-70">{errorMsg}</div>
            </div>
            <button onClick={() => setErrorMsg('')} className="ml-8 border border-white/20 w-8 h-8 flex items-center justify-center hover:bg-aviator-red/20 transition-all text-xl">×</button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 backdrop-blur-xl bg-black/90 font-mono">
           <div className="tech-card p-16 max-w-2xl w-full bg-aviator-slate border-2 border-aviator-red/50 space-y-10 animate-in zoom-in duration-300 shadow-[0_0_80px_rgba(244,63,94,0.2)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-aviator-red/20" />
              <button 
                onClick={() => setConfirmDelete(null)}
                className="absolute top-8 right-8 text-aviator-text-dim hover:text-aviator-red transition-all p-3 hover:bg-aviator-red/10 rounded-sm"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-aviator-red flex items-center gap-8 mb-6">
                <div className="w-16 h-16 rounded-sm bg-aviator-red/10 flex items-center justify-center border border-aviator-red/20">
                  <Shield className="w-8 h-8 glow-red" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-4xl italic uppercase tracking-tighter">Termination Protocol</h3>
                  <div className="text-[11px] uppercase tracking-[0.5em] opacity-50 mt-2">SECURE_LEVEL_ALPHA_CLEARANCE_REQUIRED</div>
                </div>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed italic border-l-4 border-aviator-red pl-8 py-4 bg-aviator-red/5">
                "Are you absolutely certain you wish to permanently remove this operational persona from the master registry? This action is terminal and non-recoverable."
              </p>
              <div className="flex gap-8 pt-8">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="btn-secondary flex-1 h-16 text-xs tracking-widest"
                >
                  ABORT COMMAND
                </button>
                <button 
                  onClick={handleDeleteUser}
                  disabled={processingId === confirmDelete}
                  className="btn-danger flex-1 h-16 shadow-2xl shadow-aviator-red/30 text-xs tracking-widest font-black"
                >
                  {processingId === confirmDelete ? 'PURGING...' : 'EXECUTE TERMINATION'}
                </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex items-end justify-between border-b border-aviator-border pb-12 mb-4">
        <div className="space-y-10">
          <div>
            <div className="tech-label text-aviator-amber mb-4 flex items-center gap-3">
              <Command className="w-4 h-4" />
              Administrative Command Center
            </div>
            <h1 className="text-6xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-8 underline-offset-[12px]">
              SYSTEM<span className="text-aviator-amber">CONTROL</span>
            </h1>
            <div className="flex items-center gap-8 mt-12">
              <p className="text-aviator-text-dim text-[11px] uppercase tracking-[0.6em] font-bold border-l-2 border-aviator-amber pl-4">Root Access Level 0 // Protocol Alpha-7</p>
              <div className="h-[1px] w-48 bg-aviator-border opacity-30" />
              <div className="flex gap-4">
                <span className="w-1.5 h-1.5 bg-aviator-amber rounded-full animate-ping shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span className="w-1.5 h-1.5 bg-aviator-amber rounded-full opacity-20" />
                <span className="w-1.5 h-1.5 bg-aviator-amber rounded-full opacity-20" />
              </div>
            </div>
          </div>
          
          <div className="flex bg-black/40 p-1.5 border border-aviator-border rounded-sm w-fit gap-2">
            <button 
              onClick={() => setActiveTab('USERS')}
              className={`flex items-center gap-4 px-8 py-3 text-[11px] font-mono font-black tracking-[0.3em] transition-all uppercase rounded-sm ${activeTab === 'USERS' ? 'bg-aviator-amber text-black shadow-2xl shadow-aviator-amber/20' : 'text-aviator-text-dim hover:text-white hover:bg-white/5'}`}
            >
              <Users className="w-4 h-4" /> PERSONNEL
            </button>
            <button 
               onClick={() => setActiveTab('SYSTEM')}
               className={`flex items-center gap-4 px-8 py-3 text-[11px] font-mono font-black tracking-[0.3em] transition-all uppercase rounded-sm ${activeTab === 'SYSTEM' ? 'bg-aviator-green text-black shadow-2xl shadow-aviator-green/20' : 'text-aviator-text-dim hover:text-white hover:bg-white/5'}`}
             >
              <Activity className="w-4 h-4" /> HEALTH
            </button>
            <button 
              onClick={() => setActiveTab('SECURITY')}
              className={`flex items-center gap-4 px-8 py-3 text-[11px] font-mono font-black tracking-[0.3em] transition-all uppercase rounded-sm ${activeTab === 'SECURITY' ? 'bg-aviator-red text-black shadow-2xl shadow-aviator-red/20' : 'text-aviator-text-dim hover:text-white hover:bg-white/5'}`}
            >
              <Shield className="w-4 h-4" /> SECURITY
            </button>
          </div>
        </div>
        
        {activeTab === 'USERS' && (
          <div className="flex gap-20">
            <div className="text-right group">
              <div className="tech-label text-aviator-amber mb-3 transition-colors group-hover:text-white">Deployment Base</div>
              <div className="stat-value text-white italic text-6xl">{users.length.toString().padStart(2, '0')} <span className="text-2xl text-aviator-text-dim ml-2 tracking-widest">UNITS</span></div>
            </div>
            <div className="text-right border-l border-aviator-border pl-20 group">
              <div className="tech-label mb-3 transition-colors group-hover:text-white">Core Integrity</div>
              <div className="stat-value text-aviator-green glow-green text-6xl">99<span className="text-3xl text-white">.99%</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 pt-4">
        {activeTab === 'SECURITY' ? (
          <AdminSettings />
        ) : activeTab === 'SYSTEM' ? (
          <SystemStatus />
        ) : (
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-8 space-y-10">
              <div className="tech-card overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-aviator-border bg-black/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-aviator-amber/5 border border-aviator-amber/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-aviator-amber" />
                    </div>
                    <div>
                      <span className="tech-label tracking-[0.3em] block text-white">Master Personnel Registry</span>
                      <span className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-widest italic">V-LINK Authority Console</span>
                    </div>
                  </div>
                  <div className="flex gap-6">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-aviator-green rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest font-black">Live Sync Alpha</span>
                     </div>
                  </div>
                </div>
                <div className="divide-y divide-aviator-border">
                  {users.map((user) => (
                    <div key={user.id} className="p-6 flex items-center justify-between hover:bg-white/[0.015] transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-sm bg-white/5 border border-white/5 flex items-center justify-center font-mono text-aviator-amber text-lg font-bold group-hover:border-aviator-amber/30 transition-all">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-base font-bold text-white group-hover:text-aviator-amber transition-colors italic">{user.name}</div>
                          <div className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest mt-1">{user.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end gap-1">
                           <div className={`text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 ${user.is_active ? 'text-aviator-green' : 'text-aviator-red'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-aviator-green animate-pulse glow-green' : 'bg-aviator-red'}`} />
                             {user.is_active ? 'REGULATED' : 'REVOKED'}
                           </div>
                           <button 
                            onClick={() => handleToggleStatus(user)}
                            disabled={processingId === user.id}
                            className={`text-[8px] font-mono font-bold px-2 py-0.5 border transition-all mt-1 uppercase tracking-widest ${
                              user.is_active 
                                ? 'border-aviator-red/20 text-aviator-red/40 hover:text-aviator-red hover:border-aviator-red' 
                                : 'border-aviator-green/20 text-aviator-green/40 hover:text-aviator-green hover:border-aviator-green'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Restore'}
                          </button>
                        </div>

                        <div className="flex items-center gap-4 border-l border-aviator-border pl-8">
                          <div className="relative">
                            <select 
                              value={user.role}
                              disabled={processingId === user.id}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="bg-black/40 border border-white/5 text-[10px] font-mono text-aviator-amber px-4 py-2 focus:border-aviator-amber/50 outline-none appearance-none cursor-pointer uppercase tracking-widest font-bold min-w-[120px]"
                            >
                              <option value="technician">TECHNICIAN</option>
                              <option value="engineer">ENGINEER</option>
                              <option value="supervisor">SUPERVISOR</option>
                              <option value="qa_officer">QA_OFFICER</option>
                              <option value="planner">PLANNER</option>
                              <option value="admin">ADMIN</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                              <Settings className="w-3 h-3 text-aviator-amber" />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setConfirmDelete(user.id)}
                            disabled={processingId === user.id}
                            className="w-10 h-10 rounded-sm bg-aviator-red/5 hover:bg-aviator-red/20 border border-aviator-red/10 hover:border-aviator-red transition-all flex items-center justify-center text-aviator-red group/del"
                          >
                            <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-4 space-y-8">
               <div className="tech-card p-8 border-l-2 border-aviator-amber panel-gradient">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-aviator-amber glow-amber" />
                    <div className="tech-label text-aviator-amber text-[10px]">Data Flow Cycle</div>
                  </div>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">LIVE V-LINK</div>
                </div>
                <div className="h-40 flex items-end gap-1.5 px-2 relative group">
                   {/* Data Flow Cycle Visualizer - Driven by Server Load & Latency */}
                   {[...Array(24)].map((_, i) => (
                     <motion.div 
                      key={i} 
                      className="bg-aviator-amber/10 w-full rounded-t-sm"
                      animate={{ 
                        height: status ? [
                          `${20 + (status.serverLoad[0] * 40) + Math.sin(Date.now() / 500 + i) * 10}%`, 
                          `${20 + (status.serverLoad[0] * 50) + Math.cos(Date.now() / 400 + i) * 15}%`
                        ] : "20%" 
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                     />
                   ))}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm p-4 text-[8px] text-aviator-amber font-mono text-center uppercase tracking-widest leading-relaxed">
                     Visualizing Telemetry Throughput & System Pulse Frequency. Reflects Real-Time Server Load Cycles.
                   </div>
                </div>
                <div className="mt-6 flex justify-between text-[9px] font-mono text-aviator-text-dim uppercase tracking-[0.4em] font-bold">
                   <span>00:00Z</span>
                   <span>T-DELTA</span>
                   <span>REALTIME</span>
                </div>
              </div>

              <div className="tech-card p-8 border border-white/5 space-y-6 bg-white/[0.01]">
                 <div className="tech-label text-white/40 flex items-center gap-3 uppercase tracking-widest">
                   <Settings className="w-4 h-4 text-aviator-amber" /> Heartbeat Telemetry
                 </div>
                 <div className="space-y-4">
                   <div className="flex justify-between items-center bg-black/20 p-3 border border-white/5 rounded-sm">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-aviator-text-dim">I/O Response</span>
                      <span className={`font-bold font-mono tracking-tighter text-xs ${status?.responseTime < 50 ? 'text-aviator-green' : 'text-aviator-amber'}`}>
                        {status ? `${status.responseTime}ms` : 'SYNCING...'}
                      </span>
                   </div>
                   <div className="flex justify-between items-center bg-black/20 p-3 border border-white/5 rounded-sm">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-aviator-text-dim">Active Units</span>
                      <span className="text-aviator-amber font-bold font-mono tracking-tighter text-xs">
                        {status?.activeUsers || 0} CHANNEL{status?.activeUsers !== 1 ? 'S' : ''}
                      </span>
                   </div>
                   <div className="flex justify-between items-center bg-black/20 p-3 border border-white/5 rounded-sm">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-aviator-text-dim">Registry Pulse</span>
                      <span className="text-aviator-green font-bold font-mono tracking-tighter text-xs">
                        {status ? 'NOMINAL' : 'WAITING...'}
                      </span>
                   </div>
                 </div>
              </div>

              <div className="tech-card p-8 flex flex-col justify-between h-32 relative overflow-hidden">
                <Smartphone className="absolute -right-4 -bottom-4 w-24 h-24 text-white/[0.02] -rotate-12" />
                <div className="tech-label text-white/40 uppercase tracking-widest text-[9px]">Encryption Protocol</div>
                <div className="text-xl font-bold text-white font-mono tracking-tight underline decoration-aviator-amber/20">AES-256-GCM</div>
                <div className="text-[9px] font-mono text-aviator-green uppercase tracking-widest font-bold">FIPS 140-2 COMPLIANT</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
