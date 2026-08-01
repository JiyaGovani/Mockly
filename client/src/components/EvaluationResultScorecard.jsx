import React from 'react';
import ScoreRing from './ScoreRing';
import MetricBar from './MetricBar';
import FeedbackCard from './FeedbackCard';

/**
 * EvaluationResultScorecard Component
 * Renders completed evaluation scorecard (both MCQ instant results and descriptive AI feedback).
 */
export default function EvaluationResultScorecard({ result, question, onReset, onNavigateBack }) {
  const isMcqResult = result.isMcq || (question?.options && question.options.length > 0);

  if (isMcqResult) {
    return (
      <div className="space-y-6 page-enter">
        <div className="glass-card p-6 md:p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <ScoreRing
              score={result.overallScore}
              size={140}
              stroke={10}
              label={result.overallScore === 100 ? '100% Correct' : '0% Incorrect'}
            />
            <div>
              <span
                className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${
                  result.overallScore === 100
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {result.overallScore === 100 ? '🎉 Correct Answer!' : '❌ Incorrect Selection'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              ⏱ Evaluated instantly in {result.latency?.total || 5}ms
            </p>
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeedbackCard
            title="Status"
            items={result.strengths?.length > 0 ? result.strengths : result.weaknesses}
            icon={result.overallScore === 100 ? '✅' : '⚠️'}
            colorClass={result.overallScore === 100 ? 'text-emerald-400' : 'text-amber-400'}
          />
          <FeedbackCard
            title={result.overallScore === 100 ? 'Explanation' : 'Correct Option'}
            items={result.missingPoints?.length > 0 ? result.missingPoints : result.suggestions}
            icon="🎯"
            colorClass="text-indigo-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={onReset} className="btn-primary flex-1">
            🔄 Try Again
          </button>
          <button
            onClick={onNavigateBack}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all font-medium"
          >
            ← Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Overall Score + Metrics Row */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreRing score={result.overallScore} size={140} stroke={10} label="Overall Score" />

          <div className="flex-1 w-full space-y-4">
            <MetricBar label="Keyword Coverage" value={result.keywordScore} icon="🔑" />
            <MetricBar
              label="Semantic Similarity"
              value={Math.round((result.semanticSimilarity || 0) * 100)}
              icon="🧬"
            />
            <MetricBar label="AI Evaluation" value={result.llmScore} icon="🤖" />
          </div>
        </div>

        {/* Latency Stats */}
        {result.latency && (
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>⚡ Embedding: {result.latency.embedding}ms</span>
            <span>🧠 LLM: {(result.latency.llm / 1000).toFixed(1)}s</span>
            <span>⏱ Total: {(result.latency.total / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Keywords Breakdown */}
      {(result.matchedKeywords?.length > 0 || result.missingKeywords?.length > 0) && (
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">🔑 Keyword Analysis</h4>
          <div className="flex flex-wrap gap-2">
            {result.matchedKeywords?.map((kw, i) => (
              <span
                key={`m-${i}`}
                className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-400 font-medium"
              >
                ✓ {kw}
              </span>
            ))}
            {result.missingKeywords?.map((kw, i) => (
              <span
                key={`x-${i}`}
                className="px-2.5 py-1 text-xs rounded-full bg-red-500/15 text-red-400 font-medium"
              >
                ✗ {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeedbackCard title="Strengths" items={result.strengths} icon="💪" colorClass="text-emerald-400" />
        <FeedbackCard title="Weaknesses" items={result.weaknesses} icon="⚠️" colorClass="text-amber-400" />
        <FeedbackCard title="Missing Points" items={result.missingPoints} icon="❌" colorClass="text-red-400" />
        <FeedbackCard title="Suggestions" items={result.suggestions} icon="💡" colorClass="text-indigo-400" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button onClick={onReset} className="btn-primary flex-1">
          🔄 Try Again
        </button>
        <button
          onClick={onNavigateBack}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all font-medium"
        >
          ← Back to Questions
        </button>
      </div>
    </div>
  );
}
