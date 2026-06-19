"use client";

import React, { useState, useEffect } from "react";

// --- Custom UI Components ---

const StyledToggle = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition-all duration-300 ${
      checked ? "bg-white" : "bg-[#111113] border border-zinc-700"
    } ${disabled ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-300 ${
        checked ? "translate-x-[26px] bg-black" : "translate-x-1 bg-zinc-400"
      }`}
    />
  </button>
);

const Gauge = ({ value, label, displayValue, color }: { value: number, label: string, displayValue: string, color: string }) => {
  const radius = 60;
  const circumference = Math.PI * radius;
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate the gauge on load
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[130px] h-[70px] overflow-hidden flex justify-center">
        <svg className="absolute top-0" width="130" height="130" viewBox="0 0 140 140">
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="#1f1f22" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute bottom-0 w-full text-center text-2xl font-bold">{displayValue}</div>
      </div>
      <div className="text-xs text-zinc-400 mt-4 font-semibold tracking-widest uppercase">{label}</div>
    </div>
  );
};

const ServiceCard = ({ title, description, status, onToggle, accent, loading }: any) => (
  <div className="flex items-center justify-between bg-[#111113] border border-zinc-800/60 rounded-lg relative p-5 pl-7 transition-all hover:bg-[#141417]">
     {/* Left Accent Line */}
     <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-lg ${accent}`}></div>
     
     <div>
        <h3 className="text-base font-bold tracking-wide text-white uppercase">{title}</h3>
        <p className="text-zinc-400 text-sm mt-1">{description}</p>
     </div>
     
     <button 
       disabled={loading}
       onClick={onToggle}
       className={`font-bold text-xs px-6 py-2 rounded-full tracking-wider transition-colors disabled:opacity-50 ${
         status === "ENABLED" 
           ? "bg-blue-600 hover:bg-blue-500 text-white" 
           : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"
       }`}
     >
       {loading ? "..." : status}
     </button>
  </div>
);

// --- Types ---
type SystemStats = {
  cpuSpeedMHz: number;
  cpuModel: string;
  cpuCount: number;
  cpuUsage: number;
  totalRamGB: string;
  usedRamGB: string;
  freeRamGB: string;
  ramUsedPct: number;
};

// --- LiveMetricCard ---
const LiveMetricCard = ({
  label, value, sub, accent, bar, barPct
}: {
  label: string; value: string; sub?: string; accent: string; bar?: boolean; barPct?: number;
}) => (
  <div className="flex flex-col gap-2 bg-[#111113] border border-zinc-800/60 rounded-xl px-6 py-5">
    <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{label}</div>
    <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    {bar && barPct !== undefined && (
      <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${barPct}%`, background: accent.includes('emerald') ? '#10b981' : accent.includes('blue') ? '#3b82f6' : '#f97316' }}
        />
      </div>
    )}
  </div>
);

// --- Main Application ---

export default function Home() {
  const [tab, setTab] = useState<"dashboard" | "advanced">("dashboard");
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);

  // Central state for all toggles
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    telemetry: true,
    cache: false,
    ultimate: true,
    hags: true,
    priority: true,
    sysmain: true, 
    printspooler: true
  });

  // Check Electron Bridge on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.systemAPI) {
        setBridgeConnected(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Live system stats polling — every 2.5 seconds
  // A 1-second poll spawns powershell.exe every tick, keeping the CPU just active
  // enough to prevent it from clocking down when on the Balanced plan. 2.5s gives
  // the CPU real idle windows so plan switches show a visible frequency difference.
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (typeof window !== "undefined" && window.systemAPI?.getSystemStats) {
        try {
          const s = await window.systemAPI.getSystemStats();
          if (alive) setStats(s);
        } catch (_) {}
      }
    };
    poll();
    const id = setInterval(poll, 2500);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Universal handler for executing Python scripts
  // Passes "disable" to the script when the feature is currently ON (user is turning it off).
  // clean_cache is always one-shot — arg is never passed for it.
  const executeScript = async (key: string, scriptName: string) => {
    const isCurrentlyEnabled = toggles[key];
    const isOneShot = scriptName === 'clean_cache.py';
    const arg = (!isOneShot && isCurrentlyEnabled) ? 'disable' : '';

    if (!window.systemAPI) {
      console.warn(`[Mock] ${scriptName} ${arg || 'enable'}`);
      setToggles(prev => ({ ...prev, [key]: !prev[key] }));
      return;
    }

    setLoadingAction(key);
    try {
      const res = arg
        ? await window.systemAPI.applyTweakWithArgs(scriptName, arg)
        : await window.systemAPI.applyTweak(scriptName);
      if (res.success) {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
      } else {
        console.error("Action failed or canceled.");
      }
    } catch(e) {
      console.error(e);
    }
    setLoadingAction(null);
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white p-10 flex justify-center font-sans">
      
      {/* Top Right Status Indicator */}
      <div className="absolute top-8 right-8 flex items-center gap-2 text-xs font-bold tracking-widest">
         <span className={`w-2 h-2 rounded-full ${bridgeConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></span>
         <span className={bridgeConnected ? "text-emerald-500/80" : "text-amber-500/80"}>
           {bridgeConnected ? "ENGINE CONNECTED" : "AWAITING ENGINE"}
         </span>
      </div>

      <div className="w-full max-w-4xl mt-4">
        
        {/* Header */}
        <h1 className="text-3xl font-medium mb-10 tracking-tight">Windows OS Optimization Utility</h1>
        
        {/* Navigation Tabs */}
        <div className="flex gap-10 border-b border-zinc-800/80 mb-10">
          {['dashboard', 'advanced'].map((t) => (
            <button 
              key={t}
              onClick={() => setTab(t as any)}
              className={`pb-3 text-xs font-bold tracking-widest transition-colors uppercase ${
                tab === t 
                  ? "text-white border-b-2 border-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === 'dashboard' ? 'Dashboard' : 'Advanced Tweaks'}
            </button>
          ))}
        </div>

        {/* --- TAB: DASHBOARD --- */}
        {tab === 'dashboard' && (
          <div className="animate-in fade-in duration-500">

            {/* Live Metrics Panel */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Live System Metrics</span>
                {stats ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                    LIVE
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-600">Waiting for engine…</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <LiveMetricCard
                  label="CPU Usage"
                  value={stats ? `${stats.cpuUsage}%` : '—'}
                  sub={stats ? `${stats.cpuCount} cores · ${(stats.cpuSpeedMHz / 1000).toFixed(2)} GHz` : 'Awaiting engine'}
                  accent="text-blue-400"
                  bar
                  barPct={stats?.cpuUsage ?? 0}
                />
                <LiveMetricCard
                  label="CPU Speed"
                  value={stats ? `${(stats.cpuSpeedMHz / 1000).toFixed(2)} GHz` : '—'}
                  sub={stats ? stats.cpuModel.split(' ').slice(0, 4).join(' ') : 'Awaiting engine'}
                  accent="text-blue-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <LiveMetricCard
                  label="RAM Used"
                  value={stats ? `${stats.usedRamGB} GB` : '—'}
                  sub={stats ? `${stats.ramUsedPct}% of ${stats.totalRamGB} GB` : 'Awaiting engine'}
                  accent="text-orange-400"
                  bar
                  barPct={stats?.ramUsedPct ?? 0}
                />
                <LiveMetricCard
                  label="RAM Free"
                  value={stats ? `${stats.freeRamGB} GB` : '—'}
                  sub={stats ? `${100 - (stats.ramUsedPct ?? 0)}% available` : 'Awaiting engine'}
                  accent="text-emerald-400"
                />
                <LiveMetricCard
                  label="Total RAM"
                  value={stats ? `${stats.totalRamGB} GB` : '—'}
                  sub="Physical memory"
                  accent="text-zinc-300"
                />
              </div>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-2 gap-x-20 gap-y-10 border-t border-zinc-800/50 pt-10">
              
              <div className="flex items-center justify-between">
                <span className="text-base text-zinc-100">Workload Profile</span>
                <select className="bg-[#111113] text-white border border-zinc-700 rounded-md px-4 py-1.5 w-48 text-sm focus:outline-none focus:border-zinc-500 appearance-none cursor-pointer">
                  <option>Gaming</option>
                  <option>Creator</option>
                  <option>Office</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-base text-zinc-100">Ultimate Performance</span>
                <StyledToggle 
                  checked={toggles.ultimate} 
                  onChange={() => executeScript('ultimate', 'ultimate_performance.py')} 
                  disabled={loadingAction === 'ultimate'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-base text-zinc-100">Disable Telemetry</span>
                <StyledToggle 
                  checked={toggles.telemetry} 
                  onChange={() => executeScript('telemetry', 'registry_tweaker.py')} 
                  disabled={loadingAction === 'telemetry'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-base text-zinc-100">Optimize GPU (HAGS)</span>
                <StyledToggle 
                  checked={toggles.hags} 
                  onChange={() => executeScript('hags', 'hags_enable.py')} 
                  disabled={loadingAction === 'hags'}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base text-zinc-100">Clean System Cache</span>
                <StyledToggle 
                  checked={toggles.cache} 
                  onChange={() => executeScript('cache', 'clean_cache.py')} 
                  disabled={loadingAction === 'cache'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-base text-zinc-100">High Process Priority</span>
                <StyledToggle 
                  checked={toggles.priority} 
                  onChange={() => executeScript('priority', 'high_priority.py')} 
                  disabled={loadingAction === 'priority'}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: ADVANCED TWEAKS --- */}
        {tab === 'advanced' && (
          <div className="animate-in fade-in duration-500">
            {/* Visual Gauges */}
            <div className="relative pt-6 pb-12">
               <div className="absolute left-32 top-8 text-zinc-500 text-xs tracking-widest font-bold">CPU</div>
               <div className="flex justify-center gap-32">
                  <Gauge value={18.75} label="RAM" displayValue="6G" color="#10b981" />
                  <Gauge value={15} label="GPU" displayValue="15%" color="#f97316" />
               </div>
            </div>

            {/* Services List */}
            <div className="space-y-4">
              <ServiceCard 
                title="SYSMAIN"
                description="Disables Superfetch/SysMain to reduce disk I/O usage."
                status={toggles.sysmain ? "ENABLED" : "DISABLED"}
                accent="bg-blue-600"
                loading={loadingAction === 'sysmain'}
                onToggle={() => executeScript('sysmain', 'disable_sysmain.py')}
              />
              <ServiceCard 
                title="PRINTSPOOLER"
                description="Disables printer background services for non-office tasks."
                status={toggles.printspooler ? "ENABLED" : "DISABLED"}
                accent="bg-blue-600"
                loading={loadingAction === 'printspooler'}
                onToggle={() => executeScript('printspooler', 'disable_printspooler.py')}
              />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
