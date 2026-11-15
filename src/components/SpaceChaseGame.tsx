'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Coins, Crosshair, Gauge, Globe, Heart, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Rocket, Volume2, VolumeX, Zap,
} from 'lucide-react';
import {
  SpaceChaseEngine,
  type GameState,
  type GameStats,
} from '../game/SpaceChaseEngine';
import { FlightLoadingScreen } from './FlightLoadingScreen';

const CYAN = '#00f3ff';
const RED = '#ef4444';
const GREEN = '#22c55e';

const EMPTY_STATS: GameStats = {
  score: 0,
  kills: 0,
  hull: 100,
  energy: 100,
  wave: 1,
  time: 0,
  boosting: false,
  enemies: 0,
  coins: 0,
  combo: 0,
  chain: 0,
  killFlash: 0,
  damageFlash: 0,
  lock: 0,
  locked: false,
  realm: 'space',
  worldName: '',
  worldPrompt: 0,
  worldProgress: 0,
  worldFlash: 0,
  worldLabel: '',
  worlds: 0,
  attackers: 0,
  regen: false,
};

const CHAIN_LABELS = ['RAIDER DOWN', 'DOUBLE KILL', 'TRIPLE KILL', 'MULTI KILL'];
/** Must match PLANET_SURVIVE in the engine. */
const SURFACE_SECONDS = 30;

const BEST_KEY = 'astra.stress-relief.best';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

function Bar({
  value,
  color,
  label,
  icon,
}: {
  value: number;
  color: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="w-40 sm:w-48">
      <div className="flex items-center justify-between text-[9px] font-mono mb-1 tracking-widest" style={{ color }}>
        <span className="flex items-center gap-1">{icon}{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-sm overflow-hidden border" style={{ borderColor: `${color}55`, background: 'rgba(3,9,16,0.7)' }}>
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 10px ${color}99`,
          }}
        />
      </div>
    </div>
  );
}

/** Virtual thumb-stick + action buttons, rendered on touch devices only. */
function TouchControls({
  onSteer,
  onFire,
  onBoost,
  onRoll,
}: {
  onSteer: (x: number, y: number) => void;
  onFire: (active: boolean) => void;
  onBoost: (active: boolean) => void;
  onRoll: (direction: number) => void;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const steerPointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const steerFrom = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const radius = rect.width / 2 - 14;
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > radius) {
      dx = (dx / len) * radius;
      dy = (dy / len) * radius;
    }
    setKnob({ x: dx, y: dy });
    onSteer(dx / radius, -dy / radius);
  };

  const releaseSteer = () => {
    steerPointer.current = null;
    setKnob({ x: 0, y: 0 });
    onSteer(0, 0);
  };

  const holdProps = (down: () => void, up: () => void) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      down();
    },
    onPointerUp: () => up(),
    onPointerCancel: () => up(),
    onLostPointerCapture: () => up(),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const base = 'flex items-center justify-center rounded-full font-orbitron font-bold tracking-widest select-none touch-none border-2 active:scale-95 transition-transform';

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Thumb stick */}
      <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col items-center gap-1.5 select-none">
        <div
          ref={padRef}
          role="button"
          aria-label="Flight stick"
          className="relative w-28 h-28 rounded-full touch-none"
          style={{
            border: '1px solid rgba(0,243,255,0.35)',
            background: 'radial-gradient(circle, rgba(0,243,255,0.10) 0%, rgba(3,9,16,0.55) 70%)',
            boxShadow: '0 0 18px rgba(0,243,255,0.18), inset 0 0 20px rgba(0,243,255,0.08)',
          }}
          onPointerDown={e => {
            e.preventDefault();
            steerPointer.current = e.pointerId;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* pointer already released */
            }
            steerFrom(e.clientX, e.clientY);
          }}
          onPointerMove={e => {
            if (steerPointer.current === e.pointerId) steerFrom(e.clientX, e.clientY);
          }}
          onPointerUp={releaseSteer}
          onPointerCancel={releaseSteer}
          onLostPointerCapture={releaseSteer}
        >
          <div
            className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full pointer-events-none"
            style={{
              transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
              background: 'radial-gradient(circle, rgba(0,243,255,0.55), rgba(0,119,182,0.25))',
              border: '1px solid rgba(0,243,255,0.8)',
              boxShadow: '0 0 16px rgba(0,243,255,0.55)',
            }}
          />
          <Crosshair size={16} style={{ color: 'rgba(0,243,255,0.35)' }} />
        </div>
        <span className="text-[8px] font-mono tracking-[0.2em]" style={{ color: 'rgba(0,243,255,0.45)' }}>
          DRAG TO FLY
        </span>
      </div>

      {/* Action cluster */}
      <div className="pointer-events-auto absolute bottom-4 right-3 flex flex-col items-end gap-2 select-none">
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Roll left"
            {...holdProps(() => onRoll(1), () => onRoll(0))}
            className={`${base} w-10 h-10`}
            style={{ borderColor: 'rgba(0,243,255,0.35)', color: 'rgba(0,243,255,0.8)', background: 'rgba(3,9,16,0.6)' }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            aria-label="Roll right"
            {...holdProps(() => onRoll(-1), () => onRoll(0))}
            className={`${base} w-10 h-10`}
            style={{ borderColor: 'rgba(0,243,255,0.35)', color: 'rgba(0,243,255,0.8)', background: 'rgba(3,9,16,0.6)' }}
          >
            <RotateCw size={16} />
          </button>
        </div>

        <button
          type="button"
          aria-label="Boost"
          {...holdProps(() => onBoost(true), () => onBoost(false))}
          className={`${base} w-16 h-16 flex-col gap-0.5`}
          style={{
            borderColor: 'rgba(0,243,255,0.55)',
            color: CYAN,
            background: 'radial-gradient(circle, rgba(0,243,255,0.16), rgba(3,9,16,0.7))',
            boxShadow: '0 0 18px rgba(0,243,255,0.25)',
          }}
        >
          <Zap size={15} />
          <span className="text-[8px]">BOOST</span>
        </button>

        <button
          type="button"
          aria-label="Fire lasers"
          {...holdProps(() => onFire(true), () => onFire(false))}
          className={`${base} w-[76px] h-[76px] flex-col gap-0.5`}
          style={{
            borderColor: 'rgba(0,243,255,0.8)',
            color: '#d9fdff',
            background: 'radial-gradient(circle, rgba(0,243,255,0.3), rgba(0,80,120,0.45))',
            boxShadow: '0 0 26px rgba(0,243,255,0.45)',
          }}
        >
          <Crosshair size={18} />
          <span className="text-[9px]">FIRE</span>
        </button>
      </div>
    </div>
  );
}

export function SpaceChaseGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SpaceChaseEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [loadingProgress, setLoadingProgress] = useState(15);
  const [loadingStatusText, setLoadingStatusText] = useState('CALIBRATING FLIGHT SYSTEMS...');
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [finalStats, setFinalStats] = useState<GameStats>(EMPTY_STATS);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
    if (Number.isFinite(stored)) setBest(stored);
  }, []);

  useEffect(() => {
    setFullscreenSupported(typeof document.documentElement.requestFullscreen === 'function');
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(query.matches || navigator.maxTouchPoints > 0);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const engine = new SpaceChaseEngine(mount, {
      onState: state => setGameState(state),
      onStats: next => setStats(next),
      onLoadingProgress: (prog, text) => {
        setLoadingProgress(prog);
        setLoadingStatusText(text);
      },
      onGameOver: next => {
        setFinalStats(next);
        setBest(prev => {
          const bestScore = Math.max(prev, next.score);
          window.localStorage.setItem(BEST_KEY, String(bestScore));
          return bestScore;
        });
      },
      onError: message => setError(message),
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const blurActive = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const handleStart = useCallback(() => {
    blurActive();
    engineRef.current?.start();
  }, []);

  const handleRestart = useCallback(() => {
    blurActive();
    engineRef.current?.restart();
  }, []);

  const handlePause = useCallback(() => {
    blurActive();
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    blurActive();
    engineRef.current?.resume();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    blurActive();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shellRef.current?.requestFullscreen();
      }
    } catch {
      /* Fullscreen can be blocked by the browser; nothing else to do. */
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      engineRef.current?.setMuted(!prev);
      return !prev;
    });
  }, []);

  const inFlight = gameState === 'running' || gameState === 'paused' || gameState === 'over';
  const hullColor = stats.hull > 55 ? GREEN : stats.hull > 25 ? '#fbbf24' : RED;
  const controlHelp: [string, string][] = isTouch
    ? [
        ['Left pad', 'Pitch & yaw'],
        ['Fire', 'Hold to shoot'],
        ['Boost', 'Hold for speed'],
        ['↺ ↻', 'Roll the hull'],
        ['DIVE IN', 'Enter a world'],
      ]
    : [
        ['W / S', 'Pitch'],
        ['A / D', 'Yaw'],
        ['Q / E', 'Roll'],
        ['Shift', 'Boost'],
        ['Space / Click', 'Fire lasers'],
        ['Auto-lock', 'Guns track the reticle'],
        ['F', 'Dive into a world'],
        ['Esc / P', 'Pause'],
      ];

  return (
    <div
      ref={shellRef}
      className="relative w-full overflow-hidden rounded-xl border select-none"
      style={{
        height: isFullscreen ? '100%' : 'clamp(440px, 74vh, 780px)',
        borderRadius: isFullscreen ? 0 : undefined,
        borderColor: isFullscreen ? 'transparent' : 'rgba(0,243,255,0.3)',
        background: '#02040a',
        boxShadow: isFullscreen ? 'none' : '0 0 40px rgba(0,243,255,0.12), inset 0 0 60px rgba(0,243,255,0.05)',
      }}
    >
      <div ref={mountRef} className="absolute inset-0" />

      {/* Scanline + vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(3,5,9,0.75) 100%), repeating-linear-gradient(to bottom, rgba(0,243,255,0.02) 0px, rgba(0,243,255,0.02) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Anime speed lines while boosting */}
      <div
        className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
        style={{
          opacity: inFlight && stats.boosting && gameState === 'running' ? 0.4 : 0,
          transition: 'opacity 280ms ease-out',
        }}
      >
        <div className="speedlines absolute inset-[-35%]" />
      </div>

      {/* Impact frame + cinematic letterbox on a kill */}
      {inFlight && (
        <div className="pointer-events-none absolute inset-0 z-[14] overflow-hidden">
          <div className="absolute inset-0" style={{ background: '#fff', opacity: Math.min(0.26, stats.killFlash * 0.26) }} />
          <div
            className="absolute inset-x-0 top-0 bg-black"
            style={{ height: '8%', transform: `translateY(${(1 - Math.min(1, stats.killFlash * 1.5)) * -100}%)` }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-black"
            style={{ height: '8%', transform: `translateY(${(1 - Math.min(1, stats.killFlash * 1.5)) * 100}%)` }}
          />
        </div>
      )}

      {/* Hull-damage vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{
          opacity: Math.min(1, stats.damageFlash * 0.9),
          background: 'radial-gradient(ellipse at center, rgba(239,68,68,0) 36%, rgba(239,68,68,0.5) 100%)',
        }}
      />

      {/* Re-entry / extraction card */}
      {stats.worldFlash > 0.01 && (
        <div className="pointer-events-none absolute inset-0 z-[26] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, rgba(255,255,255,${(0.32 * stats.worldFlash).toFixed(3)}) 0%, rgba(2,4,10,${(0.88 * stats.worldFlash).toFixed(3)}) 72%)`,
            }}
          />
          <div className="absolute inset-x-0 top-0 bg-black" style={{ height: '12%' }} />
          <div className="absolute inset-x-0 bottom-0 bg-black" style={{ height: '12%' }} />
          <div
            className="relative flex flex-col items-center px-6 text-center"
            style={{
              opacity: Math.min(1, stats.worldFlash * 1.7),
              transform: `scale(${(0.94 + Math.min(1, stats.worldFlash) * 0.06).toFixed(3)})`,
            }}
          >
            <div
              className="anime-slash absolute h-[2px] w-[min(560px,86vw)]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(0,243,255,0.9), #ffffff, rgba(0,243,255,0.9), transparent)',
                boxShadow: '0 0 22px rgba(0,243,255,0.8)',
              }}
            />
            <span
              className="relative font-orbitron text-xl sm:text-3xl font-black italic tracking-[0.18em] text-white"
              style={{ textShadow: '0 0 26px rgba(0,243,255,0.95), 0 0 5px #fff' }}
            >
              {stats.worldLabel}
            </span>
          </div>
        </div>
      )}

      {/* Flight HUD */}
      {inFlight && (
        <div className="pointer-events-none absolute inset-0 z-20 p-4 sm:p-5 font-mono">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[9px] tracking-[0.3em]" style={{ color: 'rgba(0,243,255,0.65)' }}>SCORE</div>
              <div
                className="font-orbitron text-3xl sm:text-4xl font-black leading-none"
                style={{ color: CYAN, textShadow: '0 0 18px rgba(0,243,255,0.65)' }}
              >
                {stats.score.toString().padStart(6, '0')}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[10px]" style={{ color: '#94a3b8' }}>
                <span>KILLS <span style={{ color: '#e2e8f0' }}>{stats.kills}</span></span>
                <span>WAVE <span style={{ color: '#e2e8f0' }}>{stats.wave}</span></span>
                <span>
                  HOSTILES <span style={{ color: '#f87171' }}>{stats.enemies}</span>
                  {stats.attackers > 0 && (
                    <span style={{ color: '#fbbf24' }}> · {stats.attackers} ON YOU</span>
                  )}
                </span>
                <span className="flex items-center gap-1" style={{ color: '#ffc02e' }}>
                  <Coins size={10} />
                  {stats.coins.toString().padStart(3, '0')}
                  {stats.combo >= 3 && <span style={{ color: '#fef3c7' }}>×{1 + Math.floor(stats.combo / 3)}</span>}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="px-2 py-1 rounded border text-[10px]" style={{ borderColor: 'rgba(0,243,255,0.25)', color: '#94a3b8', background: 'rgba(3,9,16,0.65)' }}>
                  {formatTime(stats.time)}
                </div>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-7 h-7 rounded border flex items-center justify-center transition-colors hover:bg-cyan-500/10"
                  style={{ borderColor: 'rgba(0,243,255,0.25)', color: '#94a3b8', background: 'rgba(3,9,16,0.65)' }}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                {gameState === 'running' && (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="w-7 h-7 rounded border flex items-center justify-center transition-colors hover:bg-cyan-500/10"
                    style={{ borderColor: 'rgba(0,243,255,0.25)', color: '#94a3b8', background: 'rgba(3,9,16,0.65)' }}
                    aria-label="Pause"
                  >
                    <Pause size={13} />
                  </button>
                )}
                {fullscreenSupported && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="w-7 h-7 rounded border flex items-center justify-center transition-colors hover:bg-cyan-500/10"
                    style={{ borderColor: 'rgba(0,243,255,0.25)', color: '#94a3b8', background: 'rgba(3,9,16,0.65)' }}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
                  </button>
                )}
              </div>
              <div className="text-[9px] tracking-[0.25em] text-right" style={{ color: 'rgba(0,243,255,0.5)' }}>
                {stats.boosting ? 'BOOST ENGAGED' : 'CRUISE'}
              </div>
            </div>
          </div>

          {/* Crosshair + lock state */}
          {gameState === 'running' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
              <Crosshair
                size={26}
                style={{
                  color: stats.locked ? '#ffb020' : CYAN,
                  opacity: 0.85,
                  filter: `drop-shadow(0 0 6px ${stats.locked ? 'rgba(255,176,32,0.9)' : 'rgba(0,243,255,0.9)'})`,
                }}
              />
              <div
                className="font-mono text-[9px] tracking-[0.25em] whitespace-nowrap"
                style={{ color: stats.locked ? '#ffb020' : stats.lock > 0 ? 'rgba(0,243,255,0.75)' : 'rgba(148,163,184,0.45)' }}
              >
                {stats.locked ? 'LOCK ACQUIRED' : stats.lock > 0 ? `LOCKING ${Math.round(stats.lock * 100)}%` : 'NO TARGET'}
              </div>
            </div>
          )}

          {/* Anime kill callout */}
          {gameState === 'running' && stats.killFlash > 0.3 && stats.chain > 0 && (
            <div className="absolute inset-x-0 top-[22%] flex flex-col items-center pointer-events-none">
              <div key={stats.kills} className="anime-banner relative flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <div
                    className="anime-slash absolute h-[2px] w-[min(520px,80vw)]"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,176,32,0.9), rgba(255,255,255,0.95), rgba(255,176,32,0.9), transparent)',
                      boxShadow: '0 0 18px rgba(255,176,32,0.8)',
                    }}
                  />
                  <span
                    className="relative font-orbitron text-2xl sm:text-4xl font-black italic tracking-[0.08em] text-white"
                    style={{ textShadow: '0 0 24px rgba(255,176,32,0.95), 0 0 4px #fff' }}
                  >
                    {CHAIN_LABELS[Math.min(CHAIN_LABELS.length - 1, stats.chain - 1)]}
                  </span>
                </div>
                {stats.chain > 1 && (
                  <span className="mt-1 font-mono text-[10px] tracking-[0.45em]" style={{ color: '#ffb020' }}>
                    {stats.chain}× CHAIN
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Surface objective */}
          {gameState === 'running' && stats.realm === 'planet' && (
            <div className="absolute left-1/2 top-16 sm:top-20 w-[min(340px,72vw)] -translate-x-1/2 text-center">
              <div
                className="font-orbitron text-[11px] tracking-[0.32em]"
                style={{ color: '#ffd9a0', textShadow: '0 0 14px rgba(255,180,90,0.7)' }}
              >
                SURFACE · {stats.worldName}
              </div>
              <div
                className="mt-1 h-1.5 overflow-hidden rounded-sm border"
                style={{ borderColor: 'rgba(255,209,102,0.45)', background: 'rgba(3,9,16,0.7)' }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round(stats.worldProgress * 100)}%`,
                    background: 'linear-gradient(90deg, #ff9a4d, #ffe6a3)',
                    boxShadow: '0 0 12px rgba(255,154,77,0.8)',
                  }}
                />
              </div>
              <div className="mt-1 text-[9px] tracking-[0.3em]" style={{ color: '#fcd9a8' }}>
                EXTRACTION IN {Math.max(0, Math.ceil((1 - stats.worldProgress) * SURFACE_SECONDS))}s
              </div>
            </div>
          )}

          {/* World detected prompt */}
          {gameState === 'running' &&
            stats.realm === 'space' &&
            stats.worldFlash < 0.02 &&
            stats.worldPrompt > 0.15 && (
              <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                <div className="font-mono text-[9px] tracking-[0.35em]" style={{ color: 'rgba(0,243,255,0.75)' }}>
                  WORLD DETECTED
                </div>
                <div
                  className="font-orbitron text-lg sm:text-2xl font-black tracking-[0.2em]"
                  style={{ color: '#e2e8f0', textShadow: '0 0 20px rgba(0,243,255,0.6)' }}
                >
                  {stats.worldName}
                </div>
                <button
                  type="button"
                  onClick={() => engineRef.current?.enterPlanet()}
                  className="pointer-events-auto mt-1 flex items-center gap-2 rounded px-4 py-2 font-orbitron text-[11px] font-bold tracking-widest transition-transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,243,255,0.22), rgba(0,119,182,0.4))',
                    border: `1px solid ${CYAN}`,
                    color: '#d9fdff',
                    boxShadow: '0 0 26px rgba(0,243,255,0.45)',
                    opacity: Math.max(0.55, stats.worldPrompt),
                  }}
                >
                  <Globe size={14} /> DIVE IN{!isTouch && <span className="opacity-60">[F]</span>}
                </button>
              </div>
            )}

          <div className={`absolute left-4 sm:left-5 flex flex-col gap-2 ${isTouch ? 'bottom-[152px]' : 'bottom-4'}`}>
            <Bar
              value={stats.hull}
              color={stats.regen ? '#34d399' : hullColor}
              label={stats.regen ? 'HULL · PATCHING' : 'HULL'}
              icon={<Heart size={9} />}
            />
            <Bar value={stats.energy} color={CYAN} label="BOOST" icon={<Zap size={9} />} />
          </div>

          {!isTouch && (
            <div className="absolute bottom-4 right-4 sm:right-5 text-right text-[9px] leading-relaxed" style={{ color: 'rgba(148,163,184,0.6)' }}>
              <div><span style={{ color: CYAN }}>W/S</span> PITCH · <span style={{ color: CYAN }}>A/D</span> YAW · <span style={{ color: CYAN }}>Q/E</span> ROLL</div>
              <div><span style={{ color: CYAN }}>SHIFT</span> BOOST · <span style={{ color: CYAN }}>SPACE</span> FIRE · <span style={{ color: CYAN }}>ESC</span> PAUSE</div>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {gameState === 'loading' && (
        <FlightLoadingScreen
          progress={loadingProgress}
          statusText={loadingStatusText}
        />
      )}

      {/* Error */}
      {error && gameState !== 'loading' && (
        <div className="absolute inset-x-0 bottom-4 z-30 mx-4 rounded border p-3 text-center text-xs font-mono" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(30,10,10,0.8)', color: '#fca5a5' }}>
          {error}
        </div>
      )}      {/* Touch flight controls */}
      {isTouch && gameState === 'running' && (
        <TouchControls
          onSteer={(x, y) => engineRef.current?.setTouchSteer(x, y)}
          onFire={active => engineRef.current?.setTouchFire(active)}
          onBoost={active => engineRef.current?.setTouchBoost(active)}
          onRoll={direction => engineRef.current?.setTouchRoll(direction)}
        />
      )}

          {/* Ready */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 px-5 text-center" style={{ background: 'radial-gradient(ellipse at center, rgba(3,5,9,0.55) 0%, rgba(3,5,9,0.9) 75%)' }}>
          <div>
            <p className="text-[10px] font-mono tracking-[0.4em]" style={{ color: 'rgba(0,243,255,0.7)' }}>SIMULATION 07 // COMBAT THERAPY</p>
            <h2 className="font-orbitron text-2xl sm:text-4xl font-black tracking-widest mt-2" style={{ color: CYAN, textShadow: '0 0 24px rgba(0,243,255,0.5)' }}>
              ENDLESS CHASE
            </h2>
            <p className="text-xs sm:text-sm mt-2 max-w-md mx-auto" style={{ color: '#94a3b8' }}>
              Raiders run the moment you arrive. Your guns auto-lock the raider ahead — wait for the reticle to turn amber, then fire. Scoop the gold coin trails on the way through: they pay score, refill boost, and chain into a multiplier. Back-to-back kills drop the fight into slow motion. Watch for worlds drifting ahead: fly up to one and dive in to fight across its surface for a bonus.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono max-w-lg w-full">
            {controlHelp.map(([key, action]) => (
              <div key={key} className="rounded border px-2 py-1.5 text-left" style={{ borderColor: 'rgba(0,243,255,0.18)', background: 'rgba(13,19,34,0.7)' }}>
                <div style={{ color: CYAN }}>{key}</div>
                <div style={{ color: '#64748b' }}>{action}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="group flex items-center gap-2 px-6 py-3 rounded font-orbitron text-sm font-bold tracking-widest transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, rgba(0,243,255,0.2), rgba(0,119,182,0.35))', border: `1px solid ${CYAN}`, color: CYAN, boxShadow: '0 0 24px rgba(0,243,255,0.35)' }}
            >
              <Rocket size={16} />
              LAUNCH FIGHTER
            </button>
            {fullscreenSupported && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-3 rounded font-orbitron text-[11px] tracking-widest border transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(148,163,184,0.35)', color: '#94a3b8' }}
              >
                <Maximize size={13} />
                FULLSCREEN
              </button>
            )}
          </div>
          {best > 0 && (
            <p className="text-[10px] font-mono" style={{ color: '#475569' }}>BEST RUN · {best.toLocaleString()}</p>
          )}
        </div>
      )}

      {/* Paused */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-void/70 backdrop-blur-sm">
          <p className="font-orbitron text-xl tracking-[0.3em]" style={{ color: CYAN }}>SIMULATION PAUSED</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResume}
              className="flex items-center gap-2 px-4 py-2 rounded font-orbitron text-xs tracking-widest border transition-colors hover:bg-cyan-500/10"
              style={{ borderColor: CYAN, color: CYAN }}
            >
              <Play size={13} /> RESUME
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2 rounded font-orbitron text-xs tracking-widest border transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(148,163,184,0.4)', color: '#94a3b8' }}
            >
              <RotateCcw size={13} /> RESTART
            </button>
          </div>
        </div>
      )}

      {/* Game over */}
      {gameState === 'over' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 px-4 text-center bg-void/60 backdrop-blur-[2px]">
          <div>
            <p className="text-[10px] font-mono tracking-[0.4em]" style={{ color: 'rgba(239,68,68,0.8)' }}>HULL BREACH</p>
            <h2 className="font-orbitron text-2xl sm:text-4xl font-black tracking-widest mt-2" style={{ color: RED, textShadow: '0 0 24px rgba(239,68,68,0.5)' }}>
              SIGNAL LOST
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full max-w-2xl font-mono">
            {[
              ['SCORE', finalStats.score.toLocaleString(), CYAN],
              ['KILLS', String(finalStats.kills), '#e2e8f0'],
              ['COINS', String(finalStats.coins), '#ffc02e'],
              ['WORLDS', String(finalStats.worlds), '#c084fc'],
              ['WAVE', String(finalStats.wave), '#e2e8f0'],
              ['SURVIVED', formatTime(finalStats.time), '#e2e8f0'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded border p-2.5" style={{ borderColor: 'rgba(0,243,255,0.2)', background: 'rgba(13,19,34,0.8)' }}>
                <div className="text-[9px] tracking-[0.25em]" style={{ color: '#64748b' }}>{label}</div>
                <div className="font-orbitron text-lg font-bold mt-0.5" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          <p className="text-[10px] font-mono" style={{ color: '#64748b' }}>
            PERSONAL BEST · <span style={{ color: CYAN }}>{best.toLocaleString()}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 rounded font-orbitron text-xs font-bold tracking-widest transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, rgba(0,243,255,0.2), rgba(0,119,182,0.35))', border: `1px solid ${CYAN}`, color: CYAN }}
            >
              <Gauge size={14} /> REDEPLOY
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-2 px-4 py-2.5 rounded font-orbitron text-xs tracking-widest border transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(148,163,184,0.35)', color: '#94a3b8' }}
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              {muted ? 'SOUND OFF' : 'SOUND ON'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
