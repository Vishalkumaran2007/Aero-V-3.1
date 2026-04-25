import React, { useState, useEffect, useCallback } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  performed_by: string;
  performed_by_email: string;
  target_user: string | null;
  target_user_email: string | null;
  old_role: string | null;
  new_role: string | null;
  status: 'Success' | 'Failed' | 'Blocked';
  reason: string | null;
  details: string | null;
}

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs();
      setLogs(res.data);
      setFilteredLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    let result = logs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.performed_by.toLowerCase().includes(term) || 
        (l.target_user && l.target_user.toLowerCase().includes(term)) ||
        l.action.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }

    if (actionFilter !== 'all') {
      result = result.filter(l => l.action === actionFilter);
    }

    setFilteredLogs(result);
  }, [searchTerm, statusFilter, actionFilter, logs]);

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
      case 'Blocked': return <AlertTriangle className="w-3.5 h-3.5 text-aviator-amber" />;
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

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div>
          <div className="tech-label text-aviator-amber mb-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Operational Audit Registry
          </div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8">
            Sentinel<span className="text-aviator-amber">Logs</span>
          </h1>
          <div className="flex items-center gap-4 mt-6">
             <div className="px-3 py-1 bg-black/40 border border-aviator-border rounded-sm flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-aviator-green glow-green' : 'bg-aviator-amber glow-amber'}`} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-aviator-text">
                  {isAdmin ? 'Full Execution Access' : 'Read-Only Observability'}
                </span>
             </div>
             <div className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-widest hidden md:block">
                Kernel: AV-OS v4.2 // Secure Signal Alpha
             </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-4">
            <button 
              onClick={handleExportCSV}
              disabled={exportingCSV || filteredLogs.length === 0}
              className="px-6 py-2 border border-aviator-border hover:border-aviator-amber/40 hover:bg-aviator-amber/10 text-aviator-text-dim hover:text-aviator-text transition-all rounded-sm flex items-center gap-2 tech-label group disabled:opacity-50"
            >
              {exportingCSV ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 group-hover:text-aviator-amber" />}
              <span>CSV EXPORT</span>
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={exportingPDF || filteredLogs.length === 0}
              className="px-6 py-2 border border-aviator-border hover:border-aviator-red/40 hover:bg-aviator-red/10 text-aviator-text-dim hover:text-aviator-red transition-all rounded-sm flex items-center gap-2 tech-label group disabled:opacity-50"
            >
              {exportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 group-hover:text-aviator-red" />}
              <span>PDF REPORT</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="tech-card p-6 space-y-6 bg-black/10">
            <div className="tech-label text-aviator-amber border-b border-aviator-border pb-2 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Filter Parameters
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[9px] font-mono text-aviator-text-dim uppercase">Search Entity</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aviator-text-dim" />
                    <input 
                      type="text"
                      placeholder="Name, Action, Target..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-aviator-border p-2.5 pl-10 text-[11px] font-mono text-aviator-text focus:border-aviator-amber/50 outline-none"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-mono text-aviator-text-dim uppercase">Action Status</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-black/40 border border-aviator-border p-2.5 text-[11px] font-mono text-aviator-text focus:border-aviator-amber/50 outline-none appearance-none"
                  >
                    <option value="all">ALL STATUSES</option>
                    <option value="Success">SUCCESSFUL</option>
                    <option value="Failed">FAILED</option>
                    <option value="Blocked">INTERCEPTED</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-mono text-aviator-text-dim uppercase">Transaction Type</label>
                  <select 
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full bg-black/40 border border-aviator-border p-2.5 text-[11px] font-mono text-aviator-text focus:border-aviator-amber/50 outline-none appearance-none"
                  >
                    <option value="all">ALL ACTIONS</option>
                    <option value="USER_LOGIN">USER LOGIN</option>
                    <option value="ADMIN_USER_UPDATE">USER UPDATE</option>
                    <option value="USER_DELETION">USER DELETION</option>
                    <option value="ADMIN_ROLE_REMOVAL">ROLE REMOVAL</option>
                    <option value="SECRET_KEY_CHANGE">KEY CHANGE</option>
                  </select>
               </div>
            </div>

            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setActionFilter('all'); }}
              className="w-full py-2 text-[9px] font-mono text-aviator-text-dim hover:text-white transition-colors uppercase tracking-widest"
            >
              Reset Filters
            </button>
          </div>

          <div className="tech-card p-6 bg-aviator-amber/5 border-aviator-amber/10">
             <div className="tech-label mb-4">Integrity Summary</div>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] text-aviator-text-dim uppercase">Total Processed</span>
                   <span className="text-xl font-bold font-display italic">{logs.length}</span>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-[10px] text-aviator-text-dim uppercase">Security Threats</span>
                   <span className="text-xl font-bold font-display italic text-aviator-red">{logs.filter(l => l.status === 'Blocked').length}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="tech-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-aviator-border">
                    <th className="p-4 tech-label">Timestamp</th>
                    <th className="p-4 tech-label">Operation</th>
                    <th className="p-4 tech-label">Initiator</th>
                    <th className="p-4 tech-label">Target Entity</th>
                    <th className="p-4 tech-label">Status</th>
                    <th className="p-4 tech-label text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aviator-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-aviator-amber mx-auto mb-4" />
                        <div className="tech-label animate-pulse">Syncing Audit Registry...</div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-aviator-text-dim">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-4 opacity-20" />
                        <div className="tech-label uppercase">No audit entries found Matching criteria</div>
                      </td>
                    </tr>
                  ) : filteredLogs.map((log) => (
                    <tr key={log.id} className="table-row group">
                      <td className="p-4">
                        <div className="text-[10px] font-mono text-white">{new Date(log.timestamp).toLocaleString()}</div>
                        <div className="text-[8px] font-mono text-aviator-text-dim uppercase mt-1">UTC STAMP</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[11px] font-bold text-aviator-amber uppercase tracking-widest">{log.action.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-sm bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-mono text-aviator-amber group-hover:border-aviator-amber/30 transition-all">
                              {log.performed_by.substring(0, 2).toUpperCase()}
                           </div>
                           <div>
                              <div className="text-[11px] font-bold text-white italic">{log.performed_by}</div>
                              <div className="text-[8px] font-mono text-aviator-text-dim uppercase">{log.performed_by_email}</div>
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[11px] text-aviator-text italic">{log.target_user || 'SYSTEM KERNEL'}</div>
                        <div className="text-[8px] font-mono text-aviator-text-dim uppercase mt-1">{log.target_user_email || 'INTERNAL OPERATION'}</div>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${getStatusColor(log.status)}`}>
                           {getStatusIcon(log.status)}
                           {log.status}
                        </div>
                        {log.reason && (
                           <div className="text-[8px] font-mono text-aviator-text-dim mt-1 max-w-[150px] truncate" title={log.reason}>
                              {log.reason}
                           </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                         <button className="p-2 text-aviator-text-dim hover:text-aviator-amber transition-colors">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
