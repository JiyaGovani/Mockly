import React from 'react';

/**
 * FeedbackCard Component
 * Displays bullet points for strengths, weaknesses, suggestions, or missing points.
 */
export default function FeedbackCard({ title, items, icon, colorClass }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="glass-card p-4">
      <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${colorClass}`}>
        <span>{icon}</span> {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
