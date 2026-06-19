"use client";

import { useState } from "react";
import TweakCard from "./TweakCard";

interface AdvancedTweaksProps {
  loading: string | null;
  tweakResults: Record<string, { success: boolean; message: string }>;
  onApply: (id: string, script: string, args?: string) => void;
}

const PROFILES = ["gaming", "creator", "office"];
const PROFILE_MAP: Record<string, string> = {
  gaming: "Gaming 🎮",
  creator: "Creator 🎨",
  office: "Office 💼",
};

export default function AdvancedTweaks({ loading, tweakResults, onApply }: AdvancedTweaksProps) {
  const [selectedProfile, setSelectedProfile] = useState("gaming");

  return (
    <div className="space-y-6">

      {/* Workload Profiles */}
      <section>
        <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2 mb-4">
          Workload Profiles
        </h3>
        <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <label className="text-sm text-zinc-300 font-medium">Select Profile:</label>
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="bg-zinc-900 text-white border border-zinc-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {PROFILES.map((p) => (
              <option key={p} value={p}>
                {PROFILE_MAP[p]}
              </option>
            ))}
          </select>
          <button
            onClick={() => onApply("profile", "workload_profiles.py", selectedProfile)}
            disabled={loading === "profile"}
            className="bg-emerald-700 hover:bg-emerald-600 transition-colors px-6 py-2 rounded-md font-medium disabled:opacity-50 text-sm ml-auto"
          >
            {loading === "profile" ? "Applying..." : "Apply Profile"}
          </button>
        </div>
        {tweakResults["profile"] && (
          <p
            className={`text-xs mt-2 ${
              tweakResults["profile"].success ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {tweakResults["profile"].message.substring(0, 120)}
          </p>
        )}
      </section>

      {/* Ultimate Performance */}
      <TweakCard
        id="ultimate"
        scriptName="ultimate_performance.py"
        title="Ultimate Performance Power Plan"
        description="Unhide & enable the hidden Windows Ultimate Performance power plan."
        loading={loading}
        actionLabel="Enable"
        result={tweakResults["ultimate"]}
        onApply={(s) => onApply("ultimate", s)}
        disableOnSuccess
      />

      {/* HAGS */}
      <TweakCard
        id="hags"
        scriptName="hags_enable.py"
        title="Optimize GPU (HAGS)"
        description="Enable Hardware-Accelerated GPU Scheduling via Registry (requires reboot)."
        loading={loading}
        actionLabel="Enable"
        result={tweakResults["hags"]}
        onApply={(s) => onApply("hags", s)}
        disableOnSuccess
      />

      {/* Clean Cache */}
      <TweakCard
        id="cache"
        scriptName="clean_cache.py"
        title="Clean System Cache"
        description="Safely clear %temp%, prefetch, and Windows Update caches."
        loading={loading}
        actionLabel="Clean"
        result={tweakResults["cache"]}
        onApply={(s) => onApply("cache", s)}
        disableOnSuccess
      />

      {/* High Process Priority */}
      <TweakCard
        id="priority"
        scriptName="high_priority.py"
        title="High Process Priority"
        description="Automatically assign high CPU priority to foreground applications."
        loading={loading}
        actionLabel="Enable"
        result={tweakResults["priority"]}
        onApply={(s) => onApply("priority", s)}
        disableOnSuccess
      />

      {/* Service Management Section */}
      <div className="pt-4 border-t border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Service Management
        </h3>

        <TweakCard
          id="sysmain"
          title="SYSMAIN (Superfetch)"
          description="Disable Superfetch/SysMain to reduce 100% disk I/O usage bugs."
          loading={loading}
          actionLabel="Disable"
          secondaryAction={{ label: "Restore", script: "sysmain_restore" }}
          result={tweakResults["sysmain"]}
          onApply={(s) => {
            if (s === "sysmain_restore") {
              onApply("sysmain", "disable_sysmain.py", "restore");
            } else {
              onApply("sysmain", "disable_sysmain.py");
            }
          }}
          disableOnSuccess
        />

        <TweakCard
          id="spooler"
          title="PRINTSPOOLER"
          description="Disable background printer services for dedicated gaming/development rigs."
          loading={loading}
          actionLabel="Disable"
          secondaryAction={{ label: "Restore", script: "spooler_restore" }}
          result={tweakResults["spooler"]}
          onApply={(s) => {
            if (s === "spooler_restore") {
              onApply("spooler", "disable_printspooler.py", "restore");
            } else {
              onApply("spooler", "disable_printspooler.py");
            }
          }}
          disableOnSuccess
        />
      </div>
    </div>
  );
}
