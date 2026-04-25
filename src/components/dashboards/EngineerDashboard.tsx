import React, { useState, useEffect, useCallback } from 'react';
import { logApi } from '../../services/api';
import { CheckCircle2, XCircle, FileText, Loader2, RefreshCw, Settings } from 'lucide-react';
import { useAircraft } from '../../context/AircraftContext';

export default function EngineerDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [certNote, setCertNote] = useState('');
  const { selectedAircraft } = useAircraft();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logApi.getLogs();
      let filteredLogs = res.data;
      
      if (selectedAircraft) {
        filteredLogs = res.data.filter((l: any) => l.aircraft_id === selectedAircraft.aircraft_id);
      }
      
      setLogs(filteredLogs.filter((l: any) => l.status === 'pending' || l.status === 'needs_review'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAircraft]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await logApi.updateStatus(id, status, certNote);
      setCertNote('');
      fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && logs.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Syncing Certification Queue...</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
       <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div>
          <div className="tech-label text-aviator-amber mb-2">Technical Authority</div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8">
            CERTIFICATION<span className="text-aviator-amber">SUITE</span>
          </h1>
          <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">
            Engineering Verification // Asset: {selectedAircraft?.aircraft_id || 'GENERAL FLEET'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {logs.length === 0 ? (
          <div className="tech-card p-24 text-center flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
              <CheckCircle2 className="w-8 h-8 text-aviator-green opacity-20" />
            </div>
            <p className="italic font-mono text-xs text-aviator-text-dim tracking-[0.3em] uppercase">
              Certification Buffer Nominal // No Pending Review
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="tech-card p-8 grid grid-cols-12 gap-12 items-start border-l-2 border-white/5 hover:border-aviator-amber/30 transition-all bg-white/[0.01]">
              <div className="col-span-3 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-aviator-amber rounded-full animate-pulse glow-amber" />
                  <span className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest">REGISTRY: {log.aircraft_id}</span>
                </div>
                <div className="text-2xl font-bold text-white uppercase italic tracking-tight underline decoration-aviator-amber/20 decoration-2 underline-offset-4">
                  {log.component}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-aviator-amber/10 border border-aviator-amber/20 rounded-sm">
                  <span className="tech-label text-aviator-amber text-[9px]">ATA CHAPTER {log.ata_chapter}</span>
                </div>
              </div>

              <div className="col-span-5 space-y-8 border-l border-white/5 pl-12">
                <div className="space-y-3">
                  <div className="tech-label text-[9px] opacity-40 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-aviator-amber rounded-full" />
                    Field Observation
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic border-l border-white/10 pl-4 py-1">
                    "{log.issue}"
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="tech-label text-[9px] opacity-40 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-aviator-amber rounded-full" />
                    Technical Countermeasure
                  </div>
                  <div className="p-4 bg-black/20 border border-white/5 rounded-sm">
                    <p className="text-[11px] text-aviator-text-dim font-mono leading-relaxed">{log.action}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-4 space-y-6 border-l border-white/5 pl-12">
                <div className="space-y-3">
                  <label className="tech-label text-[9px] text-aviator-amber uppercase tracking-widest flex items-center gap-2 font-bold">
                    <Settings className="w-3 h-3" /> Mandatory Statement
                  </label>
                  <textarea 
                    value={processingId === log.id ? certNote : ''}
                    disabled={processingId !== null && processingId !== log.id}
                    onChange={(e) => {
                      setProcessingId(log.id);
                      setCertNote(e.target.value);
                    }}
                    className="w-full bg-black/40 border border-white/10 p-4 text-[11px] text-slate-300 font-mono focus:border-aviator-amber/50 outline-none transition-all h-28 resize-none shadow-inner"
                    placeholder="Document compliance verification details or define required corrective measures for rejection..."
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleStatusUpdate(log.id, 'approved')}
                    disabled={processingId !== null}
                    className="flex-1 btn-primary h-12 text-black bg-aviator-green hover:bg-emerald-400 border-none shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  >
                    {processingId === log.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : <CheckCircle2 className="w-4 h-4" />} 
                    <span className="ml-2">RELEASE</span>
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(log.id, 'rejected')}
                    disabled={processingId !== null}
                    className="flex-1 btn-danger h-12"
                  >
                    {processingId === log.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : <XCircle className="w-4 h-4" />} 
                    <span className="ml-2">DENY</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
