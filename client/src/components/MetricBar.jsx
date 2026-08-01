import React from 'react';

/**
 * MetricBar Component
 * Renders individual metric bar with label, icon, and animated progress line.
 */
export default function MetricBar({ label, value, icon }) {
  const getBarColor = (v) => {
    if (v >= 80) return 'bg-emerald-500';
    if (v >= 60) return 'bg-amber-500';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600 flex items-center gap-1.5">
          <span>{icon}</span> {label}
        </span>
        <span className="text-stone-900 font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${getBarColor(value)} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
