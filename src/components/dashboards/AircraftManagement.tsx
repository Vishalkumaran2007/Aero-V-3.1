import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  AlertTriangle,
  Globe,
  Settings,
  ChevronRight,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react';
import { aircraftApi } from '../../services/api';
import { useAircraft } from '../../context/AircraftContext';
import { useAuth } from '../../context/AuthContext';

export default function AircraftManagement() {
  const { user } = useAuth();
  const { aircrafts, loading, refreshAircrafts } = useAircraft();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<any>(null);
  const [formData, setFormData] = useState({
    aircraft_id: '',
    type: '',
    manufacturer: '',
    serial_number: '',
    status: 'active',
    location: ''
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const MANUFACTURERS = ['Airbus', 'Boeing', 'Embraer', 'Bombardier', 'Cessna', 'Gulfstream', 'ATR', 'Other'];

  const filteredAircrafts = aircrafts.filter(a => 
    a.aircraft_id.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.aircraft_id.trim()) errors.aircraft_id = 'Registration ID is required';
    if (!formData.type.trim()) errors.type = 'Airframe model is required';
    if (!formData.manufacturer) errors.manufacturer = 'Manufacturer selection required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCloseModal = () => {
    const isDirty = Object.values(formData).some(val => val !== '' && val !== 'active');
    if (isDirty && !success) {
      if (!window.confirm("UNSAVED MODIFICATIONS DETECTED. DISCARD CHANGES?")) return;
    }
    setShowAddModal(false);
    setEditingAircraft(null);
    setFormData({ aircraft_id: '', type: '', manufacturer: '', serial_number: '', status: 'active', location: '' });
    setError('');
    setFieldErrors({});
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError('');
    try {
      if (editingAircraft) {
        await aircraftApi.update(editingAircraft.id, formData);
        setSuccess('ASSET CONFIGURATION UPDATED SUCCESSFULLY');
      } else {
        const res = await aircraftApi.create(formData);
        if (res.data?.status === 'pending') {
          setSuccess('REGISTRATION SUBMITTED FOR COMMAND APPROVAL');
        } else {
          setSuccess('NEW ASSET REGISTERED IN FLEET DATABASE');
        }
      }
      refreshAircrafts();
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Execution error in asset protocol");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("CONFIRM ASSET DECOMMISSIONING? THIS CANNOT BE UNDONE.")) {
      try {
        await aircraftApi.delete(id);
        refreshAircrafts();
      } catch (err) {
        setError("Failed to decommission asset");
      }
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-aviator-border pb-12 mb-4">
        <div>
          <div className="tech-label mb-4 text-aviator-amber flex items-center gap-3 italic tracking-[0.3em]">
            <Globe className="w-4 h-4" />
            Active Fleet Registry
          </div>
          <h1 className="text-6xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-8 underline-offset-[12px]">
            ASSET<span className="text-aviator-amber">REGISTRY</span>
          </h1>
          <div className="flex items-center gap-6 mt-12">
             <p className="text-aviator-text-dim text-[11px] uppercase tracking-[0.6em] font-bold border-l-2 border-aviator-amber pl-4">Protocol: Inventory_V4</p>
             <div className="h-[1px] w-32 bg-aviator-border opacity-30" />
             <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] italic">Total Inventory units: {aircrafts.length}</div>
          </div>
        </div>
        {(user?.role === 'admin' || user?.role === 'planner') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary h-14 p-8 text-[11px] tracking-[0.4em]"
          >
            <Plus className="w-5 h-5 mr-1" />
            REGISTER NEW ASSET
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="tech-card p-6 col-span-3 flex items-center gap-6 bg-black/20 focus-within:border-aviator-amber/50 transition-all">
          <Search className="w-6 h-6 text-aviator-amber" />
          <input 
            type="text"
            placeholder="Search by Registration ID or Airframe Model Type..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm uppercase tracking-[0.2em] placeholder:text-aviator-text-dim/40 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tech-card p-6 flex items-center justify-between panel-gradient">
          <div className="tech-label text-white/40">Registered Fleet</div>
          <span className="stat-value text-4xl">{aircrafts.length.toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="tech-card overflow-hidden shadow-2xl pt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 dark:bg-white/5">
              <th className="table-cell tech-label bg-transparent">Asset ID</th>
              <th className="table-cell tech-label bg-transparent">Manufacturer / Type</th>
              <th className="table-cell tech-label bg-transparent">Serial Number</th>
              <th className="table-cell tech-label bg-transparent">Operational Status</th>
              <th className="table-cell tech-label bg-transparent">Station Location</th>
              <th className="table-cell tech-label bg-transparent text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredAircrafts.map((a) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={a.id} 
                  className="table-row group"
                >
                  <td className="table-cell font-bold text-aviator-amber">{a.aircraft_id}</td>
                  <td className="table-cell">
                    <div className="font-bold text-aviator-text">{a.type}</div>
                    <div className="text-[9px] text-aviator-text-dim uppercase tracking-tighter">{a.manufacturer}</div>
                  </td>
                  <td className="table-cell text-aviator-text-dim">{a.serial_number}</td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-aviator-green glow-green' : 'bg-aviator-red glow-red'}`} />
                        <span className={`uppercase font-bold tracking-widest text-[9px] ${a.status === 'active' ? 'text-aviator-green' : 'text-aviator-red'}`}>
                          {a.status}
                        </span>
                      </div>
                      {user?.role === 'admin' && a.approval_status !== 'approved' && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[8px] font-mono font-bold uppercase tracking-tighter ${
                          a.approval_status === 'pending' ? 'bg-aviator-amber/10 border-aviator-amber/30 text-aviator-amber' : 'bg-aviator-red/10 border-aviator-red/30 text-aviator-red'
                        }`}>
                          {a.approval_status === 'pending' ? <Clock className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          {a.approval_status}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2 text-aviator-text-dim">
                      <Globe className="w-3 h-3" />
                      {a.location || 'UNSPECIFIED'}
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(user?.role === 'admin' || user?.role === 'planner' || user?.role === 'supervisor') && (
                        <button 
                          onClick={() => {
                            setEditingAircraft(a);
                            setFormData(a);
                            setShowAddModal(true);
                          }}
                          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-sm text-aviator-text-dim hover:text-aviator-text"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {(user?.role === 'admin' || user?.role === 'planner') && (
                        <button 
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 hover:bg-aviator-red/10 rounded-sm text-aviator-text-dim hover:text-aviator-red"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredAircrafts.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-20 text-aviator-text-dim font-mono text-xs uppercase tracking-[0.3em]">
                  <Plane className="w-10 h-10 mx-auto mb-4 opacity-20" />
                  No assets found in registry
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="tech-card w-full max-w-xl p-8 border-aviator-amber/20 overflow-hidden relative"
          >
            {success && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute inset-0 bg-aviator-black/95 z-50 flex flex-col items-center justify-center text-center p-8"
              >
                <div className="w-20 h-20 bg-aviator-green/10 rounded-full flex items-center justify-center mb-6 border border-aviator-green/20 scale-in">
                  <CheckCircle2 className="w-10 h-10 text-aviator-green glow-green" />
                </div>
                <h3 className="text-2xl font-bold tracking-tighter uppercase italic mb-2">Protocol Successful</h3>
                <p className="text-aviator-green font-mono text-xs tracking-widest uppercase">{success}</p>
              </motion.div>
            )}

            <div className="flex justify-between items-center mb-8 border-b border-aviator-border pb-4">
              <div>
                <div className="tech-label text-aviator-amber">Command Override</div>
                <h2 className="text-2xl font-bold tracking-tighter uppercase italic">
                  {editingAircraft ? 'Update Fleet Asset' : 'Register New Fleet Asset'}
                </h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-aviator-red/10 border border-aviator-red/20 text-aviator-red text-[11px] font-mono flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="tech-label flex justify-between">
                    <span>Asset Identification (ID)</span>
                    {fieldErrors.aircraft_id && <span className="text-aviator-red text-[8px] animate-pulse">{fieldErrors.aircraft_id}</span>}
                  </label>
                  <input 
                    type="text"
                    readOnly={user?.role === 'supervisor'}
                    placeholder="e.g. N784WK"
                    className={`w-full bg-black/5 dark:bg-black/40 border ${fieldErrors.aircraft_id ? 'border-aviator-red/50' : 'border-aviator-border'} p-3 font-mono text-sm tracking-widest uppercase focus:border-aviator-amber outline-none transition-all text-aviator-text ${user?.role === 'supervisor' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.aircraft_id}
                    onChange={(e) => {
                      setFormData({ ...formData, aircraft_id: e.target.value.toUpperCase() });
                      if (fieldErrors.aircraft_id) setFieldErrors({ ...fieldErrors, aircraft_id: '' });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="tech-label flex justify-between">
                    <span>Airframe Type / Model</span>
                    {fieldErrors.type && <span className="text-aviator-red text-[8px] animate-pulse">{fieldErrors.type}</span>}
                  </label>
                  <input 
                    type="text"
                    readOnly={user?.role === 'supervisor'}
                    placeholder="e.g. A320neo"
                    className={`w-full bg-black/5 dark:bg-black/40 border ${fieldErrors.type ? 'border-aviator-red/50' : 'border-aviator-border'} p-3 font-mono text-sm tracking-widest focus:border-aviator-amber outline-none transition-all text-aviator-text ${user?.role === 'supervisor' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value });
                      if (fieldErrors.type) setFieldErrors({ ...fieldErrors, type: '' });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="tech-label flex justify-between">
                    <span>Manufacturer</span>
                    {fieldErrors.manufacturer && <span className="text-aviator-red text-[8px] animate-pulse">{fieldErrors.manufacturer}</span>}
                  </label>
                  <select 
                    disabled={user?.role === 'supervisor'}
                    className={`w-full bg-black/5 dark:bg-black/40 border ${fieldErrors.manufacturer ? 'border-aviator-red/50' : 'border-aviator-border'} p-3 font-mono text-sm tracking-widest focus:border-aviator-amber outline-none transition-all appearance-none cursor-pointer text-aviator-text ${user?.role === 'supervisor' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.manufacturer}
                    onChange={(e) => {
                      setFormData({ ...formData, manufacturer: e.target.value });
                      if (fieldErrors.manufacturer) setFieldErrors({ ...fieldErrors, manufacturer: '' });
                    }}
                  >
                    <option value="" className="bg-aviator-card">SELECT MANUFACTURER</option>
                    {MANUFACTURERS.map(m => (
                      <option key={m} value={m} className="bg-aviator-card">{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="tech-label">Current Status</label>
                  <select 
                    className="w-full bg-black/5 dark:bg-black/40 border border-aviator-border p-3 font-mono text-sm tracking-widest focus:border-aviator-amber outline-none appearance-none cursor-pointer text-aviator-text"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active" className="bg-aviator-card">OPERATIONAL</option>
                    <option value="maintenance" className="bg-aviator-card">GROUNDED / MAINTENANCE</option>
                    <option value="retired" className="bg-aviator-card">DECOMMISSIONED</option>
                  </select>
                </div>
              </div>

              {/* Advanced Section Collapsible */}
              <div className="border-t border-aviator-border pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-[10px] font-mono font-bold text-aviator-text-dim hover:text-white transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  ADVANCED CONFIGURATION FIELDS
                </button>
                
                {showAdvanced && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden mt-4 grid grid-cols-2 gap-6"
                  >
                    <div className="space-y-2">
                      <label className="tech-label">Serial Number (MSN)</label>
                      <input 
                        type="text"
                        readOnly={user?.role === 'supervisor'}
                        placeholder="e.g. 10234"
                        className={`w-full bg-black/5 dark:bg-black/40 border border-aviator-border p-3 font-mono text-sm tracking-widest focus:border-aviator-amber outline-none text-aviator-text ${user?.role === 'supervisor' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="tech-label">Station / Location</label>
                      <input 
                        type="text"
                        placeholder="e.g. LAX Terminal 4"
                        className="w-full bg-black/5 dark:bg-black/40 border border-aviator-border p-3 font-mono text-sm tracking-widest focus:border-aviator-amber outline-none text-aviator-text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-4 text-xs tracking-[0.3em]"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingAircraft ? 'INITIATE UPDATE' : 'REGISTER AIRCRAFT'}
                </button>
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary py-4"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
