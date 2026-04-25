import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('technician');
  const [adminSecret, setAdminSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup({ name, email, password, role, adminSecret });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-aviator-black overflow-hidden relative">
      <div className="absolute inset-0 tech-grid opacity-[0.03]" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-aviator-amber/5 rounded-full blur-[150px] animate-pulse" />
      <div className="scanline" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="tech-card w-full max-w-lg p-10 bg-aviator-slate/40 backdrop-blur-xl border-white/5 relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-aviator-amber/20 to-transparent" />

        <div className="flex flex-col mb-12">
          <div className="flex items-center gap-6 mb-4">
            <div className="p-4 bg-aviator-amber/5 border border-aviator-amber/20 rounded-sm glow-amber/10">
              <Logo size={48} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-4xl text-white italic tracking-tighter uppercase px-2 border-b-4 border-aviator-amber/20 pb-2">Registry<span className="text-aviator-amber">Enrollment</span></h1>
              <p className="text-aviator-text-dim text-[9px] uppercase tracking-[0.4em] font-bold mt-2">Operational Personnel Request</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-2 bg-aviator-red/10 border-l-2 border-aviator-red text-aviator-red text-[10px] p-4 font-mono uppercase tracking-widest flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 bg-aviator-red rounded-full animate-ping" />
              {error}
            </motion.div>
          )}

          <div className="space-y-3 col-span-2">
            <label className="tech-label">Personnel Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-aviator-amber transition-colors" />
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/5 focus:border-aviator-amber/40 outline-none p-4 pl-12 text-white font-mono text-sm transition-all rounded-sm tracking-tight"
                placeholder="REGISTRY_NAME"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="tech-label">Terminal Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-aviator-amber transition-colors" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/5 focus:border-aviator-amber/40 outline-none p-4 pl-12 text-white font-mono text-sm transition-all rounded-sm tracking-tight"
                placeholder="IDENT_EMAIL"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="tech-label">Fleet Role</label>
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-aviator-amber transition-colors" />
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-black/40 border border-white/5 focus:border-aviator-amber/40 outline-none p-4 pl-12 text-white font-mono text-[10px] uppercase tracking-widest appearance-none cursor-pointer rounded-sm tracking-tight"
              >
                <option value="technician" className="bg-aviator-card">Technician</option>
                <option value="engineer" className="bg-aviator-card">Engineer</option>
                <option value="supervisor" className="bg-aviator-card">Supervisor</option>
                <option value="qa_officer" className="bg-aviator-card">QA Officer</option>
                <option value="planner" className="bg-aviator-card">Planner</option>
                <option value="admin" className="bg-aviator-card">Administrator</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {role === 'admin' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 col-span-2 overflow-hidden bg-aviator-red/5 p-4 border border-aviator-red/20 rounded-sm"
              >
                <label className="tech-label text-aviator-red">Security Authorization Secret</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-aviator-red/40 group-focus-within:text-aviator-red transition-colors" />
                  <input 
                    type={showSecret ? "text" : "password"}
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full bg-black/40 border border-aviator-red/20 focus:border-aviator-red/50 outline-none p-4 pl-12 pr-12 text-aviator-red font-mono text-xs tracking-[0.4em]"
                    placeholder="REQUIRED_SECRET"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-aviator-red/40 hover:text-aviator-red transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3 col-span-2">
            <label className="tech-label">Security Protocol</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-aviator-amber transition-colors" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 focus:border-aviator-amber/40 outline-none p-4 pl-12 text-white font-mono text-sm transition-all rounded-sm tracking-tight"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary col-span-2 h-14"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Enroll Personnel</>}
          </button>
        </form>

        <div className="mt-10 text-center pt-8 border-t border-white/5">
          <Link to="/login" className="text-aviator-text-dim hover:text-aviator-amber font-mono text-[9px] uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2">
            <span>Existing fleet member?</span>
            <span className="text-aviator-amber underline underline-offset-4">Authenticate Identity</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
