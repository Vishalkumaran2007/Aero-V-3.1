import React, { useState } from 'react';
import Copilot from '../Copilot';
import Dashboard from '../Dashboard';
import { PenTool, List } from 'lucide-react';

export default function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'ARCHIVE'>('OPERATIONS');

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between border-b border-aviator-border pb-8">
        <div>
          <div className="tech-label text-aviator-amber mb-2">Technician Flight Deck</div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-4 underline-offset-8">
            Operational<span className="text-aviator-amber">Hub</span>
          </h1>
          <p className="text-aviator-text-dim text-[10px] uppercase tracking-[0.4em] font-bold mt-6">Maintenance Entry // Personal Flight History</p>
        </div>
        <div className="flex bg-black/20 p-1 rounded-sm border border-aviator-border">
          <button 
            onClick={() => setActiveTab('OPERATIONS')}
            className={`px-6 py-2 tech-label transition-all ${activeTab === 'OPERATIONS' ? 'bg-aviator-amber text-black shadow-lg shadow-aviator-amber/20' : 'text-aviator-text-dim hover:text-aviator-text'}`}
          >
            <div className="flex items-center gap-2">
              <PenTool className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('ARCHIVE')}
            className={`px-6 py-2 tech-label transition-all ${activeTab === 'ARCHIVE' ? 'bg-aviator-amber text-black shadow-lg shadow-aviator-amber/20' : 'text-aviator-text-dim hover:text-aviator-text'}`}
          >
            <div className="flex items-center gap-2">
              <List className="w-3.5 h-3.5" />
              <span>My History</span>
            </div>
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'OPERATIONS' ? (
          <div className="space-y-8">
             <div className="grid grid-cols-3 gap-6">
                <div className="tech-card p-6 bg-aviator-amber/5 border-aviator-amber/20">
                   <div className="tech-label mb-2">Active Session</div>
                   <div className="text-xl font-bold font-display">AUTHORIZED</div>
                </div>
                <div className="tech-card p-6">
                   <div className="tech-label mb-2">Draft Logs</div>
                   <div className="text-xl font-bold font-display">02</div>
                </div>
                <div className="tech-card p-6">
                   <div className="tech-label mb-2">Pending Sign-off</div>
                   <div className="text-xl font-bold font-display">05</div>
                </div>
             </div>
             <Copilot />
          </div>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}
