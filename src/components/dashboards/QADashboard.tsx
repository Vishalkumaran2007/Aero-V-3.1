import React, { useState, useEffect, useCallback } from 'react';
import { logApi, qaApi } from '../../services/api';
import { ShieldCheck, AlertTriangle, Scale, Loader2, RefreshCw } from 'lucide-react';
import { useAircraft } from '../../context/AircraftContext';

export default function QADashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [validationResults, setValidationResults] = useState<{ [key: number]: any }>({});
  const { selectedAircraft } = useAircraft();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logApi.getLogs();
      let filteredLogs = res.data;
      
      if (selectedAircraft) {
        filteredLogs = res.data.filter((l: any) => l.aircraft_id === selectedAircraft.aircraft_id);
      }
      
      const pendingLogs = filteredLogs.filter((l: any) => l.compliance_status === 'pending' || l.compliance_status === 'invalid');
      setLogs(pendingLogs);
      
      // Auto-run validation engine for each pending log to suggest status
      pendingLogs.forEach(async (log: any) => {
        try {
          const vRes = await qaApi.validateLog({ action: log.action, component: log.component });
          setValidationResults(prev => ({ ...prev, [log.id]: vRes.data }));
        } catch (e) {
          console.error("Auto-validation failed for log", log.id);
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAircraft]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleValidation = async (log: any, status: 'valid' | 'invalid') => {
    setValidatingId(log.id);
    try {
      await logApi.updateCompliance(log.id, status);
      fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setValidatingId(null);
    }
  };

  if (loading && logs.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Scanning Regulatory Buffer...</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div>
          <div className="tech-label text-aviator-green mb-2">Quality Assurance Suite</div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-green/20 decoration-4 underline-offset-8">
            AUDIT<span className="text-aviator-green">PROTOCOL</span>
          </h1>
          <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">
            Compliance Verification // Asset: {selectedAircraft?.aircraft_id || 'GENERAL FLEET'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-6">
          {logs.length === 0 ? (
            <div className="tech-card p-20 text-center flex flex-col items-center justify-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-aviator-green opacity-20" />
              <p className="italic font-mono text-xs text-aviator-text-dim tracking-[0.3em] uppercase">
                Audit Registry Nominal // No Pending Discrepancies
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="tech-card overflow-hidden group border-l-2 border-white/5 hover:border-aviator-amber/30 transition-all">
                <div className="p-6 border-b border-aviator-border bg-black/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Scale className="w-4 h-4 text-aviator-amber" />
                    <span className="tech-label tracking-widest">REGULATORY INSPECTION // LOG #{log.id}</span>
                  </div>
                  <div className="text-[10px] font-mono text-aviator-text-dim uppercase">
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="p-8 grid grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <div className="tech-label mb-3 opacity-50">Observation Payload</div>
                      <div className="text-sm text-white font-medium mb-3 italic">"{log.issue}"</div>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
                        <div className="text-[9px] font-mono text-aviator-text-dim uppercase mb-1">Narrative Strategy</div>
                        <div className="text-[11px] text-slate-300 font-mono leading-relaxed">{log.action}</div>
                      </div>
                      
                      {validationResults[log.id] && (
                        <div className={`mt-6 p-4 rounded-sm border ${validationResults[log.id].status === 'valid' ? 'bg-aviator-green/5 border-aviator-green/20' : 'bg-aviator-red/5 border-aviator-red/20'}`}>
                          <div className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${validationResults[log.id].status === 'valid' ? 'text-aviator-green' : 'text-aviator-red'}`}>
                            {validationResults[log.id].status === 'valid' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            AI ENGINE HEURISTICS: {validationResults[log.id].status.toUpperCase()}
                          </div>
                          <div className="space-y-1.5">
                            {validationResults[log.id].errors.map((err: string, i: number) => (
                              <div key={i} className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">• {err}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 justify-center border-l border-aviator-border pl-12">
                    <button 
                      onClick={() => handleValidation(log, 'valid')}
                      disabled={validatingId !== null}
                      className="btn-primary w-full h-12 text-black bg-aviator-green hover:bg-emerald-400 border-none shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      {validatingId === log.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'AUTHORIZE ENTRY'}
                    </button>
                    <button 
                      onClick={() => handleValidation(log, 'invalid')}
                      disabled={validatingId !== null}
                      className="btn-danger w-full h-12"
                    >
                       {validatingId === log.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'REJECT / FLAG'}
                    </button>
                    <p className="text-[8px] font-mono text-center text-aviator-text-dim uppercase tracking-widest mt-2">
                       All decisions are logged for system accountability
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="col-span-4 space-y-6">
           <div className="tech-card p-8 border-l-2 border-aviator-green panel-gradient h-48 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-aviator-green glow-green" />
              <div className="tech-label text-aviator-green">Safety Assurance</div>
            </div>
            <p className="text-[11px] text-aviator-text-dim font-mono leading-relaxed italic pr-4">
              "Airworthiness is the product of continuous verification. Every entry must reflect the technical reality of the airframe."
            </p>
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest text-right">— QUALITY MANUAL 1.2</div>
          </div>
          
          <div className="tech-card p-8 bg-white/[0.01]">
            <div className="tech-label mb-6">Recent Discrepancies</div>
            <div className="space-y-6">
               {[1,2].map(i => (
                 <div key={i} className="flex gap-4 border-b border-aviator-border pb-6 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-sm bg-aviator-red/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-aviator-red" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white uppercase tracking-tighter mb-1">F-ASYM // N902XL // FLAP LOCK</div>
                      <div className="text-[9px] font-mono text-aviator-text-dim uppercase italic shadow-sm italic">Flagged as Vague 4hrs ago</div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
