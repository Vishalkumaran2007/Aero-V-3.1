import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  RefreshCw,
  MoreVertical,
  XCircle,
  FileSpreadsheet,
  Activity,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditLog } from '../../types';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ipSearchTerm, setIpSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs();
      setLogs(res.data);
      setLastSynced(new Date());
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    // Live update toggle - poll every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.performed_by.toLowerCase().includes(term) || 
        l.performed_by_email.toLowerCase().includes(term) ||
        (l.target_user && l.target_user.toLowerCase().includes(term)) ||
        l.action.toLowerCase().includes(term)
      );
    }

    if (ipSearchTerm) {
      const term = ipSearchTerm.toLowerCase();
      result = result.filter(l => 
        l.ip_address && l.ip_address.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }

    if (actionFilter !== 'all') {
      // Map display filters to action prefixes
      switch(actionFilter) {
        case 'Login': result = result.filter(l => l.action.includes('LOGIN')); break;
        case 'Role': result = result.filter(l => l.action.includes('ROLE')); break;
        case 'Aircraft': result = result.filter(l => l.action.includes('AIRCRAFT')); break;
        case 'Maintenance': result = result.filter(l => l.action.includes('MAINTENANCE')); break;
        case 'Export': result = result.filter(l => l.action.includes('EXPORT')); break;
        case 'Security': result = result.filter(l => ['SECRET_KEY_CHANGE', 'UNAUTHORIZED_ACCESS'].includes(l.action)); break;
      }
    }

    return result;
  }, [searchTerm, statusFilter, actionFilter, logs]);

  // Stats calculation from filtered data
  const stats = useMemo(() => {
    const threats = logs.filter(l => 
      l.status === 'Blocked' || 
      l.status === 'Failed' && l.action === 'USER_LOGIN' ||
      l.action === 'UNAUTHORIZED_ACCESS'
    ).length;

    return {
      total: logs.length,
      threats,
      successRate: logs.length ? Math.round((logs.filter(l => l.status === 'Success').length / logs.length) * 100) : 100
    };
  }, [logs]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleExportCSV = async () => {
    if (filteredLogs.length === 0) return;
    setExportingCSV(true);
    try {
      const res = await adminApi.exportAuditLogsCSV(filteredLogs);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("CSV Export failed", err);
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    if (filteredLogs.length === 0) return;
    setExportingPDF(true);
    try {
      const res = await adminApi.exportAuditLogsPDF(filteredLogs);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExportingPDF(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success': return <CheckCircle2 className="w-3.5 h-3.5 text-aviator-green" />;
      case 'Failed': return <XCircle className="w-3.5 h-3.5 text-aviator-red" />;
      case 'Blocked': return <Lock className="w-3.5 h-3.5 text-aviator-amber" />;
      default: return <Clock className="w-3.5 h-3.5 text-aviator-text-dim" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return 'text-aviator-green';
      case 'Failed': return 'text-aviator-red';
      case 'Blocked': return 'text-aviator-amber';
      default: return 'text-aviator-text-dim';
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-aviator-border pb-8 gap-6">
        <div>
          <div className="tech-label text-aviator-amber mb-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Security Intelligence Registry
          </div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8">
            Audit<span className="text-aviator-amber">Logs</span>
          </h1>
          <div className="flex items-center gap-4 mt-6">
             <div className="px-3 py-1 bg-black/40 border border-aviator-border rounded-sm flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-aviator-green glow-green' : 'bg-aviator-amber glow-amber'}`} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-aviator-text">
                  {isAdmin ? 'Admin Root Access' : 'Authority Observability'}
                </span>
             </div>
             <div className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-widest hidden md:block">
                Last Synced: {lastSynced.toLocaleTimeString()} // v4.2 Stable
             </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 border border-aviator-border hover:border-aviator-text/40 transition-all rounded-sm text-aviator-text-dim hover:text-white"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={handleExportCSV}
                disabled={exportingCSV || filteredLogs.length === 0}
                className="px-6 py-2 border border-aviator-border hover:border-aviator-amber/40 hover:bg-aviator-amber/10 text-aviator-text-dim hover:text-aviator-text transition-all rounded-sm flex items-center gap-2 tech-label group disabled:opacity-50"
              >
                {exportingCSV ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 group-hover:text-aviator-amber" />}
                <span>CSV</span>
              </button>
              <button 
                onClick={handleExportPDF}
                disabled={exportingPDF || filteredLogs.length === 0}
                className="px-6 py-2 border border-aviator-border hover:border-aviator-red/40 hover:bg-aviator-red/10 text-aviator-text-dim hover:text-aviator-red transition-all rounded-sm flex items-center gap-2 tech-label group disabled:opacity-50"
              >
                {exportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 group-hover:text-aviator-red" />}
                <span>PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="tech-card p-6 space-y-6 bg-black/10">
            <div className="tech-label text-aviator-amber border-b border-aviator-border pb-2 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Filters
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-tighter">Search Registry</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aviator-text-dim" />
                    <input 
                      type="text"
                      placeholder="User, Action, Entity..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-black/40 border border-aviator-border p-2.5 pl-10 text-[11px] font-mono text-aviator-text focus:border-aviator-amber/50 outline-none"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-tighter">IP Tracking</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aviator-text-dim" />
                    <input 
                      type="text"
                      placeholder="Filter by IP Address..."
                      value={ipSearchTerm}
                      onChange={(e) => { setIpSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-black/40 border border-aviator-border p-2.5 pl-10 text-[11px] font-mono text-aviator-text focus:border-aviator-amber/50 outline-none"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-tighter">Status</label>
                    <select 
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-black/40 border border-aviator-border p-2.5 text-[11px] font-mono text-aviator-text focus:border-aviator-amber/50 outline-none appearance-none"
                    >
                      <option value="all">ALL STATUSES</option>
                      <option value="Success">SUCCESSFUL</option>
                      <option value="Failed">FAILED</option>
                      <option value="Blocked">BLOCKED</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-tighter">Event Category</label>
                    <select 
                      value={actionFilter}
                      onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-black/40 border border-aviator-border p-2.5 text-[11px] font-mono text-aviator-text focus:border-aviator-amber/50 outline-none appearance-none"
                    >
                      <option value="all">ALL CATEGORIES</option>
                      <option value="Login">AUTHENTICATION</option>
                      <option value="Role">USER MANAGEMENT</option>
                      <option value="Aircraft">FLEET OPERATIONS</option>
                      <option value="Maintenance">MAINTENANCE</option>
                      <option value="Export">SYSTEM EXPORTS</option>
                      <option value="Security">SECURITY ALERTS</option>
                    </select>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => { setSearchTerm(''); setIpSearchTerm(''); setStatusFilter('all'); setActionFilter('all'); setCurrentPage(1); }}
              className="w-full py-2 text-[9px] font-mono text-aviator-text-dim hover:text-white transition-colors uppercase tracking-[0.2em]"
            >
              Clear Matrix
            </button>
          </div>

          <div className="tech-card p-6 bg-aviator-amber/5 border-aviator-amber/10">
             <div className="tech-label mb-4 opacity-60">Real-time Metrics</div>
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-aviator-text-dim uppercase flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Total Processed
                      </span>
                      <span className="text-xl font-bold font-display italic leading-none">{stats.total}</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-aviator-amber/40" style={{ width: '100%' }} />
                   </div>
                </div>

                <div>
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-aviator-text-dim uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-aviator-red" /> Security Threats
                      </span>
                      <span className="text-xl font-bold font-display italic text-aviator-red leading-none">{stats.threats}</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (stats.threats / (stats.total || 1)) * 100)}%` }}
                        className="h-full bg-aviator-red" 
                      />
                   </div>
                </div>

                <div>
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-aviator-text-dim uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-aviator-green" /> Validation Rate
                      </span>
                      <span className="text-xl font-bold font-display italic text-aviator-green leading-none">{stats.successRate}%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.successRate}%` }}
                        className="h-full bg-aviator-green" 
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="tech-card overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-aviator-border">
                    <th className="p-4 tech-label w-40">Timestamp</th>
                    <th className="p-4 tech-label">Operation</th>
                    <th className="p-4 tech-label">Initiator</th>
                    <th className="p-4 tech-label">Target Entity</th>
                    <th className="p-4 tech-label">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aviator-border">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-aviator-amber mx-auto mb-4" />
                        <div className="tech-label animate-pulse tracking-[0.3em]">Synching Global Registry...</div>
                      </td>
                    </tr>
                  ) : paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-24 text-center text-aviator-text-dim">
                        <ShieldAlert className="w-12 h-12 mx-auto mb-6 opacity-20" />
                        <div className="text-sm font-mono tracking-[0.2em] mb-2 uppercase">No audit events recorded yet.</div>
                        <button onClick={fetchLogs} className="text-[10px] text-aviator-amber hover:underline font-mono uppercase tracking-widest">Force Sync</button>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {paginatedLogs.map((log) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={log.id} 
                          className="table-row group hover:bg-white/[0.02]"
                        >
                          <td className="p-4 whitespace-nowrap">
                            <div className="text-[10px] font-mono text-white flex items-center gap-2">
                               <Clock className="w-3 h-3 text-aviator-text-dim" />
                               {new Date(log.timestamp).toLocaleString(undefined, {
                                 year: 'numeric', month: 'short', day: '2-digit',
                                 hour: '2-digit', minute: '2-digit', second: '2-digit'
                               })}
                            </div>
                            <div className="text-[8px] font-mono text-aviator-text-dim uppercase mt-1 pl-5">UTC-0 OFFSET</div>
                          </td>
                          <td className="p-4">
                            <div className="text-[11px] font-bold text-aviator-amber uppercase tracking-[0.15em] mb-1">{formatAction(log.action)}</div>
                            {log.details && (
                              <div className="text-[8px] font-mono text-aviator-text-dim truncate max-w-[150px]">
                                {log.details.startsWith('{') ? 'System Metadata Injected' : log.details}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-mono text-aviator-amber group-hover:border-aviator-amber/40 transition-all">
                                  {log.performed_by.substring(0, 2).toUpperCase()}
                               </div>
                               <div>
                                  <div className="text-[11px] font-bold text-white italic leading-tight">{log.performed_by}</div>
                                  <div className="text-[9px] font-mono text-aviator-text-dim lowercase leading-tight">{log.performed_by_email}</div>
                               </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Activity className="w-3 h-3 text-aviator-text-dim" />
                                  <span className="text-[11px] text-aviator-text italic">{log.target_user || 'Self Account'}</span>
                               </div>
                               <div className="text-[8px] font-mono text-aviator-text-dim uppercase pl-5">
                                  {log.target_user ? (log.target_user.includes('-') ? 'ASSET_ID' : 'USER_ACCOUNT') : 'OWN_SESSION'}
                               </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                               <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${getStatusColor(log.status)}`}>
                                  {getStatusIcon(log.status)}
                                  {log.status}
                               </div>
                               {log.reason && (
                                 <div className="text-[8px] font-mono text-aviator-text-dim border-l border-aviator-red/20 pl-2 mt-1 italic">
                                    {log.reason}
                                 </div>
                               )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-black/20 border-t border-aviator-border flex items-center justify-between">
                 <div className="text-[10px] font-mono text-aviator-text-dim uppercase">
                    Showing {paginatedLogs.length} of {filteredLogs.length} registry entries
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 border border-aviator-border hover:border-aviator-text/40 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-[10px] font-mono text-aviator-text px-4 uppercase tracking-widest">
                       Page {currentPage} <span className="opacity-40">/</span> {totalPages}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 border border-aviator-border hover:border-aviator-text/40 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6 justify-center">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-aviator-green glow-green" />
                <span className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-widest">Stream Active</span>
             </div>
             <div className="text-[9px] font-mono text-aviator-text-dim opacity-20 uppercase tracking-[0.5em]">
                Secure Sentinel Guard // v.4.2.0-Alpha
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
