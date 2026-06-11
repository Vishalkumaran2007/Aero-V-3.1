/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, AlertTriangle, ExternalLink, Loader2, BarChart3, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { logApi, reportApi } from '../services/api';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Compliance() {
  const { user } = useAuth();
  const [invalidLogs, setInvalidLogs] = useState<any[]>([]);
  const [reviewLogs, setReviewLogs] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [logsRes, reportRes] = await Promise.all([
        logApi.getLogs(),
        reportApi.getDailyReport()
      ]);
      const allLogs = logsRes.data;
      setInvalidLogs(allLogs.filter((l: any) => l.compliance_status === 'invalid' && l.status !== 'needs_review'));
      setReviewLogs(allLogs.filter((l: any) => l.status === 'needs_review'));
      setDailyStats(reportRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    setProcessingId(id);
    try {
      await logApi.updateStatus(id, status, 'Compliance verification automated note');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Running Regulatory Audit...</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-aviator-border pb-8">
        <div>
           <div className="tech-label text-aviator-amber mb-2">Surveillance Engine</div>
           <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8 text-white">
            COMPLIANCE<span className="text-aviator-amber">REPORT</span>
          </h1>
          <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">Regulatory Surveillance // Protocol Verification</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-aviator-green bg-aviator-green/5 px-4 py-2 border border-aviator-green/20 rounded-sm font-bold">
          <div className="w-2 h-2 bg-aviator-green rounded-full animate-pulse glow-green" />
          REGISTRY SYNC: OPTIMAL
        </div>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-3 space-y-6">
          <div className="tech-card overflow-hidden bg-white/[0.01]">
            <div className="p-6 border-b border-aviator-border bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-aviator-amber glow-amber" />
                <span className="tech-label tracking-widest uppercase">Compliance Surveillance Registry</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest font-bold">
                 Active flags: {invalidLogs.length + reviewLogs.length}
              </div>
            </div>

            <div className="divide-y divide-aviator-border">
              {invalidLogs.length === 0 && reviewLogs.length === 0 ? (
                <div className="p-24 text-center text-aviator-text-dim font-mono text-xs uppercase tracking-[0.3em] italic">
                   System Health Nominal // No active discrepancies detected
                </div>
              ) : (
                <>
                  {reviewLogs.map((item) => (
                    <div key={item.id} className="p-6 flex items-center justify-between hover:bg-sky-400/[0.03] transition-all group relative overflow-hidden">
                      <div className="flex items-center gap-8 flex-1">
                        <div className="w-1.5 h-12 bg-sky-400 opacity-30 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                        <div>
                          <div className="text-[10px] font-mono text-aviator-text-dim mb-1 group-hover:text-sky-400 transition-colors uppercase font-bold tracking-widest">
                            {item.aircraft_id} <span className="mx-2 opacity-30">/</span> ATA {item.ata_chapter}
                          </div>
                          <div className="text-lg font-bold text-white group-hover:text-sky-400 transition-all italic tracking-tight">
                            {item.issue}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-16 pr-6">
                        <div className="text-right border-l border-white/5 pl-8">
                          <div className="tech-label opacity-30 mb-2">Review Status</div>
                          <div className="text-xs font-mono text-sky-400 font-bold uppercase tracking-tighter">Needs Review</div>
                        </div>
                        <div className="w-44 flex flex-col gap-2">
                          {(user?.role === 'engineer' || user?.role === 'qa_officer' || user?.role === 'admin') ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleStatusUpdate(item.id, 'approved')}
                                disabled={processingId !== null}
                                className="flex-1 bg-aviator-green/20 border border-aviator-green/50 text-aviator-green text-[8px] py-1.5 font-bold uppercase tracking-widest hover:bg-aviator-green hover:text-black transition-all"
                              >
                                {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto"/> : 'APPROVE'}
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(item.id, 'rejected')}
                                disabled={processingId !== null}
                                className="flex-1 bg-aviator-red/20 border border-aviator-red/50 text-aviator-red text-[8px] py-1.5 font-bold uppercase tracking-widest hover:bg-aviator-red hover:text-white transition-all"
                              >
                                {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto"/> : 'REJECT'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] font-display px-6 py-2 border-2 border-sky-400/40 bg-sky-400/10 text-sky-400 tracking-[0.25em] uppercase font-bold shadow-[0_0_15px_rgba(56,189,248,0.1)] text-center">
                              PENDING ANALYSIS
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-sky-400 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                    </div>
                  ))}
                  {invalidLogs.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-aviator-red/[0.03] transition-all group relative overflow-hidden">
                    <div className="flex items-center gap-8 flex-1">
                      <div className="w-1.5 h-12 bg-aviator-red opacity-30 group-hover:opacity-100 transition-opacity glow-red" />
                      <div>
                        <div className="text-[10px] font-mono text-aviator-text-dim mb-1 group-hover:text-aviator-red transition-colors uppercase font-bold tracking-widest">
                          {item.aircraft_id} <span className="mx-2 opacity-30">/</span> ATA {item.ata_chapter}
                        </div>
                        <div className="text-lg font-bold text-white group-hover:text-aviator-red transition-all italic tracking-tight">
                          {item.issue}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-16 pr-6">
                      <div className="text-right border-l border-white/5 pl-8">
                        <div className="tech-label opacity-30 mb-2">Lead Technician</div>
                        <div className="text-xs font-mono text-white font-bold uppercase tracking-tighter">{item.technician_id}</div>
                      </div>
                      <div className="w-44 flex flex-col gap-2">
                        {(user?.role === 'engineer' || user?.role === 'qa_officer' || user?.role === 'admin') ? (
                          <button 
                            onClick={() => handleStatusUpdate(item.id, 'needs_review')}
                            disabled={processingId !== null}
                            className="w-full bg-sky-400/20 border border-sky-400/50 text-sky-400 text-[8px] py-1.5 font-bold uppercase tracking-widest hover:bg-sky-400 hover:text-black transition-all"
                          >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto"/> : 'FLAG FOR REVIEW'}
                          </button>
                        ) : (
                          <div className="text-[10px] font-display px-6 py-2 border-2 border-aviator-red/40 bg-aviator-red/10 text-aviator-red tracking-[0.25em] uppercase font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)] text-center">
                            CRITICAL DISCREPANCY
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-aviator-red translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                  </div>
                ))
              }
            </>
          )}
        </div>
      </div>
    </div>

        <div className="col-span-1 space-y-8">
          <div className="tech-card p-8 border-l-2 border-aviator-amber panel-gradient h-72 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-aviator-amber glow-amber" />
              <div className="tech-label text-white uppercase tracking-widest font-bold">Fleet Stats</div>
            </div>
            
            {dailyStats && (
              <div className="space-y-8">
                <div>
                  <div className="text-[10px] tech-label opacity-40 mb-2 uppercase font-bold">24hr Interaction Density</div>
                  <div className="text-5xl font-display font-bold text-white italic tracking-tighter">{dailyStats.total_logs} EB</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest font-bold">
                    <span className="text-white/40">Clean Rate</span>
                    <span className="text-aviator-green italic drop-shadow-md">{((dailyStats.valid_logs / (dailyStats.total_logs || 1)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-black/40 h-1.5 overflow-hidden rounded-full border border-white/5">
                    <motion.div 
                      className="bg-aviator-green h-full glow-green rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dailyStats.valid_logs / (dailyStats.total_logs || 1)) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5">
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest leading-relaxed font-bold italic">
                    Log rollup transmitted to {dailyStats.supervisor_email || 'OPS.CONTROL'} at 00:00Z
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="tech-card p-8 bg-white/[0.015] border border-white/5 flex flex-col justify-between opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-aviator-text-dim" />
              <div className="tech-label text-white uppercase tracking-widest font-bold">Cryptography</div>
            </div>
            <p className="text-[10px] text-aviator-text-dim font-mono leading-relaxed italic pr-4">
              "Every interaction is digitally verified via JWT (RFC 7519) and backed by SQLite transaction consistency hashes."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
