/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  Download,
  Plane,
  RefreshCw,
  Clock,
  Activity
} from 'lucide-react';
import { logApi } from '../services/api';
import { useAircraft } from '../context/AircraftContext';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedAircraft } = useAircraft();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logApi.getLogs();
      // Filter by selected aircraft if one is selected
      let filteredLogs = res.data;
      if (selectedAircraft) {
        filteredLogs = res.data.filter((l: any) => l.aircraft_id === selectedAircraft.aircraft_id);
      }
      setLogs(filteredLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAircraft]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skylog_archive_${selectedAircraft?.aircraft_id || 'fleet'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading && logs.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-aviator-amber">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Synchronizing Data Link...</div>
    </div>
  );

  const discrepancies = logs.filter(l => l.is_draft || l.compliance_status === 'invalid').length;
  const { aircrafts } = useAircraft();

  // Real fleet metrics
  const activeFleet = aircrafts.filter(a => a.status === 'active').length;
  const availability = aircrafts.length > 0 ? (activeFleet / aircrafts.length) * 100 : 98.2;

  // Selected aircraft metrics
  const aCheckHours = selectedAircraft?.next_a_check ?? 12.5;
  const borescopeHours = selectedAircraft?.next_borescope ?? 44.0;
  const healthIndex = selectedAircraft?.health_index ?? 100;

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-aviator-border pb-12 mb-4">
        <div>
          <div className="tech-label text-aviator-amber mb-4 flex items-center gap-3">
            <span className="w-2 h-2 bg-aviator-amber rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            Operational Overview
          </div>
          <h1 className="text-6xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-8 underline-offset-[12px]">
            FLIGHT<span className="text-aviator-amber">REPORT</span>
          </h1>
          <div className="flex items-center gap-6 mt-12">
            <p className="text-aviator-text-dim text-[11px] uppercase tracking-[0.5em] font-bold border-l-2 border-aviator-amber pl-4">
              Resource: {selectedAircraft ? selectedAircraft.aircraft_id : 'ALL FLEET ASSETS'}
            </p>
            <div className="h-[1px] w-32 bg-aviator-border opacity-30" />
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] italic">
              Uplink: {selectedAircraft ? `LN-${selectedAircraft.serial_number.substring(0, 6)}` : 'FLEET_GLOBAL'}
            </div>
          </div>
        </div>
        <div className="flex gap-16">
          <div className="text-right group">
            <div className="tech-label text-aviator-red mb-2 transition-colors group-hover:text-white">Open Discrepancies</div>
            <div className="stat-value text-aviator-red glow-red text-6xl">{discrepancies.toString().padStart(2, '0')}</div>
          </div>
          <div className="text-right border-l border-aviator-border pl-16 group">
            <div className="tech-label mb-2 transition-colors group-hover:text-white">Asset Availability</div>
            <div className="stat-value text-6xl">{availability.toFixed(1)}<span className="text-2xl text-aviator-text-dim ml-1">%</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-10 pt-4">
        <div className="col-span-3 space-y-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-aviator-amber/5 flex items-center justify-center border border-aviator-amber/10">
                <Clock className="w-5 h-5 text-aviator-amber" />
              </div>
              <div>
                <span className="tech-label block text-white">Historical Event Stream</span>
                <span className="text-[9px] text-aviator-text-dim uppercase tracking-widest font-mono">Archive: Registry_01_Log</span>
              </div>
            </div>
            <button 
              onClick={exportLogs}
              className="btn-secondary h-11 px-8 hover:bg-aviator-amber/10 hover:text-aviator-amber transition-all"
            >
              <Download className="w-4 h-4" /> EXPORT SYSTEM DATA
            </button>
          </div>

          <div className="tech-card overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 border-b border-aviator-border text-aviator-text">
                  <th className="table-cell tech-label bg-transparent">Sig</th>
                  <th className="table-cell tech-label bg-transparent">Timeline</th>
                  <th className="table-cell tech-label bg-transparent">ATA</th>
                  <th className="table-cell tech-label bg-transparent">Narrative</th>
                  <th className="table-cell tech-label bg-transparent">Personnel</th>
                  <th className="table-cell tech-label bg-transparent"></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell text-center py-20 text-aviator-text-dim uppercase tracking-[0.2em] italic">
                      No logs recorded for this asset
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="table-row group">
                      <td className="table-cell pt-6">
                        {log.is_draft ? (
                          <div className="w-2 h-2 bg-aviator-amber rounded-full animate-pulse glow-amber" />
                        ) : log.compliance_status === 'valid' ? (
                          <CheckCircle2 className="w-4 h-4 text-aviator-green glow-green" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-aviator-red glow-red" />
                        )}
                      </td>
                      <td className="table-cell pt-6">
                        <div className="font-bold text-aviator-text mb-1">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} Z
                        </div>
                        <div className="text-[9px] text-aviator-text-dim uppercase">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="table-cell pt-6">
                        <span className="px-2 py-1 bg-aviator-amber/10 border border-aviator-amber/20 rounded-sm text-aviator-amber font-bold">
                          {log.ata_chapter}
                        </span>
                      </td>
                      <td className="table-cell pt-6">
                        <div className="text-sm font-medium text-aviator-text mb-1 group-hover:text-aviator-amber transition-colors">
                          {log.issue}
                        </div>
                        <div className="text-[9px] text-aviator-text-dim uppercase tracking-wider font-mono">
                          ACTION: {log.action?.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="table-cell pt-6">
                        <div className="text-aviator-text font-mono text-[10px] uppercase">{log.technician_id}</div>
                        <div className="text-[9px] text-aviator-text-dim uppercase italic">Verified Representative</div>
                      </td>
                      <td className="table-cell pt-6 text-right">
                        <ChevronRight className="w-4 h-4 text-aviator-text/20 group-hover:text-aviator-amber transition-all group-hover:translate-x-1" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-10">
          <div className="tech-card p-8 border-l-2 border-aviator-amber bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-sm bg-aviator-amber/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-aviator-amber" />
              </div>
              <div className="tech-label text-aviator-amber">Next Cycles</div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase font-bold tracking-widest text-aviator-text-dim">
                   <span>Major A-Check</span>
                   <span className="text-aviator-amber font-display italic">
                     {aCheckHours.toFixed(1)} HRS
                   </span>
                </div>
                <div className="w-full bg-black/5 dark:bg-white/5 h-1 rounded-sm overflow-hidden border border-aviator-border">
                  <div 
                    className="bg-aviator-amber h-full glow-amber transition-all duration-1000" 
                    style={{ width: `${Math.min(100, Math.max(5, (aCheckHours / 20.0) * 100))}%` }} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase font-bold tracking-widest text-aviator-text-dim">
                  <span>Engine Borescope</span>
                  <span className="text-sky-400 font-display italic">
                    {borescopeHours.toFixed(1)} HRS
                  </span>
                </div>
                <div className="w-full bg-black/5 dark:bg-white/5 h-1 rounded-sm overflow-hidden border border-aviator-border">
                  <div 
                    className="bg-sky-400 h-full shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, Math.max(5, (borescopeHours / 100.0) * 100))}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="tech-card p-6 border-l-2 border-aviator-green group relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 border border-aviator-green/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute right-8 top-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="relative">
                <div className="w-12 h-[1px] bg-aviator-green absolute top-6 -left-6" />
                <div className="w-[1px] h-12 bg-aviator-green absolute left-0 -top-0" />
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-sm bg-aviator-green/10 flex items-center justify-center text-aviator-green">
                <ShieldCheck className="w-4 h-4 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              </div>
              <div className="tech-label text-aviator-green">Health Index</div>
            </div>
            <div className="stat-value text-5xl group-hover:text-aviator-green transition-colors">
              {healthIndex}<span className="text-xl text-aviator-green italic">%</span>
            </div>
            <p className="text-[10px] text-aviator-text-dim uppercase font-mono mt-4 leading-relaxed max-w-[180px]">
              {healthIndex === 100 ? 'Airworthiness certified. All mission systems nominal.' : 'Maintenance flagged. Proceed with caution.'}
            </p>
          </div>

          <div className="tech-card p-6 relative overflow-hidden h-32 group">
            <div className="tech-label mb-2 flex justify-between">
              <span>Data Link Feed</span>
              <Activity className="w-3 h-3 text-aviator-amber animate-pulse" />
            </div>
            <div className="stat-value text-2xl text-aviator-text group-hover:text-aviator-amber transition-colors italic uppercase">
              {logs.length > 0 ? 'SYNCHRONIZED' : 'IDLE'}
            </div>
            <div className="absolute bottom-4 left-6 right-6 flex items-end gap-1.5 h-10 overflow-hidden">
              {[...Array(16)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="bg-aviator-amber/10 w-full relative"
                  animate={{ 
                    height: logs.length > 0 
                      ? [`${20 + Math.sin(Date.now()/1000 + i) * 30 + (logs.length % 5) * 10}%`, `${30 + Math.cos(Date.now()/800 + i) * 40}%`]
                      : "10%"
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-aviator-amber opacity-40" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
