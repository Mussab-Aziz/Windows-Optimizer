"use client";

import { useEffect, useState } from "react";

interface GaugeChartProps {
  /** 0–100 */
  value: number;
  label: string;
  /** "ram" or "gpu" — controls the color arc */
  variant?: "ram" | "gpu";
  size?: number;
}

const STROKE_WIDTH = 10;
const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~377

export default function GaugeChart({
  value,
  label,
  variant = "ram",
  size = 160,
}: GaugeChartProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(Math.min(value, 100)), 100);
    return () => clearTimeout(timer);
  }, [value]);

  // Visible arc length grows from 0 to value%
  const visibleLength = (animatedValue / 100) * CIRCUMFERENCE;
  // Dash pattern: visible segment + invisible remainder
  // Offset = circumference → hidden. Decreasing offset ≈ growing clockwise.
  const dasharray = `${CIRCUMFERENCE}`;
  const dashoffset = CIRCUMFERENCE - visibleLength;

  const arcColor =
    variant === "gpu"
      ? animatedValue > 70
        ? "#f97316"
        : "#22c55e"
      : animatedValue > 80
      ? "#f97316"
      : animatedValue > 50
      ? "#eab308"
      : "#22c55e";

  const center = RADIUS + STROKE_WIDTH + 4;
  const viewBox = center * 2;

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: size, height: size + 36 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          className="text-zinc-800"
        />
        {/* Value arc — rotated -90deg so it starts at 12 o'clock */}
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke={arcColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={dasharray}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: "stroke-dashoffset 1s ease, stroke 0.3s ease",
          }}
        />
        {/* Center value text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          style={{ fontSize: "22px", fontWeight: 700 }}
        >
          {Math.round(animatedValue)}%
        </text>
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#a1a1aa"
          style={{ fontSize: "11px" }}
        >
          {variant === "ram" ? "RAM" : "GPU"}
        </text>
      </svg>
      <span className="text-sm text-zinc-400 mt-1">{label}</span>
    </div>
  );
}
