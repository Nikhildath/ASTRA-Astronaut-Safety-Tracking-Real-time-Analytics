'use client';

import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Crosshair, Gauge, Globe, Rocket, ShieldAlert, Sparkles } from 'lucide-react';
import { SpaceChaseGame } from '../components/SpaceChaseGame';

const CYAN = '#00f3ff';

const PANELS = [
  {
    icon: Rocket,
    title: 'Flight model',
    body: 'Pitch, yaw and roll on independent axes with inertial damping. Boost taps a regenerating energy cell — dump it all at once and you are a sitting target until it recovers.',
    accent: CYAN,
  },
  {
    icon: ShieldAlert,
    title: 'Endless pursuit',
    body: 'Raiders hunt back. They run, then swing nose-on and make firing passes with lead-aimed bursts — one or two at a time early on, a whole furball later. Every kill warps a fresh one into range, so the pressure never lets up.',
    accent: '#ef4444',
  },
  {
    icon: Globe,
    title: 'Diveable worlds',
    body: 'Four worlds drift through the chase zone — desert, ice, jungle and void. Fly up to one, dive in and fight across its surface for thirty seconds of survival combat, then break orbit with a score bonus and a hull patch.',
    accent: '#ffb066',
  },
  {
    icon: Gauge,
    title: 'Score & survival',
    body: '100 points per confirmed kill plus 10 points per second aloft. Your best run is stored on this device, so there is always something to beat.',
    accent: '#a855f7',
  },
  {
    icon: Sparkles,
    title: 'Designed to decompress',
    body: 'No fail states, no deadlines — just a cinematic nebula, warp-flash spawns, bloom-lit lasers and a hull that simply asks you to go again.',
    accent: '#22c55e',
  },
];

export function StressRelief() {
  useEffect(() => {
    document.title = 'Stress Relief / ASTRA';
  }, []);

  return (
    <div className="min-h-screen bg-void text-slate-100 font-sans overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 15%, rgba(0,243,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 25%, rgba(168,85,247,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 50% 50%, #060b15 0%, #030509 70%)
          `,
        }}
      />

      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: 'rgba(8,12,20,0.95)', borderColor: 'rgba(0,243,255,0.3)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[10px] font-mono tracking-widest transition-colors hover:bg-cyan-500/10 shrink-0"
              style={{ borderColor: 'rgba(0,243,255,0.3)', color: 'rgba(0,243,255,0.75)' }}
            >
              <ArrowLeft size={12} /> DASHBOARD
            </Link>
            <div className="min-w-0">
              <div className="font-orbitron text-xs font-black tracking-[0.25em] truncate" style={{ color: CYAN, textShadow: '0 0 10px rgba(0,243,255,0.6)' }}>
                STRESS RELIEF
              </div>
              <div className="text-[9px] font-mono tracking-widest truncate" style={{ color: 'rgba(0,243,255,0.5)' }}>
                COMBAT SIMULATION // ENDLESS CHASE
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#64748b' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            SIM LINK ACTIVE
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em]" style={{ color: 'rgba(0,243,255,0.65)' }}>
              <Crosshair size={12} /> THERAPEUTIC PROTOCOL 07
            </div>
            <h1 className="font-orbitron text-2xl sm:text-4xl font-black tracking-wider mt-1" style={{ color: CYAN, textShadow: '0 0 22px rgba(0,243,255,0.45)' }}>
              TAKE IT OUT ON THE VOID
            </h1>
            <p className="text-xs sm:text-sm mt-2 max-w-xl" style={{ color: '#94a3b8' }}>
              Hunt down an unending stream of fleeing alien raiders in the CGPT-14 fighter. No mission, no
              consequences — a star field, a boost bar, a target that keeps running, and worlds you can dive into.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            {['ENDLESS WAVES', 'DIVEABLE WORLDS', 'AUTO-SCALING', 'BEST RUN SAVED'].map(tag => (
              <span
                key={tag}
                className="px-2 py-1 rounded border"
                style={{ borderColor: 'rgba(0,243,255,0.2)', color: 'rgba(0,243,255,0.65)', background: 'rgba(13,19,34,0.7)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <SpaceChaseGame />

        <section className="grid sm:grid-cols-2 gap-3">
          {PANELS.map(({ icon: Icon, title, body, accent }) => (
            <div
              key={title}
              className="rounded-lg border p-4 relative overflow-hidden"
              style={{
                borderColor: 'rgba(0,243,255,0.18)',
                background: 'rgba(13,19,34,0.82)',
                boxShadow: 'inset 0 0 24px rgba(0,243,255,0.04)',
              }}
            >
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l" style={{ borderColor: accent, opacity: 0.5 }} />
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} style={{ color: accent }} />
                <h2 className="font-orbitron text-xs font-bold tracking-widest" style={{ color: accent }}>
                  {title.toUpperCase()}
                </h2>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{body}</p>
            </div>
          ))}
        </section>

        <section
          className="rounded-lg border p-4 text-[11px] font-mono leading-relaxed"
          style={{ borderColor: 'rgba(0,243,255,0.15)', background: 'rgba(3,9,16,0.6)', color: '#64748b' }}
        >
          <span style={{ color: CYAN }}>FLIGHT NOTES —</span> You are the pursuer: hold boost to close the gap, keep a
          raider inside the nose cone until the reticle turns amber, then fire — locked shots lead the target and track it
          for you. Gold coin trails hang in the flight path — scoop them for score, a little boost energy and a chained
          multiplier. Raiders are not passive targets: they turn in, hold their nose on you and fire telegraphed bursts that lead your flight, so keep steering — a straight line gets you hit, and a merge costs both ships hull. Get clear for five seconds and the plating patches itself. Chain kills and the fight drops into slow motion for a beat. Watch for worlds drifting ahead — close the distance until the DIVE IN prompt appears and press F (or tap the prompt): the fight moves to that planet's surface for thirty seconds, then breaks orbit with a bonus. Raiders still shoot back over their tail, so break off when your hull gets low.
          Asteroids damage the hull on contact, but can be shot out of the sky, and the hull never regenerates. Pause
          with ESC at any time, or go fullscreen from the HUD.
        </section>
      </main>
    </div>
  );
}
