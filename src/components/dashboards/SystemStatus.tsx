import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Activity, Users, Cpu, Database, Clock, RefreshCw, Zap, Server } from 'lucide-react';
import { motion } from 'motion/react';

export default function SystemStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await adminApi.getSystemStatus();
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-aviator-green">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Establishing Telemetry Link...</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Activity className="w-6 h-6 text-aviator-green glow-green" />
            <div className="absolute inset-0 bg-aviator-green/20 blur-xl animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-display italic text-white uppercase tracking-tighter underline decoration-aviator-green/20">Operations Health Feed</h2>
        </div>
        <button 
          onClick={fetchStatus}
          disabled={refreshing}
          className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 text-[10px] font-mono text-white/40 hover:text-aviator-green hover:border-aviator-green/50 transition-all uppercase tracking-widest font-bold"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing Base' : 'Force Synchronize'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <MetricCard 
          icon={<Users className="w-5 h-5" />}
          label="Operational Units"
          value={status.activeUsers}
          subtext="Active SSE Channels"
          color="text-aviator-amber"
          glowColor="rgba(242, 125, 38, 0.2)"
        />
        <MetricCard 
          icon={<Zap className="w-5 h-5" />}
          label="Relay Latency"
          value={`${status.responseTime}ms`}
          subtext="V-Link Response"
          color="text-aviator-green"
          glowColor="rgba(16, 185, 129, 0.2)"
        />
        <MetricCard 
          icon={<Cpu className="w-5 h-5" />}
          label="Core Utilization"
          value={`${Math.round(status.serverLoad[0] * 100)}%`}
          subtext="CPU Average Load"
          color="text-sky-400"
          glowColor="rgba(56, 189, 248, 0.2)"
        />
        <MetricCard 
          icon={<Server className="w-5 h-5" />}
          label="Buffer Alloc"
          value={`${status.memoryUsage.used}MB`}
          subtext={`${status.memoryUsage.total}MB Capacity`}
          color="text-indigo-400"
          glowColor="rgba(129, 140, 248, 0.2)"
        />
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="tech-card p-10 space-y-10 group bg-white/[0.01]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-aviator-amber glow-amber" />
              <span className="tech-label text-white tracking-widest font-bold">Data Proliferation</span>
            </div>
            <div className="text-[10px] font-mono text-white/10 uppercase tracking-widest">Registry 4.0</div>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-white/5 pb-4 group-hover:border-aviator-amber/30 transition-colors">
              <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest font-bold">Authenticated Personas</span>
              <span className="text-3xl font-display font-bold text-white italic tracking-tighter">{status.dbStats.users.count}</span>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-4 group-hover:border-aviator-amber/30 transition-colors">
              <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest font-bold">Fleet telemetry density</span>
              <span className="text-3xl font-display font-bold text-white italic tracking-tighter">{status.dbStats.logs.count}</span>
            </div>
          </div>
        </div>

        <div className="tech-card p-10 h-full border-l-2 border-aviator-green panel-gradient flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-aviator-green glow-green" />
              <span className="tech-label text-aviator-green tracking-widest font-bold">Operational Cycle</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-display font-bold text-white tracking-tighter italic">
                {Math.floor(status.uptime / 3600)}h {Math.floor((status.uptime % 3600) / 60)}m
              </span>
              <div className="w-3 h-3 bg-aviator-green rounded-full animate-ping glow-green" />
            </div>
            <span className="text-[10px] font-mono text-aviator-text-dim mt-6 uppercase tracking-[0.4em] font-bold">
              Uninterrupted System Availability
            </span>
          </div>
        </div>
      </div>

      <div className="tech-card p-2 text-center font-mono text-[9px] text-white/10 uppercase tracking-[0.8em] mt-12 bg-black/20 italic">
        Operational Integrity Verified // System Protocol Alpha-9 // Regional Server Segment A-1
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subtext, color, glowColor }: any) {
  return (
    <div className="tech-card p-8 bg-white/[0.015] relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all">
      <div className={`absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-700 ${color}`}>
        {icon}
      </div>
      <div className={`flex items-center gap-3 mb-6 uppercase tracking-widest font-bold ${color}`}>
        {icon}
        <span className="tech-label text-[10px]">{label}</span>
      </div>
      <div className="space-y-2">
        <div className={`text-4xl font-display font-bold italic tracking-tighter ${color} drop-shadow-[0_0_10px_${glowColor}]`}>
          {value}
        </div>
        <div className="text-[10px] font-mono text-aviator-text-dim uppercase tracking-widest font-bold">{subtext}</div>
      </div>
      <motion.div 
        className={`absolute bottom-0 left-0 h-1 ${color.replace('text-', 'bg-')} opacity-20`}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
