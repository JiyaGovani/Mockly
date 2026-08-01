import React, { useState, useEffect } from 'react';

const TIPS = [
  '💡 Tip: Structure your answer with a clear definition first, then examples.',
  '🎯 Focus on key terms that the interviewer is looking for.',
  '⏱ In a real interview, aim for 2-3 minute responses.',
  '📝 Use the STAR method for behavioral questions (Situation, Task, Action, Result).',
  '🧠 Think out loud — interviewers value your thought process.',
  '✅ Cover edge cases and trade-offs to stand out.',
  '🔄 Compare and contrast when explaining similar concepts.',
  '📊 Back up your points with real-world examples when possible.',
];

const PROCESSING_STEPS = [
  { label: 'Analyzing keywords in your answer', icon: '🔍' },
  { label: 'Computing semantic similarity', icon: '🧮' },
  { label: 'Running AI evaluation model', icon: '🤖' },
  { label: 'Generating detailed feedback', icon: '📝' },
];

/**
 * EvaluationLoadingCard Component
 * Displays animated progress steps and rotating interview tips during AI evaluation.
 */
export default function EvaluationLoadingCard({ currentStep }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-6 md:p-8 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <div className="spinner" style={{ width: '1.5rem', height: '1.5rem' }} />
        <h3 className="text-lg font-semibold text-stone-800">Evaluating your answer...</h3>
      </div>

      {/* Processing Steps */}
      <div className="space-y-3 mb-8">
        {PROCESSING_STEPS.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
              i < currentStep
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : i === currentStep
                ? 'bg-amber-900/10 border border-amber-900/25 animate-pulse'
                : 'bg-stone-100 border border-stone-200 opacity-40'
            }`}
          >
            <span className="text-lg">{i < currentStep ? '✅' : step.icon}</span>
            <span className={`text-sm ${i <= currentStep ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Rotating Tips */}
      <div className="bg-amber-900/10 rounded-xl p-4 border border-amber-900/20">
        <p className="text-sm text-amber-950 font-medium transition-all duration-500" key={tipIndex}>
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}
