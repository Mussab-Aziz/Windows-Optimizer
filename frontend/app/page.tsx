"use client";

import { useState, useEffect, useCallback } from "react";
import Dashboard from "@/components/Dashboard";
import AdvancedTweaks from "@/components/AdvancedTweaks";
import BackendGenerator from "@/components/BackendGenerator";

type Tab = "dashboard" | "advanced" | "generator";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [bridgeStatus, setBridgeStatus] = useState("Checking connection...");
  const [loading, setLoading] = useState<string | null>(null);
  const [tweakResults, setTweakResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  useEffect(() => {
    if (typeof window !== "undefined" && window.systemAPI) {
      console.log("[Frontend] Bridge detected: window.systemAPI is available");
      setBridgeStatus("Connected - Python Engine Ready");
    } else {
      console.error("[Frontend] Bridge NOT detected: window.systemAPI is undefined");
      setBridgeStatus("Bridge Not Found (Did you run 'npm start'?)");
    }
  }, []);

  const handleApplyTweak = useCallback(
    async (id: string, scriptName: string, args?: string) => {
      console.log(`[Frontend] Button clicked: ${id} -> ${scriptName}${args ? ` (${args})` : ""}`);

      if (!window.systemAPI) {
        alert("Electron bridge not connected!");
        return;
      }

      setLoading(id);
      try {
        const result = args
          ? await window.systemAPI.applyTweakWithArgs(scriptName, args)
          : await window.systemAPI.applyTweak(scriptName);

        console.log(`[Frontend] Result received:`, result);
        setTweakResults((prev) => ({ ...prev, [id]: result }));
      } catch (error) {
        console.error("[Frontend] Error during applyTweak:", error);
        setTweakResults((prev) => ({
          ...prev,
          [id]: { success: false, message: "Failed to communicate with bridge." },
        }));
      }
      setLoading(null);
    },
    []
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "DASHBOARD" },
    { id: "advanced", label: "ADVANCED TWEAKS" },
    { id: "generator", label: "BACKEND CODE GENERATOR" },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-emerald-400">
            ⚡ System Optimizer
          </h1>
          <span
            className={`text-xs px-3 py-1 rounded-full border ${
              bridgeStatus.includes("Ready")
                ? "text-emerald-400 border-emerald-600/40 bg-emerald-950/30"
                : "text-amber-400 border-amber-600/40 bg-amber-950/30"
            }`}
          >
            {bridgeStatus}
          </span>
        </div>

        {/* Tab Navigation */}
        <nav className="max-w-5xl mx-auto px-6 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-xs font-semibold tracking-widest uppercase transition-colors rounded-t-lg ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-emerald-400 border-t border-l border-r border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <Dashboard
            loading={loading}
            tweakResults={tweakResults}
            onApply={handleApplyTweak}
          />
        )}

        {activeTab === "advanced" && (
          <AdvancedTweaks
            loading={loading}
            tweakResults={tweakResults}
            onApply={handleApplyTweak}
          />
        )}

        {activeTab === "generator" && <BackendGenerator />}
      </div>
    </main>
  );
}
