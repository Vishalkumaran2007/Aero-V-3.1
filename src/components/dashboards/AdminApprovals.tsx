import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  Search,
  Check,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { aircraftApi } from '../../services/api';

export default function AdminApprovals() {
  const [pendingAssets, setPendingAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await aircraftApi.getPending();
      setPendingAssets(res.data);
    } catch (err) {
      console.error("Failed to fetch pending assets", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await aircraftApi.approve(id, action);
      setPendingAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Action execution failed", err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="tech-label mb-2">Fleet Command</div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase italic">Pending Registry Approvals</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="tech-card p-4 flex items-center justify-between">
          <span className="tech-label">Awaiting Verification</span>
          <span className="text-2xl font-bold text-aviator-amber">{pendingAssets.length}</span>
        </div>
      </div>

      <div className="tech-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 dark:bg-white/5">
              <th className="table-cell tech-label bg-transparent">Asset ID</th>
              <th className="table-cell tech-label bg-transparent">Technical Specs</th>
              <th className="table-cell tech-label bg-transparent">Registry Origin</th>
              <th className="table-cell tech-label bg-transparent">Timestamp</th>
              <th className="table-cell tech-label bg-transparent text-right">Verification Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {pendingAssets.map((a) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={a.id} 
                  className="table-row group"
                >
                  <td className="table-cell font-bold text-aviator-amber">{a.aircraft_id}</td>
                  <td className="table-cell">
                    <div className="font-bold text-aviator-text">{a.type}</div>
                    <div className="text-[10px] text-aviator-text-dim uppercase">{a.manufacturer} // MSN: {a.serial_number}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                       <Shield className="w-3.5 h-3.5 text-aviator-text-dim" />
                       <span className="text-[11px] font-mono text-aviator-text uppercase">{a.created_by_role}</span>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-[10px] text-aviator-text-dim uppercase">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        disabled={processing === a.id}
                        onClick={() => handleAction(a.id, 'reject')}
                        className="p-2 hover:bg-aviator-red/10 rounded-sm text-aviator-text-dim hover:text-aviator-red transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Reject</span>
                      </button>
                      <button 
                        disabled={processing === a.id}
                        onClick={() => handleAction(a.id, 'approve')}
                        className="bg-aviator-green/10 hover:bg-aviator-green text-aviator-green hover:text-black p-2 rounded-sm transition-all flex items-center gap-1.5 border border-aviator-green/20"
                      >
                        {processing === a.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider">Approve</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {pendingAssets.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="text-center py-24 text-aviator-text-dim font-mono text-xs uppercase tracking-[0.3em]">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20 text-aviator-green" />
                  All Registry Records Verified
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-24">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-aviator-amber" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
