import React, { useState, useEffect, useCallback } from 'react';
import { logApi, plannerApi } from '../../services/api';
import { History, TrendingUp, Calendar, Zap, Box, RefreshCw } from 'lucide-react';
import { useAircraft } from '../../context/AircraftContext';

export default function PlannerDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedAircraft } = useAircraft();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, iRes] = await Promise.all([
        logApi.getLogs(),
        plannerApi.getInsights(selectedAircraft?.aircraft_id)
      ]);
      
      let filteredLogs = lRes.data;
      if (selectedAircraft) {
        filteredLogs = lRes.data.filter((l: any) => l.aircraft_id === selectedAircraft.aircraft_id);
      }
      
      setLogs(filteredLogs);
      setInsights(iRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAircraft]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && logs.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Running Trend Analysis...</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div>
          <div className="tech-label text-aviator-amber mb-2">Fleet Planning Suite</div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8">
            TRENDS<span className="text-aviator-amber">&</span>HISTORY
          </h1>
          <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">
            Logistics Analysis // Asset: {selectedAircraft?.aircraft_id || 'GENERAL FLEET'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4 space-y-6">
          <div className="tech-card p-8 border-l-2 border-aviator-amber">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-5 h-5 text-aviator-amber" />
              <div className="tech-label text-aviator-amber text-[10px]">Planner Insights Engine</div>
            </div>
            <div className="space-y-6">
              {insights.length === 0 ? (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm text-center">
                  <Box className="w-6 h-6 text-aviator-text-dim mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest italic">
                    No recurring signatures detected in last 48h
                  </p>
                </div>
              ) : (
                insights.map((insight, idx) => (
                  <div key={idx} className="p-4 bg-aviator-amber/5 border border-aviator-amber/10 rounded-sm group hover:border-aviator-amber/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-mono text-aviator-amber font-bold uppercase tracking-wider">
                        SIGNATURE DETECTED: {insight.aircraft_id}
                      </span>
                      <Box className="w-3 h-3 text-aviator-amber animate-pulse" />
                    </div>
                    <p className="text-xs text-white font-display italic mb-3">"{insight.issue}"</p>
                    <div className="text-[9px] font-mono text-aviator-text-dim bg-black/40 p-2 border-l-2 border-aviator-amber/40">
                       PROPOSAL: {insight.suggestion}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

           <div className="tech-card p-8 border border-white/5 flex flex-col justify-between h-48 bg-white/[0.01]">
              <div className="tech-label flex items-center gap-2">
                <Box className="w-3 h-3 text-aviator-amber" /> Logistic Demand Index
              </div>
              <div>
                <div className="stat-value text-white text-4xl mb-1">STABLE</div>
                <div className="w-full bg-white/5 h-1 rounded-sm overflow-hidden">
                  <div className="bg-aviator-green h-full w-[100%] glow-green" />
                </div>
              </div>
              <p className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-widest">Supply link integrity verified level 1</p>
           </div>
        </div>

        <div className="col-span-8 tech-card overflow-hidden">
           <div className="p-6 border-b border-aviator-border bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-aviator-amber" />
                <span className="tech-label">Registry Archive Stream</span>
              </div>
              <div className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-tighter">
                {logs.length} RECORDED EVENTS
              </div>
            </div>
            <div className="divide-y divide-aviator-border">
               {logs.length === 0 ? (
                 <div className="p-20 text-center text-aviator-text-dim font-mono text-xs uppercase tracking-widest italic">
                    Empty record set for current parameters
                 </div>
               ) : (
                 logs.map(log => (
                   <div key={log.id} className="p-6 flex items-center gap-8 hover:bg-white/[0.02] transition-all cursor-pointer group">
                      <div className="w-10 h-10 rounded-sm bg-white/5 flex items-center justify-center text-white/20 group-hover:text-aviator-amber transition-colors">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white mb-1">
                          {log.aircraft_id} <span className="text-aviator-text-dim font-normal mx-2">//</span> {log.issue}
                        </div>
                        <div className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest">
                          {new Date(log.timestamp).toLocaleDateString()} <span className="mx-2 text-white/10">•</span> Chapter {log.ata_chapter}
                        </div>
                      </div>
                      <div className="text-right">
                         <Zap className="w-4 h-4 text-aviator-amber mb-2 float-right opacity-30 group-hover:opacity-100 transition-opacity" />
                         <div className="clear-both text-[10px] font-mono text-aviator-green uppercase tracking-widest font-bold">VERIFIED</div>
                      </div>
                   </div>
                 ))
               )}
            </div>
        </div>
      </div>
    </div>
  );
}
