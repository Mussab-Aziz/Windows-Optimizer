"use client";

import MetricBar from "./MetricBar";
import GaugeChart from "./GaugeChart";
import TweakCard from "./TweakCard";

interface DashboardProps {
  loading: string | null;
  tweakResults: Record<string, { success: boolean; message: string }>;
  onApply: (id: string, script: string) => void;
}

export default function Dashboard({ loading, tweakResults, onApply }: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Top Metric Bar */}
      <MetricBar ramFreed={425} cpuOverhead={-35} ioEfficiency={10} />

      {/* Gauges */}
      <div className="flex justify-center gap-12 py-4">
        <GaugeChart value={68} label="Estimated RAM Usage" variant="ram" />
        <GaugeChart value={42} label="Estimated GPU Load" variant="gpu" />
      </div>

      {/* Quick Tweaks */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">
          Quick Tweaks
        </h3>

        <TweakCard
          id="telemetry"
          scriptName="registry_tweaker.py"
          title="Disable Windows Telemetry"
          description="Stops background diagnostic tracking via Registry."
          loading={loading}
          actionLabel="Disable"
          secondaryAction={{ label: "Restore", script: "restore_telemetry.py" }}
          result={tweakResults["telemetry"]}
          onApply={(script) => onApply("telemetry", script)}
          disableOnSuccess
        />

        <TweakCard
          id="network"
          scriptName="network_optimizer.py"
          title="Disable Network Throttling"
          description="Removes multimedia throttling to prioritize game/upload speeds."
          loading={loading}
          result={tweakResults["network"]}
          onApply={(script) => onApply("network", script)}
          disableOnSuccess
        />
      </div>
    </div>
  );
}
