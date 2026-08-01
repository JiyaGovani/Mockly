import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import EvaluationLoadingCard from '../components/EvaluationLoadingCard';
import EvaluationResultScorecard from '../components/EvaluationResultScorecard';

// Color mappings for question difficulty tags
const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  hard: { bg: 'bg-red-500/15', text: 'text-red-400' },
};

// Color mappings for question category tags
const TYPE_COLORS = {
  technical: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  behavioral: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  hr: { bg: 'bg-teal-500/15', text: 'text-teal-400' },
  aptitude: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
};

/**
 * ==============================================================================
 * PRACTICE INTERVIEW PAGE
 * ==============================================================================
 * Renders the question practice view.
 * States handled cleanly:
 * 1. Initial Loading (Skeleton Loader)
 * 2. Question View + Answer Form (MCQ option selector or descriptive text area)
 * 3. AI Evaluation Loading (Step-by-step progress & interview tips)
 * 4. Evaluation Result Scorecard (Score ring, keywords, & AI feedback)
 */
export default function Practice() {
  const { id } = useParams(); // Get question ID from URL route
  const navigate = useNavigate();

  // Component States
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch question details on component mount
  useEffect(() => {
    api
      .get(`/questions/${id}`)
      .then(({ data }) => {
        setQuestion(data.question || data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch question:', err);
        setError('Question not found');
        setLoading(false);
      });
  }, [id]);

  // Simulate progress step transitions during loading state
  useEffect(() => {
    if (!submitting) return;
    const timers = [
      setTimeout(() => setLoadingStep(1), 2000),
      setTimeout(() => setLoadingStep(2), 4000),
      setTimeout(() => setLoadingStep(3), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [submitting]);

  // Handle answer submission for AI evaluation
  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setSubmitting(true);
    setLoadingStep(0);
    setError('');

    try {
      const { data } = await api.post('/evaluation/submit', {
        questionId: id,
        userAnswer: userAnswer.trim(),
      });
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Evaluation failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset evaluation state to try again
  const handleReset = () => {
    setResult(null);
    setUserAnswer('');
    setError('');
  };

  // 1. Loading Skeleton View
  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-10">
          <div className="glass-card p-8 animate-pulse">
            <div className="h-5 w-24 rounded-full bg-stone-200 mb-4" />
            <div className="h-6 bg-stone-200 rounded w-full mb-2" />
            <div className="h-6 bg-stone-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error View
  if (error && !question) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-10 text-center">
          <div className="glass-card p-8">
            <p className="text-red-400 text-lg">{error}</p>
            <button onClick={() => navigate('/questions')} className="btn-primary mt-4">
              ← Back to Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const diffColors = DIFFICULTY_COLORS[question?.difficulty] || DIFFICULTY_COLORS.easy;
  const typeColors = TYPE_COLORS[question?.type] || TYPE_COLORS.technical;
  const hasOptions = Array.isArray(question?.options) && question.options.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 page-enter">
        {/* Back Navigation Link */}
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-6 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Questions
        </button>

        {/* Question Details Header Card */}
        <div className="glass-card p-6 md:p-8 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {question.role}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}>
              {question.type}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${diffColors.bg} ${diffColors.text}`}>
              {question.difficulty}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 leading-relaxed">{question.text}</h1>
        </div>

        {/* ── Dynamic State Rendering ── */}
        {submitting ? (
          /* STATE A: Evaluating Answer Loading Card */
          <EvaluationLoadingCard currentStep={loadingStep} />
        ) : result ? (
          /* STATE B: Evaluation Scorecard Result View */
          <EvaluationResultScorecard
            result={result}
            question={question}
            onReset={handleReset}
            onNavigateBack={() => navigate('/questions')}
          />
        ) : (
          /* STATE C: User Answer Input Form (MCQ or Text Area) */
          <div className="glass-card p-6 md:p-8">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              {hasOptions ? 'Select Your Answer' : 'Your Answer'}
            </label>

            {hasOptions ? (
              /* MCQ Options Selector Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected =
                    userAnswer.trim().toLowerCase() === opt.toLowerCase() ||
                    userAnswer.trim().toUpperCase() === letter ||
                    userAnswer.trim() === String(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setUserAnswer(opt)}
                      className={`flex items-center gap-3 p-4 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-amber-900/10 border-amber-900 text-stone-900 shadow-lg shadow-amber-900/10 ring-1 ring-amber-900'
                          : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                          isSelected ? 'bg-amber-900 text-white' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm font-medium flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Descriptive Answer Textarea */
              <>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here... Be thorough and include key concepts."
                  rows={10}
                  className="input-field resize-y min-h-[200px] text-sm leading-relaxed"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  {error && <span className="text-xs text-red-400">{error}</span>}
                </div>
              </>
            )}

            {error && hasOptions && <p className="text-xs text-red-400 mt-3">{error}</p>}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || submitting}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submit for AI Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
