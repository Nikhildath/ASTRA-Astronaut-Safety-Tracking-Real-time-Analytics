'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Sparkles, Orbit, Terminal,
} from 'lucide-react';

interface FlightLoadingScreenProps {
  progress?: number;
  statusText?: string;
}

const NASA_TIPS = [
  'Microgravity induces sensorimotor discordance; rapid visual pursuit recalibrates the vestibular-ocular reflex.',
  'Chaining consecutive combat destructions drops perceived time into slow-motion, de-escalating autonomic stress.',
  'Fly close to drifting celestial bodies to initiate planetary orbit insertion for neuro-cognitive decompression.',
  'Autonomous targeting reticle activates when the enemy raider crosses into your forward targeting cone.',
  'Deep rhythmic breathing during high-G evasive maneuvers stabilizes cerebral perfusion and arterial blood pressure.',
];

const DIAGNOSTIC_STEPS = [
  { id: 'SYS-01', label: 'INITIALIZING NEURAL-HUD INTERFACE', duration: 300 },
  { id: 'VRAM-02', label: 'STREAMING FIGHTER AIRFRAME & PBR CERAMIC MESH', duration: 800 },
  { id: 'MESH-03', label: 'DECODING ALIEN BIO-MECHANICAL ENEMY HULL', duration: 700 },
  { id: 'GPU-04', label: 'COMPILING THREE.JS UNREALBLOOM SHADER PASSES', duration: 400 },
  { id: 'NAV-05', label: 'CALIBRATING GYROSCOPIC INERTIAL GUIDANCE VECTORS', duration: 400 },
  { id: 'AUDIO-06', label: 'SYNTHESIZING DUAL-FREQUENCY SUB-SONIC AUDIO PULSES', duration: 300 },
  { id: 'BIO-07', label: 'ENGAGING AUTONOMIC STRESS DE-ESCALATION MATRIX', duration: 300 },
  { id: 'RDY-08', label: 'ALL FLIGHT SYSTEMS NOMINAL // READY FOR SORTIE', duration: 200 },
];

export function FlightLoadingScreen({
  progress: externalProgress,
  statusText: externalStatusText,
}: FlightLoadingScreenProps) {
  const [internalProgress, setInternalProgress] = useState(12);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [solTime, setSolTime] = useState('');

  // Sol clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSolTime(
        `SOL ${Math.floor((now.getTime() - 1700000000000) / 86400000)} // ${now.toISOString().substring(11, 19)} UTC`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTipIndex(prev => (prev + 1) % NASA_TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Smooth progress increment when not driven externally
  useEffect(() => {
    const target = externalProgress !== undefined ? externalProgress : 98;
    const interval = setInterval(() => {
      setInternalProgress(prev => {
        if (prev < target) {
          const step = Math.max(1, Math.round((target - prev) * 0.12));
          return Math.min(target, prev + step);
        }
        return prev;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [externalProgress]);

  // Step advancement based on progress
  const displayProgress = Math.min(100, Math.round(externalProgress !== undefined ? Math.max(externalProgress, internalProgress) : internalProgress));

  useEffect(() => {
    const idx = Math.min(
      DIAGNOSTIC_STEPS.length - 1,
      Math.floor((displayProgress / 100) * DIAGNOSTIC_STEPS.length)
    );
    setCurrentStepIndex(idx);
  }, [displayProgress]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(8,12,20,0.88) 0%, rgba(3,5,9,0.98) 85%)',
        backdropFilter: 'blur(10px)',
      }}>

      {/* Subtle background HUD grid scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 243, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 243, 255, 0.15) 3px, transparent 3px)',
        }}
      />

      {/* ─── TOP BAR ─── */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 z-10 border-b pb-3"
        style={{ borderColor: 'rgba(0,243,255,0.18)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-cyan-400/40 bg-cyan-950/40 flex items-center justify-center text-cyan-400">
            <Orbit className="animate-spin" size={18} style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <div className="font-orbitron text-xs sm:text-sm font-black tracking-widest text-cyan-300">
              ASTRA // FLIGHT SIMULATION PROTOCOL
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span>ORBITAL SECTOR 07</span>
              <span>•</span>
              <span className="text-cyan-400/80">{solTime}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ECLSS: NOMINAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={12} className="text-purple-400" />
            <span>GPU BUFFER: READY</span>
          </div>
        </div>
      </div>

      {/* ─── CENTERPIECE: DUAL-RING RETICLE + DIAGNOSTICS ─── */}
      <div className="w-full max-w-3xl flex flex-col items-center justify-center my-auto z-10 py-4">

        {/* Reticle with rotating elements */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-6">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border border-dashed animate-spin pointer-events-none"
            style={{
              borderColor: 'rgba(0, 243, 255, 0.35)',
              animationDuration: '18s',
            }}
          />
          {/* Middle ring */}
          <div
            className="absolute inset-3 rounded-full border border-t-cyan-400 border-r-transparent border-b-purple-500 border-l-transparent animate-spin"
            style={{
              animationDuration: '6s',
              animationDirection: 'reverse',
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-7 rounded-full border border-cyan-400/20"
          />

          {/* Crosshairs */}
          <div className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-400/40 via-transparent to-cyan-400/40" />
          <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-400/40 via-transparent to-cyan-400/40" />

          {/* Center percent & icon */}
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-orbitron text-2xl sm:text-3xl font-black text-cyan-300"
              style={{ textShadow: '0 0 15px rgba(0,243,255,0.6)' }}
            >
              {displayProgress}%
            </motion.div>
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
              CALIBRATING
            </span>
          </div>
        </div>

        {/* Primary status display */}
        <div className="text-center space-y-1 mb-5">
          <h3 className="font-orbitron text-sm sm:text-base font-bold tracking-[0.25em] text-cyan-200">
            {externalStatusText || DIAGNOSTIC_STEPS[currentStepIndex]?.label || 'CALIBRATING FLIGHT SYSTEMS...'}
          </h3>
          <p className="text-xs font-mono text-slate-400">
            Awaiting 3D high-fidelity mesh decompression &amp; WebGL shader compilation
          </p>
        </div>

        {/* Multi-segment Glowing Progress Bar */}
        <div className="w-full max-w-lg space-y-2">
          <div className="relative h-2.5 bg-black/60 rounded-full border border-cyan-500/30 overflow-hidden p-0.5">
            {/* Smooth glowing fill */}
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 shadow-[0_0_12px_rgba(0,243,255,0.8)]"
              style={{ width: `${displayProgress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              STAGE {currentStepIndex + 1}/{DIAGNOSTIC_STEPS.length}
            </span>
            <span>VRAM ALLOC: {(22 + (displayProgress * 0.2)).toFixed(1)} MB</span>
            <span className="font-orbitron font-bold text-cyan-300">{displayProgress}/100</span>
          </div>
        </div>

        {/* Real-time Diagnostic Log Terminal */}
        <div className="w-full max-w-lg mt-5 p-3 rounded-lg border font-mono text-[11px] space-y-1 text-left"
          style={{
            background: 'rgba(3, 5, 9, 0.75)',
            borderColor: 'rgba(0, 243, 255, 0.15)',
          }}>
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500 pb-1 border-b border-cyan-500/10">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Terminal size={11} />
              SYSTEM CALIBRATION STREAM
            </span>
            <span>LATENCY: 1.2 MS</span>
          </div>
          <div className="space-y-1 pt-1 max-h-24 overflow-hidden">
            {DIAGNOSTIC_STEPS.slice(0, currentStepIndex + 1).slice(-3).map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-300 truncate">
                  <span className="text-cyan-400 mr-2">[{s.id}]</span>
                  {s.label}
                </span>
                <span className="text-emerald-400 font-bold ml-2 shrink-0">
                  {idx === currentStepIndex - Math.max(0, currentStepIndex - 2) && displayProgress < 100
                    ? '[ACTIVE]'
                    : '[OK]'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── BOTTOM BAR: ROTATING NASA NEURO TIP ─── */}
      <div className="w-full max-w-3xl z-10">
        <div className="p-3.5 rounded-xl border flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(13,19,34,0.85) 0%, rgba(3,5,9,0.95) 100%)',
            borderColor: 'rgba(0, 243, 255, 0.2)',
          }}>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
            <Sparkles size={14} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                ASTRONAUT PHYSIOLOGICAL BRIEFING
              </span>
              <span className="text-[9px] font-mono text-slate-500">CYCLE TIP // {activeTipIndex + 1} OF {NASA_TIPS.length}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={activeTipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-slate-300 leading-relaxed font-mono"
              >
                {NASA_TIPS[activeTipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
}
