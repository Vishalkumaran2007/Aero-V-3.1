import React, { useState, useEffect } from 'react';
import { supervisorApi } from '../../services/api';
import { Bell, Save, Loader2, CheckCircle2, Radio } from 'lucide-react';
import { motion } from 'motion/react';

export default function SupervisorSettings() {
  const [settings, setSettings] = useState<any>({
    receive_new_logs: false,
    receive_invalid_logs: true,
    receive_critical_alerts: true,
    receive_daily_reports: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await supervisorApi.getSettings();
      setSettings({
        receive_new_logs: !!res.data.receive_new_logs,
        receive_invalid_logs: !!res.data.receive_invalid_logs,
        receive_critical_alerts: !!res.data.receive_critical_alerts,
        receive_daily_reports: !!res.data.receive_daily_reports
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await supervisorApi.updateSettings(settings);
      setMessage('Configuration Synchronized');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Sync Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-aviator-amber">
      <Loader2 className="w-8 h-8 animate-spin" />
      <div className="tech-label animate-pulse">Syncing Communication Profile...</div>
    </div>
  );

  return (
    <div className="space-y-12 max-w-2xl animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div>
          <div className="tech-label text-aviator-amber mb-2">Comms Logic</div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8">
            SIGNAL<span className="text-aviator-amber">GATES</span>
          </h1>
          <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">Protocol Configuration // Notification Overrides</p>
        </div>
      </div>

      <div className="tech-card overflow-hidden bg-white/[0.01]">
        <div className="p-8 space-y-10">
          <div className="space-y-8">
            <SettingToggle 
              label="Fleet Telemetry Streams" 
              description="Real-time updates for every entry recorded by maintenance personnel."
              enabled={settings.receive_new_logs}
              onToggle={() => handleToggle('receive_new_logs')}
            />
            <SettingToggle 
              label="Compliance Discrepancy Alerts" 
              description="Priority triggers for entries flagged as regulatory non-compliant."
              enabled={settings.receive_invalid_logs}
              onToggle={() => handleToggle('receive_invalid_logs')}
            />
            <SettingToggle 
              label="Critical Escalation Events" 
              description="Emergency routing for high-impact keywords (Failure, Fire, Structural damage)."
              enabled={settings.receive_critical_alerts}
              onToggle={() => handleToggle('receive_critical_alerts')}
              isCritical
            />
            <SettingToggle 
              label="Operational Batch Reports" 
              description="24-hour rollup of total maintenance velocity."
              enabled={settings.receive_daily_reports}
              onToggle={() => handleToggle('receive_daily_reports')}
            />
          </div>

          <div className="pt-10 border-t border-aviator-border flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Radio className="w-4 h-4 text-aviator-amber animate-pulse" />
               <p className="text-[10px] font-mono text-aviator-text-dim italic font-bold">
                 Updates are pushed to the primary registry address.
               </p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-3 px-8 h-12 bg-aviator-amber hover:bg-orange-400 text-black border-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> COMMIT LOGIC</>}
            </button>
          </div>
          
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="text-[10px] font-mono text-aviator-green uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-3">
                <CheckCircle2 className="w-4 h-4" /> {message}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, enabled, onToggle, isCritical }: any) {
  return (
    <div className="flex items-start justify-between group">
      <div className="space-y-2">
        <div className="text-sm font-bold text-white group-hover:text-aviator-amber transition-colors flex items-center gap-2 italic uppercase tracking-tight">
          {isCritical && <div className="w-1.5 h-1.5 rounded-full bg-aviator-red animate-pulse glow-red" />}
          {label}
        </div>
        <div className="text-[11px] text-aviator-text-dim font-mono italic leading-relaxed pr-12">{description}</div>
      </div>
      <button 
        onClick={onToggle}
        className={`w-14 h-7 rounded-sm relative transition-all duration-300 border ${enabled ? 'bg-aviator-amber/20 border-aviator-amber/50' : 'bg-black/40 border-white/10'}`}
      >
        <motion.div 
          animate={{ x: enabled ? 30 : 4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`absolute top-1 w-4 h-4 rounded-sm ${enabled ? 'bg-aviator-amber' : 'bg-white/20'}`} 
        />
      </button>
    </div>
  );
}
