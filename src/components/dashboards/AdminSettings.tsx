import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import { Lock, Save, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSettings() {
  const [currentSecret, setCurrentSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleUpdateSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSecret.length < 8) {
      setMessage({ text: 'New secret must be at least 8 characters', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await adminApi.changeSecret(currentSecret, newSecret);
      setMessage({ text: 'Admin Security Key Updated Successfully', type: 'success' });
      setCurrentSecret('');
      setNewSecret('');
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Update failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-2xl animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div>
          <div className="tech-label text-aviator-red mb-2">Security Enforcement</div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-red/20 decoration-4 underline-offset-8">
            SECURITY<span className="text-aviator-red">VAULT</span>
          </h1>
          <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">Access Hardening // Root Authorization</p>
        </div>
      </div>

      <div className="tech-card p-12 bg-white/[0.01] relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
          <ShieldAlert className="w-64 h-64 text-aviator-red" />
        </div>
        
        <form onSubmit={handleUpdateSecret} className="space-y-10 relative z-10">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-aviator-red mb-4">
               <AlertCircle className="w-5 h-5 glow-red" />
               <span className="text-[11px] font-mono font-bold uppercase tracking-widest">Protocol Warning</span>
             </div>
             <p className="text-[12px] text-aviator-text-dim font-mono leading-relaxed italic border-l-2 border-aviator-red/30 pl-6 py-2">
               "Updating the Admin Secret Key will invalidate existing onboarding codes. Any future administrative registration attempts must verify against the new registry immediately. This action is irreversible and recorded in the immutable audit stream."
             </p>
          </div>

          <div className="grid grid-cols-1 gap-8 pt-4">
            <div className="space-y-3">
              <label className="tech-label text-[9px] text-white/40 uppercase tracking-widest font-bold">Verification of Current Authority Key</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-aviator-red transition-colors" />
                <input 
                  type="password"
                  value={currentSecret}
                  onChange={(e) => setCurrentSecret(e.target.value)}
                  className="w-full h-14 bg-black/40 border border-white/10 focus:border-aviator-red/50 outline-none p-4 pl-12 text-white font-mono text-sm tracking-widest shadow-inner transition-all"
                  placeholder="Enter existing secret..."
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="tech-label text-[9px] text-white/40 uppercase tracking-widest font-bold">Designate New Cryptographic Key</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-aviator-amber transition-colors" />
                <input 
                  type="password"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  className="w-full h-14 bg-black/40 border border-white/10 focus:border-aviator-amber/50 outline-none p-4 pl-12 text-white font-mono text-sm tracking-widest shadow-inner transition-all"
                  placeholder="Minimum 8 characters..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button 
              type="submit"
              disabled={loading}
              className="btn-danger w-full h-16 text-sm flex items-center justify-center gap-4 bg-aviator-red hover:bg-rose-500 border-none shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> RE-AUTHORIZE ENCRYPTION KEY</>}
            </button>
          </div>

          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 text-[10px] font-mono text-center border uppercase tracking-[0.3em] font-bold shadow-xl ${message.type === 'success' ? 'bg-aviator-green/5 border-aviator-green/30 text-aviator-green' : 'bg-aviator-red/5 border-aviator-red/30 text-aviator-red'}`}
            >
              {message.text}
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}
