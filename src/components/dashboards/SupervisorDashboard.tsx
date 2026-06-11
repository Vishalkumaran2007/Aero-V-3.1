import React, { useState, useEffect, useCallback } from 'react';
import { logApi, reportApi } from '../../services/api';
import { Users, Layout, Clock, BarChart3, ChevronRight, RefreshCw, Radio } from 'lucide-react';
import { useAircraft } from '../../context/AircraftContext';

import SupervisorSettings from './SupervisorSettings';

export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState<'OPS' | 'SETTINGS'>('OPS');
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selectedAircraft } = useAircraft();

  const fetchData = useCallback(async () => {
    if (activeTab === 'SETTINGS') return;
    setLoading(true);
    try {
      const [lRes, sRes] = await Promise.all([
        logApi.getLogs(),
        reportApi.getDailyReport()
      ]);
      
      let filteredLogs = lRes.data;
      if (selectedAircraft) {
        filteredLogs = lRes.data.filter((l: any) => l.aircraft_id === selectedAircraft.aircraft_id);
      }
      
      setLogs(filteredLogs.slice(0, 15));
      setStats(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedAircraft]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && activeTab === 'OPS' && logs.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Establishing Command Link...</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div className="space-y-8">
          <div>
            <div className="tech-label text-aviator-amber mb-2">Operations Control Center</div>
            <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8">
              OPS<span className="text-aviator-amber">COMMAND</span>
            </h1>
            <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">
              Fleet Management // Live Orchestration // {selectedAircraft?.aircraft_id || 'GENERAL'}
            </p>
          </div>
          
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('OPS')}
              className={`flex items-center gap-3 pb-4 text-[10px] font-display font-bold tracking-[0.25em] transition-all border-b-2 uppercase ${activeTab === 'OPS' ? 'text-aviator-amber border-aviator-amber shadow-[0_4px_10px_-5px_rgba(242,125,38,0.5)]' : 'text-aviator-text-dim border-transparent hover:text-white'}`}
            >
              <Layout className="w-4 h-4" /> FLEET OPERATIONS
            </button>
            <button 
              onClick={() => setActiveTab('SETTINGS')}
              className={`flex items-center gap-3 pb-4 text-[10px] font-display font-bold tracking-[0.25em] transition-all border-b-2 uppercase ${activeTab === 'SETTINGS' ? 'text-aviator-amber border-aviator-amber' : 'text-aviator-text-dim border-transparent hover:text-white'}`}
            >
              <Radio className="w-4 h-4" /> COMMS PROTOCOL
            </button>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'SETTINGS' ? (
          <SupervisorSettings />
        ) : (
          <div className="grid grid-cols-4 gap-8">
            <div className="col-span-3 space-y-6">
              <div className="tech-card overflow-hidden">
                <div className="p-6 border-b border-aviator-border bg-black/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layout className="w-4 h-4 text-aviator-amber" />
                    <span className="tech-label">Real-time Personnel Throughput</span>
                  </div>
                  <div className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest">
                    ACTIVE SESSIONS: 04
                  </div>
                </div>
                <div className="divide-y divide-aviator-border">
                  {logs.length === 0 ? (
                    <div className="p-20 text-center text-aviator-text-dim font-mono text-xs uppercase tracking-widest italic">
                      Zero operational telemetry for this asset
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 rounded-sm bg-white/5 flex flex-col items-center justify-center border border-white/5 group-hover:border-aviator-amber/30 transition-all">
                             <div className="text-[8px] font-mono text-aviator-text-dim leading-none uppercase">ID</div>
                             <div className="text-xs font-bold text-white font-mono">{log.aircraft_id.substring(0, 4)}</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white mb-1 group-hover:text-aviator-amber transition-colors italic">{log.issue}</div>
                            <div className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest font-bold">
                              {log.technician_id} <span className="text-white/10 mx-2">•</span> ATA {log.ata_chapter}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-4 py-1 rounded-sm text-[10px] font-display font-bold uppercase tracking-[0.2em] shadow-sm ${
                            log.status === 'approved' ? 'text-aviator-green bg-aviator-green/10 border border-aviator-green/20' :
                            log.status === 'rejected' ? 'text-aviator-red bg-aviator-red/10 border border-aviator-red/20' :
                            log.status === 'needs_review' ? 'text-sky-400 bg-sky-400/10 border border-sky-400/20 shadow-[0_0_8px_rgba(56,189,248,0.2)]' :
                            'text-aviator-amber bg-aviator-amber/10 border border-aviator-amber/20'
                          }`}>
                            {log.status.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-1 space-y-6">
              <div className="tech-card p-8 border-l-2 border-aviator-amber panel-gradient h-56 flex flex-col justify-between">
                <div className="tech-label text-aviator-amber flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 shadow-[0_0_10px_rgba(242,125,38,0.3)]" /> Cycle Efficiency
                </div>
                {stats && (
                  <div className="space-y-4">
                    <div className="stat-value text-white text-6xl italic">{stats.total || 0}</div>
                    <p className="text-[10px] font-mono text-aviator-text-dim leading-relaxed uppercase tracking-widest font-bold">
                      Fleet interactions verified in this 24hr cycle.
                    </p>
                    <div className="pt-6 border-t border-white/5 space-y-3">
                       <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest">
                        <span className="text-aviator-text-dim font-bold">Discrepancies</span>
                        <span className="text-aviator-red font-display italic font-bold">{stats.invalid || 0}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest">
                        <span className="text-aviator-text-dim font-bold">Health Level</span>
                        <span className="text-aviator-green font-display italic font-bold">OPTIMAL</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="tech-card p-8 bg-aviator-slate/10 border border-white/5 h-32 flex flex-col justify-between">
                 <div className="tech-label text-white/40">Network Latency</div>
                 <div className="flex items-end gap-1 h-8">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-aviator-amber/30 w-full" style={{ height: `${20 + Math.random() * 80}%` }} />
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
