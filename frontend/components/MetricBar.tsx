interface MetricBarProps {
  ramFreed: number;   // in MB
  cpuOverhead: number; // percentage (can be negative)
  ioEfficiency: number; // percentage
}

export default function MetricBar({ ramFreed, cpuOverhead, ioEfficiency }: MetricBarProps) {
  const items = [
    {
      label: "Est. RAM Freed",
      value: `${ramFreed} MB`,
      icon: "🧠",
    },
    {
      label: "CPU Overhead",
      value: `${cpuOverhead > 0 ? "+" : ""}${cpuOverhead}%`,
      icon: "⚡",
      positive: cpuOverhead > 0,
    },
    {
      label: "I/O Efficiency",
      value: `${ioEfficiency > 0 ? "+" : ""}${ioEfficiency}%`,
      icon: "📊",
      positive: ioEfficiency > 0,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 text-center"
        >
          <span className="text-2xl">{item.icon}</span>
          <p className="text-lg font-bold text-white mt-1">{item.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
