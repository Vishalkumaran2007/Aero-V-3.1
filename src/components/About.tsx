import React from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Clock, 
  CheckCircle2, 
  Users, 
  Layers,
  Zap
} from 'lucide-react';

export default function About() {
  const team = [
    { name: 'Vishalkumaran V', role: 'Lead Developer' },
    { name: 'Viljon Kumar J', role: 'Senior AI Engineer' },
    { name: 'Karthikeyan AS', role: 'Systems Architect' },
    { name: 'Hitesh Raj RL', role: 'Security Specialist' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-20 py-12 animate-in fade-in duration-700">
      <section className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="tech-label text-aviator-amber mb-4">Aviation Intelligence</div>
          <h1 className="text-6xl font-bold tracking-tighter uppercase italic">Aero<span className="text-aviator-amber">Compliance</span></h1>
        </motion.div>
        <p className="text-xl text-aviator-text-dim max-w-2xl mx-auto leading-relaxed">
          The next generation of aviation maintenance documentation. Transforming raw data into regulatory precision through semantic intelligence.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">THE PROBLEM</h2>
          <div className="p-6 tech-card border-aviator-red/20 bg-aviator-red/5">
             <p className="text-aviator-text leading-relaxed">
               Aircraft technicians spend up to 40% of their time on manual documentation and compliance paperwork. This legacy approach reduces operational efficiency, increases fatigue, and significantly raises the risk of human error in safety-critical records.
             </p>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">THE SOLUTION</h2>
          <div className="p-6 tech-card border-aviator-green/20 bg-aviator-green/5">
             <p className="text-aviator-text leading-relaxed">
               AeroCompliance introduces an intelligent maintenance copilot that automates log creation, ensures instant regulatory compliance, and streamlines complex approval workflows. We eliminate the friction between mechanical action and digital record.
             </p>
          </div>
        </div>
      </section>

      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight uppercase italic">Key Innovations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Cpu, title: 'AI Log Generation', desc: 'Predictive semantic engines for technical reporting.' },
            { icon: ShieldCheck, title: 'Real-time Compliance', desc: 'Instant validation against aviation standards.' },
            { icon: Layers, title: 'Role-Based Workflow', desc: 'Secure hierarchy for approvals and signing.' },
            { icon: Globe, title: 'Fleet Tracking', desc: 'Comprehensive asset lifecycle management.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="tech-card p-6 space-y-4"
            >
              <item.icon className="w-8 h-8 text-aviator-amber" />
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-xs text-aviator-text-dim leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-aviator-amber/10 border border-aviator-amber/20 p-12 rounded-sm text-center space-y-6">
        <h2 className="text-3xl font-bold tracking-tighter italic uppercase">Our Vision</h2>
        <p className="text-xl italic font-display text-aviator-text leading-relaxed max-w-3xl mx-auto">
          "To transform aviation maintenance into a fully digital, intelligent, and automated ecosystem where safety and efficiency are programmatically guaranteed."
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">IMPACT</h2>
          <div className="space-y-4">
            {[
              'Saves technicians 10+ hours per week on paperwork.',
              'Improves safety data accuracy by 95% through AI validation.',
              'Reduces documentation errors and regulatory findings.',
              'Enhances operational efficiency and asset availability.'
            ].map((text, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Zap className="w-4 h-4 text-aviator-amber mt-1" />
                <span className="text-aviator-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">ENGINEERING TEAM</h2>
          <div className="grid grid-cols-2 gap-4">
            {team.map((member, i) => (
              <div key={i} className="tech-card p-4">
                <div className="font-bold text-aviator-text">{member.name}</div>
                <div className="tech-label text-aviator-amber/60">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-aviator-border pt-12 text-center">
        <div className="tech-label mb-6">Built with industry-leading stack</div>
        <div className="flex flex-wrap justify-center gap-12 opacity-60">
           <div className="flex items-center gap-2 font-bold font-display"><CheckCircle2 className="w-5 h-5 text-aviator-amber" /> REACT</div>
           <div className="flex items-center gap-2 font-bold font-display"><CheckCircle2 className="w-5 h-5 text-aviator-amber" /> EXPRESS / SQLITE</div>
           <div className="flex items-center gap-2 font-bold font-display"><CheckCircle2 className="w-5 h-5 text-aviator-amber" /> GEMINI AI</div>
           <div className="flex items-center gap-2 font-bold font-display"><CheckCircle2 className="w-5 h-5 text-aviator-amber" /> TAILWIND CSS</div>
        </div>
      </section>
    </div>
  );
}
