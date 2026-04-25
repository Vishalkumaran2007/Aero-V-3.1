/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, Sparkles, FileText, CheckCircle, AlertCircle, Loader2, Lightbulb, Save, Settings } from 'lucide-react';
import { logApi } from '../services/api';
import { geminiService } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { useAircraft } from '../context/AircraftContext';

export default function Copilot() {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedLog, setParsedLog] = useState<any | null>(null);
  const [streamedLog, setStreamedLog] = useState<any>(null);
  const { selectedAircraft } = useAircraft();
  const navigate = useNavigate();

  // Simulated typing-like streaming of structured data
  useEffect(() => {
    if (parsedLog) {
      setStreamedLog(null);
      let keys = ['component', 'issue', 'ata_chapter', 'action', 'findings'];
      let currentIdx = 0;
      
      const interval = setInterval(() => {
        if (currentIdx < keys.length) {
          const key = keys[currentIdx];
          setStreamedLog((prev: any) => ({
            ...prev,
            [key]: parsedLog[key]
          }));
          currentIdx++;
        } else {
          clearInterval(interval);
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, [parsedLog]);

  const handleProcess = async () => {
    if (!notes.trim()) return;
    setIsProcessing(true);
    setParsedLog(null);
    try {
      const data = await geminiService.processLog(notes);
      setParsedLog(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (!parsedLog || !selectedAircraft) return;
    setIsSubmitting(true);
    try {
      const validation = await logApi.validate({
        technician_id: 'CURRENT_USER',
        action: parsedLog.action
      });

      await logApi.submitLog({
        ...parsedLog,
        aircraft_id: selectedAircraft.aircraft_id,
        compliance_status: validation.data.status,
        is_draft: isDraft
      });
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-12 h-full animate-in fade-in duration-700">
      <div className="col-span-2 flex flex-col gap-12">
        <div className="border-b border-aviator-border pb-10">
          <div className="tech-label text-aviator-amber mb-4 flex items-center gap-3">
            <Sparkles className="w-4 h-4" />
            Maintenance Documentation Intelligence
          </div>
          <h1 className="text-5xl font-bold tracking-tighter italic uppercase underline decoration-aviator-amber/20 decoration-8 underline-offset-[12px]">
            AI<span className="text-aviator-amber">GEN</span> ENGINE
          </h1>
          <p className="text-aviator-text-dim text-[11px] uppercase tracking-[0.4em] font-bold mt-10 border-l-2 border-aviator-amber pl-4">Semantic maintenance synthesis // V3.8</p>
        </div>

        <div className="tech-card flex-1 flex flex-col overflow-hidden bg-aviator-slate/30">
          <div className="p-5 border-b border-aviator-border flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-aviator-amber" />
              <span className="tech-label">Natural Input Processor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-aviator-green rounded-full animate-pulse" />
              <span className="text-[8px] font-mono text-aviator-green uppercase font-bold tracking-widest">Link Active</span>
            </div>
          </div>
          
          <div className="flex-1 p-6 relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe technical discrepancies, findings, or maintenance actions in natural language..."
              className="w-full h-full bg-transparent resize-none focus:outline-none text-aviator-text font-mono tracking-tight text-sm placeholder:text-aviator-text-dim leading-relaxed"
            />
          </div>

          <div className="p-6 border-t border-aviator-border flex justify-between items-center bg-black/40">
            <div className="flex flex-col">
              <div className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-widest leading-none mb-1">Target Asset</div>
              <div className="text-[11px] font-bold text-aviator-amber uppercase font-mono">{selectedAircraft?.aircraft_id || 'NOT SELECTED'}</div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleProcess}
                disabled={isProcessing || !notes.trim()}
                className="btn-secondary h-10 px-6"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-aviator-amber" />}
                SYNTHESIZE
              </button>
              <button 
                onClick={() => handleSubmit()}
                disabled={!parsedLog || isSubmitting || !selectedAircraft}
                className="btn-primary h-10 px-8"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send className="w-4 h-4" />}
                COMMIT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-3 flex flex-col gap-10">
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <div>
            <div className="tech-label text-white/40 mb-2 uppercase tracking-widest">Regulatory Context Recovery</div>
            <h2 className="text-xl font-bold tracking-tight">Structured Preview Feed</h2>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-aviator-amber">
              <div className="w-1.5 h-1.5 bg-aviator-amber rounded-full animate-ping" />
              AI CORE SYNTHESIS IN PROGRESS...
            </div>
          )}
        </div>

        <div className="tech-card flex-1 p-10 relative overflow-y-auto panel-gradient">
          {streamedLog ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-2 gap-12">
                <div className="border-l-2 border-aviator-amber pl-6">
                  <div className="tech-label mb-3">ATA System Chapter</div>
                  <div className="text-5xl font-display font-bold text-white italic tracking-tighter underline decoration-aviator-amber/20">
                    {streamedLog.ata_chapter || '--'}
                  </div>
                </div>
                <div className="border-l-2 border-white/5 pl-6">
                  <div className="tech-label mb-3">Material Component</div>
                  <div className="text-sm font-mono text-aviator-amber font-bold leading-tight uppercase tracking-tight">
                    {streamedLog.component || 'PENDING...'}
                  </div>
                </div>
              </div>

              <div>
                <div className="tech-label mb-4 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-aviator-amber" />
                  Primary Discrepancy Statement
                </div>
                <div className="text-xl text-slate-200 font-display italic leading-tight bg-white/[0.02] p-6 border border-white/5 tracking-tight">
                  "{streamedLog.issue || 'Analyzing intent...'}"
                </div>
              </div>

              <div>
                <div className="tech-label mb-4 flex items-center gap-2">
                  <Settings className="w-3 h-3 text-aviator-amber" />
                  Technical Resolution Protocol
                </div>
                <div className="text-slate-400 font-mono text-xs leading-relaxed max-w-lg">
                  {streamedLog.action || 'Extracting methods...'}
                </div>
              </div>

              {streamedLog.findings && (
                <div className="p-6 bg-aviator-amber/5 border border-aviator-amber/10 rounded-sm">
                  <div className="flex items-center gap-2 mb-4 text-aviator-amber uppercase tracking-[0.25em] text-[10px] font-bold">
                    <Lightbulb className="w-4 h-4 shadow-[0_0_10px_rgba(242,125,38,0.3)]" />
                    Predictive Intelligence / Insights
                  </div>
                  <div className="text-xs text-slate-300 font-sans italic opacity-90 leading-relaxed mb-4">
                    {streamedLog.findings}
                  </div>
                  <button 
                    onClick={() => handleSubmit(true)}
                    className="flex items-center gap-2 text-[9px] font-mono text-aviator-amber hover:text-white transition-colors uppercase tracking-[0.3em] group"
                  >
                    <Save className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    Stage as Preliminary Draft
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                <FileText className="w-8 h-8 text-aviator-text-dim/30" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em]">Awaiting Input Signal</p>
                <div className="flex gap-1 justify-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className="w-1 h-1 bg-aviator-amber/20 rounded-full"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-aviator-green" />
              <span className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-[0.25em]">IA REGULATORY SUITE V4</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-3 h-3 text-aviator-amber" />
              <span className="text-[9px] font-mono text-aviator-text-dim uppercase tracking-[0.25em]">GPT-4o OPTIMIZED</span>
            </div>
          </div>
          <div className="text-[9px] font-mono text-aviator-text-dim/30 tracking-widest uppercase">ID: AV-LOG-7742</div>
        </div>
      </div>
    </div>
  );
}
