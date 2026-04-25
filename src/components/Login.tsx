import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-aviator-black overflow-hidden relative">
      <div className="absolute inset-0 tech-grid opacity-[0.03]" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aviator-amber/5 rounded-full blur-[120px] animate-pulse" />
      <div className="scanline" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="tech-card w-full max-w-md p-10 bg-aviator-slate/40 backdrop-blur-xl border-white/5 relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-aviator-amber/20 to-transparent" />
        
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 bg-aviator-amber/5 rounded-sm flex items-center justify-center mb-6 border border-aviator-amber/10 glow-amber relative group"
          >
            <div className="absolute inset-0 bg-aviator-amber/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Logo size={60} className="text-white" />
          </motion.div>
          <h1 className="font-display font-bold text-4xl text-white italic tracking-tighter uppercase px-2 border-b-4 border-aviator-amber/20 pb-2">Aero<span className="text-aviator-amber">Compliance</span></h1>
          <div className="flex items-center gap-3 mt-4">
            <span className="h-[1px] w-8 bg-aviator-amber/20" />
            <p className="text-aviator-text-dim text-[8px] uppercase tracking-[0.4em] font-bold">Secure Command Uplink</p>
            <span className="h-[1px] w-8 bg-aviator-amber/20" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-aviator-red/10 border-l-2 border-aviator-red text-aviator-red text-[10px] p-4 font-mono uppercase tracking-widest flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 bg-aviator-red rounded-full animate-ping" />
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="tech-label">Terminal Identity</label>
              <span className="text-[7px] font-mono text-white/20">REQD_AUTH</span>
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-aviator-amber transition-colors" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/5 focus:border-aviator-amber/40 outline-none p-4 pl-12 text-white font-mono text-sm transition-all rounded-sm tracking-tight"
                placeholder="REGISTRY_EMAIL"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="tech-label">Security Protocol</label>
              <span className="text-[7px] font-mono text-white/20">ENCR_LOCAL</span>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-aviator-amber transition-colors" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 focus:border-aviator-amber/40 outline-none p-4 pl-12 text-white font-mono text-sm transition-all rounded-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-14 group relative"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Establish Uplink'}
          </button>
        </form>

        <div className="mt-12 text-center pt-8 border-t border-white/5">
          <Link to="/signup" className="text-aviator-text-dim hover:text-aviator-amber font-mono text-[9px] uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2">
            <span>No operational ID?</span>
            <span className="text-aviator-amber underline underline-offset-4">Register Personnel</span>
          </Link>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-8 text-aviator-text-dim/20 font-mono text-[8px] uppercase tracking-[1em] vertical-rl orientation-mixed">
        SKYLOG_V4.0 // ALPHA_PROTO
      </div>
    </div>
  );
}
