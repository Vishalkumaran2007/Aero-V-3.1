import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer Shield/Gemini Loop */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Abstract "C" for Compliance with a Wing/Propeller feel */}
        <motion.path
          d="M80 50C80 66.5685 66.5685 80 50 80C33.4315 80 25 66.5685 25 50C25 33.4315 33.4315 20 50 20"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Dynamic Flight Path */}
        <motion.path
          d="M40 50L60 30L85 30"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-aviator-amber"
        />

        {/* Core Dot (System Anchor) */}
        <motion.circle
          cx="50"
          cy="50"
          r="6"
          fill="currentColor"
          className="text-aviator-amber"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orbiting Tech Ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      
      {/* Glint Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full"
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
      />
    </div>
  );
};
