import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('Frontend Developer');
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const roles = [
    {
      title: 'Frontend Developer',
      icon: '⚡',
      topics: ['React & Virtual DOM', 'CSS & Responsive Design', 'JavaScript Closures & Async', 'Web Performance'],
      desc: 'Master UI engineering concepts, state management, and real-time frontend problem solving.'
    },
    {
      title: 'Backend Developer',
      icon: '⚙️',
      topics: ['REST & GraphQL APIs', 'Database Indexing', 'Authentication & JWT', 'Node.js Event Loop'],
      desc: 'Practice system architecture, API design, database query optimization, and security.'
    },
    {
      title: 'Data Scientist / AI Engineer',
      icon: '🧠',
      topics: ['Machine Learning Pipeline', 'Python & Pandas', 'Model Evaluation Metrics', 'LLMs & RAG'],
      desc: 'Prepare for quantitative modeling, statistical theory, feature engineering, and AI prompts.'
    },
    {
      title: 'DevOps & Cloud Engineer',
      icon: '☁️',
      topics: ['Docker & Kubernetes', 'CI/CD Pipelines', 'Linux Kernel & Scripting', 'AWS Architecture'],
      desc: 'Hone skills in infrastructure automation, container orchestrations, and incident triage.'
    }
  ];

  const features = [
    {
      badge: 'Gemini Engine',
      title: 'Hybrid AI Feedback',
      bgColor: 'bg-amber-900',
      icon: '⚡'
    },
    {
      badge: 'Domain Questions',
      title: 'Targeted Repositories',
      bgColor: 'bg-amber-800',
      icon: '⚙️'
    },
    {
      badge: 'Timed Rounds',
      title: 'Mock Simulator',
      bgColor: 'bg-amber-950',
      icon: '💻'
    },
    {
      badge: 'Aptitude Tests',
      title: 'Placement Gate',
      bgColor: 'bg-emerald-700',
      icon: '🛡️'
    },
    {
      badge: 'Visual Scorecards',
      title: 'Visual Analytics',
      bgColor: 'bg-amber-700',
      icon: '📊'
    },
    {
      badge: 'Answer Comparison',
      title: 'Model Answers',
      bgColor: 'bg-stone-800',
      icon: '📝'
    }
  ];

  const testimonials = [
    {
      name: 'Aarav Sharma',
      role: 'Placed as Frontend Engineer @ Tech Corp',
      avatar: '👨‍💻',
      rating: 5,
      quote: 'Mockly AI gave me real-time feedback on my React & JS answers. The Gemini AI suggestions helped me structure my explanations clearly during my campus drive.'
    },
    {
      name: 'Priya Patel',
      role: 'SDE Candidate @ Global Solutions',
      avatar: '👩‍💻',
      rating: 5,
      quote: 'The placement gating tests and aptitude modules were spot on. I went into my technical interview rounds feeling 100% prepared and confident.'
    },
    {
      name: 'Rohan Verma',
      role: 'Data Engineer Intern',
      avatar: '👨‍🎓',
      rating: 5,
      quote: 'The hybrid scoring breakdown—evaluating keywords, accuracy, and clarity—showed me exactly what I was missing in my answers. Highly recommended!'
    }
  ];

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden bg-gradient-to-br from-stone-50 via-[#f5ede3] to-stone-100 text-stone-900 font-sans">
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="bg-orb w-[500px] h-[500px] bg-amber-600/20 -top-32 -left-32" />
        <div className="bg-orb w-[600px] h-[600px] bg-amber-800/15 top-1/3 -right-48" style={{ animationDelay: '-4s' }} />
        <div className="bg-orb w-[450px] h-[450px] bg-amber-500/20 bottom-10 left-1/4" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Floating Pill Navigation Header (SaaS Style) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 pointer-events-none">
        <div className="pointer-events-auto max-w-7xl mx-auto flex items-center justify-between bg-white/85 backdrop-blur-xl border border-amber-900/15 rounded-full px-6 py-2.5 shadow-lg shadow-amber-900/5">

          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-amber-900/25">
              M
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-amber-950 via-amber-900 to-amber-700 bg-clip-text text-transparent tracking-tight">
              Mockly <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/10 text-amber-900 border border-amber-900/15 ml-0.5">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <a href="#features" className="hover:text-amber-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-amber-900 transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-amber-900 transition-colors">Target Roles</a>
            <a href="#placement" className="hover:text-amber-900 transition-colors">Placement Hub</a>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/questions')}
                className="btn-primary rounded-full px-5 py-2 text-xs font-bold shadow-md shadow-amber-900/20 flex items-center gap-1.5"
              >
                Go to Dashboard
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-amber-900 transition-colors px-2 py-1"
                >
                  <svg className="w-4 h-4 text-stone-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary rounded-full px-5 py-2 text-xs font-bold shadow-md shadow-amber-900/20"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section — Full Viewport Fit with Top Spacing */}
      <section className="relative pt-28 md:pt-32 pb-8 px-4 md:px-8 max-w-7xl mx-auto z-10 min-h-screen flex items-center justify-center">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">

          {/* Left Column — Text, Pill Tag, Pill Actions & Micro-Stats */}
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-900/10 border border-amber-900/20 text-amber-900 text-xs font-bold shadow-sm">
              <span className="text-amber-700">✦</span> Next-Gen AI Interview Preparation
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-stone-900 leading-[1.12]">
              Master Placement Interviews with{' '}
              <span className="bg-gradient-to-r from-amber-950 via-amber-800 to-amber-700 bg-clip-text text-transparent">
                Real-Time AI Feedback
              </span>
            </h1>

            <p className="text-stone-600 text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Role-tailored technical questions, timed mock interviews, and instant Gemini AI evaluation.
            </p>

            {/* Pill Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => navigate(user ? '/questions' : '/register')}
                className="btn-primary rounded-full px-7 py-3 text-sm font-bold w-full sm:w-auto shadow-lg shadow-amber-900/25 flex items-center justify-center gap-2"
              >
                {user ? 'Start Practice' : 'Create Free Account'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <button
                onClick={() => navigate(user ? '/placement' : '/login')}
                className="px-6 py-3 rounded-full border border-amber-900/30 text-amber-950 text-sm font-bold bg-white/70 backdrop-blur-md hover:bg-white transition-all duration-200 w-full sm:w-auto text-center"
              >
                Placement Hub
              </button>
            </div>

            {/* Micro-Stats Footer Row */}
            <div className="pt-5 grid grid-cols-3 gap-3 border-t border-stone-200/80 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-900/10 border border-amber-900/15 flex items-center justify-center text-amber-900 text-base shadow-inner flex-shrink-0">
                  🎯
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-amber-950 leading-tight">500+</div>
                  <div className="text-[11px] text-stone-500 font-semibold">Questions</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-900/10 border border-amber-900/15 flex items-center justify-center text-amber-900 text-base shadow-inner flex-shrink-0">
                  ✨
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-amber-950 leading-tight">100%</div>
                  <div className="text-[11px] text-stone-500 font-semibold">AI Feedback</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-900/10 border border-amber-900/15 flex items-center justify-center text-amber-900 text-base shadow-inner flex-shrink-0">
                  👥
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-amber-950 leading-tight">Top Roles</div>
                  <div className="text-[11px] text-stone-500 font-semibold">SDE, DS, DA</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Vector Graphic Illustration & AI Scorecard Overlay (Reference Style) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">

            {/* Background Decorative Layered Shapes */}
            <div className="absolute -top-12 -left-12 w-72 h-72 bg-amber-400/25 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-1/4 -right-10 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-amber-800/15 rounded-full blur-3xl pointer-events-none" />

            {/* Illustration Graphic Outer Frame Container */}
            <div className="relative w-full max-w-lg p-2 sm:p-4">

              {/* Browser Window Frame Graphic */}
              <div className="glass-card rounded-3xl p-5 md:p-6 shadow-2xl border border-amber-900/20 bg-white/90 backdrop-blur-xl relative z-10">

                {/* Browser Controls Dots */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-200/80">
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-stone-400 font-mono ml-2">mockly.ai/practice/workspace</span>
                </div>

                {/* Candidate Workspace Graphic Illustration */}
                <div className="grid grid-cols-12 gap-4 items-center mb-4">
                  <div className="col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-900/5 border border-amber-900/10">
                    {/* Student Avatar Illustration Circle */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-800 to-amber-600 flex items-center justify-center text-2xl text-white shadow-md mb-2">
                      👩‍💻
                    </div>
                    <span className="text-xs font-bold text-stone-900">Aspirant Workspace</span>
                    <div className="flex gap-1 mt-1 text-amber-500 text-xs">★★★★★</div>
                  </div>

                  <div className="col-span-8 space-y-2">
                    <div className="h-3 bg-stone-200/80 rounded-full w-full" />
                    <div className="h-3 bg-stone-200/80 rounded-full w-4/5" />
                    <div className="h-3 bg-amber-900/15 rounded-full w-3/5" />
                    <div className="h-3 bg-stone-200/80 rounded-full w-2/5" />
                  </div>
                </div>

                {/* Question Active Code/Text Lines */}
                <div className="p-3.5 rounded-2xl bg-stone-100/90 border border-stone-200 text-xs font-mono text-stone-700 space-y-1">
                  <div className="text-amber-900 font-bold">Q: Explain Virtual DOM Reconciliation in React.</div>
                  <div className="text-stone-500 text-[11px] font-sans">"Virtual DOM compares lightweight node copies to update target DOM nodes efficiently."</div>
                </div>
              </div>

              {/* Floating Overlay Card: AI Feedback Scorecard (Exact Reference Style Overlay) */}
              <div className="absolute -top-6 -right-2 sm:-right-6 z-20 glass-card p-5 rounded-2xl shadow-2xl border border-amber-900/20 bg-white/95 backdrop-blur-xl w-60 sm:w-64 transform rotate-1 hover:rotate-0 transition-transform">
                <h4 className="text-xs font-black text-stone-900 mb-3 border-b border-stone-100 pb-2">
                  AI Feedback Score
                </h4>

                {/* SVG Score Ring Graphic */}
                <div className="flex items-center justify-center my-3 relative">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="#e7e5e4" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#10b981"
                      strokeWidth="6"
                      strokeDasharray="200"
                      strokeDashoffset="30"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-base font-black text-emerald-600">85%</span>
                </div>

                {/* Score Indicators Checklist */}
                <div className="space-y-2 text-xs font-bold text-stone-700 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span>Technical Accuracy</span>
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Keyword Match</span>
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Structure & Clarity</span>
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Circular Ecosystem Features Section (Reference Hub Layout) */}
      <section id="features" className="py-8 md:py-10 px-4 md:px-8 max-w-7xl mx-auto relative scroll-mt-14 z-10">
        <div className="text-center max-w-2xl mx-auto mb-4 space-y-1.5">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-900/10 text-amber-900 text-xs font-bold border border-amber-900/15">
            Platform Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            A Comprehensive Ecosystem
          </h2>
          <p className="text-stone-600 text-sm md:text-base font-medium">
            Connected suite of AI features working together for placement preparation.
          </p>
        </div>

        {/* Circular Ecosystem Radial Hub Container — Precise Orbital Ring Alignment */}
        <div className="relative max-w-xl mx-auto w-full aspect-square max-h-[380px] sm:max-h-[420px] flex items-center justify-center my-2">
          
          {/* Outer Ring Background Line (Radius = 40%) */}
          <div className="absolute inset-[10%] rounded-full border-2 border-dashed border-amber-900/20 pointer-events-none" />

          {/* Center Hub Node */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full glass-card bg-white/95 border-2 border-amber-900/20 shadow-2xl flex flex-col items-center justify-center text-center p-3 z-20 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-950 to-amber-800 text-white font-black text-lg flex items-center justify-center shadow-lg mb-1">
              {features[activeFeatureIndex].icon}
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
              {features[activeFeatureIndex].title}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/10 text-amber-900 border border-amber-900/15 mt-1">
              {features[activeFeatureIndex].badge}
            </span>
          </div>

          {/* Radial Orbital Nodes (6 Feature Badges Centered 100% ON the Circular Line) */}
          
          {/* Node 0: Top Center (0°) */}
          <div
            onClick={() => setActiveFeatureIndex(0)}
            onMouseEnter={() => setActiveFeatureIndex(0)}
            style={{ top: '10%', left: '50%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-300 flex flex-col items-center ${
              activeFeatureIndex === 0 ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div className={`w-11 h-11 rounded-full ${features[0].bgColor} text-white flex items-center justify-center text-lg shadow-md border-2 border-white`}>
              {features[0].icon}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-colors whitespace-nowrap ${
              activeFeatureIndex === 0 ? 'bg-amber-950 text-white shadow-md' : 'bg-white/90 text-stone-800 border border-stone-200 shadow-sm'
            }`}>
              {features[0].title}
            </span>
          </div>

          {/* Node 1: Top Right (60°) */}
          <div
            onClick={() => setActiveFeatureIndex(1)}
            onMouseEnter={() => setActiveFeatureIndex(1)}
            style={{ top: '30%', left: '84.64%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-300 flex flex-col items-center ${
              activeFeatureIndex === 1 ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div className={`w-11 h-11 rounded-full ${features[1].bgColor} text-white flex items-center justify-center text-lg shadow-md border-2 border-white`}>
              {features[1].icon}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-colors whitespace-nowrap ${
              activeFeatureIndex === 1 ? 'bg-amber-950 text-white shadow-md' : 'bg-white/90 text-stone-800 border border-stone-200 shadow-sm'
            }`}>
              {features[1].title}
            </span>
          </div>

          {/* Node 2: Bottom Right (120°) */}
          <div
            onClick={() => setActiveFeatureIndex(2)}
            onMouseEnter={() => setActiveFeatureIndex(2)}
            style={{ top: '70%', left: '84.64%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-300 flex flex-col items-center ${
              activeFeatureIndex === 2 ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div className={`w-11 h-11 rounded-full ${features[2].bgColor} text-white flex items-center justify-center text-lg shadow-md border-2 border-white`}>
              {features[2].icon}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-colors whitespace-nowrap ${
              activeFeatureIndex === 2 ? 'bg-amber-950 text-white shadow-md' : 'bg-white/90 text-stone-800 border border-stone-200 shadow-sm'
            }`}>
              {features[2].title}
            </span>
          </div>

          {/* Node 3: Bottom Center (180°) */}
          <div
            onClick={() => setActiveFeatureIndex(3)}
            onMouseEnter={() => setActiveFeatureIndex(3)}
            style={{ top: '90%', left: '50%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-300 flex flex-col items-center ${
              activeFeatureIndex === 3 ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div className={`w-11 h-11 rounded-full ${features[3].bgColor} text-white flex items-center justify-center text-lg shadow-md border-2 border-white`}>
              {features[3].icon}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-colors whitespace-nowrap ${
              activeFeatureIndex === 3 ? 'bg-amber-950 text-white shadow-md' : 'bg-white/90 text-stone-800 border border-stone-200 shadow-sm'
            }`}>
              {features[3].title}
            </span>
          </div>

          {/* Node 4: Bottom Left (240°) */}
          <div
            onClick={() => setActiveFeatureIndex(4)}
            onMouseEnter={() => setActiveFeatureIndex(4)}
            style={{ top: '70%', left: '15.36%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-300 flex flex-col items-center ${
              activeFeatureIndex === 4 ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div className={`w-11 h-11 rounded-full ${features[4].bgColor} text-white flex items-center justify-center text-lg shadow-md border-2 border-white`}>
              {features[4].icon}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-colors whitespace-nowrap ${
              activeFeatureIndex === 4 ? 'bg-amber-950 text-white shadow-md' : 'bg-white/90 text-stone-800 border border-stone-200 shadow-sm'
            }`}>
              {features[4].title}
            </span>
          </div>

          {/* Node 5: Top Left (300°) */}
          <div
            onClick={() => setActiveFeatureIndex(5)}
            onMouseEnter={() => setActiveFeatureIndex(5)}
            style={{ top: '30%', left: '15.36%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-300 flex flex-col items-center ${
              activeFeatureIndex === 5 ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div className={`w-11 h-11 rounded-full ${features[5].bgColor} text-white flex items-center justify-center text-lg shadow-md border-2 border-white`}>
              {features[5].icon}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-colors whitespace-nowrap ${
              activeFeatureIndex === 5 ? 'bg-amber-950 text-white shadow-md' : 'bg-white/90 text-stone-800 border border-stone-200 shadow-sm'
            }`}>
              {features[5].title}
            </span>
          </div>

        </div>
      </section>

      {/* How It Works Section — Connected Pipeline Diagram */}
      <section id="how-it-works" className="py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto relative scroll-mt-14 z-10">
        <div className="glass-card p-8 md:p-14 rounded-3xl bg-white/80 border border-amber-900/15 shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-900/10 text-amber-900 text-xs font-bold border border-amber-900/15">
              Platform Process Diagram
            </span>
            <h2 className="text-3xl font-extrabold text-stone-900">How Mockly AI Works</h2>
            <p className="text-stone-600 text-sm md:text-base font-medium">
              3-step guided flow to master technical placement drives.
            </p>
          </div>

          {/* Connected Flow Diagram Container */}
          <div className="relative">
            {/* Horizontal Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-12 right-12 h-1 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-600 -translate-y-1/2 z-0 rounded-full opacity-30" />

            <div className="grid md:grid-cols-3 gap-6 md:gap-10 relative z-10">

              {/* Step 1 Node */}
              <div className="glass-card p-6 rounded-2xl border border-amber-900/20 bg-white/95 shadow-md flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-amber-950 text-white text-xs font-bold shadow-sm">
                      Step 1
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-900/10 flex items-center justify-center text-xl shadow-inner">
                      🎯
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Select Profile & Topic</h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    Choose your specialization (SDE, DS, DA, DevOps) and select domain question sets.
                  </p>
                </div>
              </div>

              {/* Step 2 Node */}
              <div className="glass-card p-6 rounded-2xl border border-amber-900/20 bg-white/95 shadow-md flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-amber-800 text-white text-xs font-bold shadow-sm">
                      Step 2
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-900/10 flex items-center justify-center text-xl shadow-inner">
                      ✍️
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Practice & Submit</h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    Attempt timed mock interview sessions or practice individual questions with structured responses.
                  </p>
                </div>
              </div>

              {/* Step 3 Node */}
              <div className="glass-card p-6 rounded-2xl border border-amber-900/20 bg-white/95 shadow-md flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-amber-700 text-white text-xs font-bold shadow-sm">
                      Step 3
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-900/10 flex items-center justify-center text-xl shadow-inner">
                      ✨
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Instant AI Feedback</h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    Receive detailed Gemini AI scorecards with keyword accuracy, semantic similarity, and sample solutions.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Target Roles & Topics Showcase */}
      <section id="roles" className="py-10 md:py-14 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-14 z-10">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-900/10 text-amber-900 text-xs font-bold border border-amber-900/15">
            Role-Tailored Practice
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900">
            Tailored Questions for Industry Profiles
          </h2>
          <p className="text-stone-600 text-sm md:text-base font-medium">
            Choose your specialization and unlock interview questions curated by industry expectations.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Role selector tabs */}
          <div className="lg:col-span-4 space-y-3">
            {roles.map((role) => (
              <button
                key={role.title}
                onClick={() => setActiveRole(role.title)}
                className={`w-full text-left p-4 rounded-full border transition-all duration-200 flex items-center justify-between ${activeRole === role.title
                    ? 'bg-amber-950 text-white border-amber-950 shadow-md'
                    : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-white hover:border-amber-900/30'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{role.icon}</span>
                  <span className="font-bold text-sm">{role.title}</span>
                </div>
                <svg className={`w-4 h-4 ${activeRole === role.title ? 'text-amber-200' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Active Role Card Details */}
          <div className="lg:col-span-8 glass-card p-6 md:p-8 bg-white/85 border border-amber-900/15 rounded-3xl flex flex-col justify-between">
            {(() => {
              const current = roles.find(r => r.title === activeRole) || roles[0];
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl p-2.5 rounded-2xl bg-amber-900/10 border border-amber-900/15">{current.icon}</span>
                    <div>
                      <h3 className="text-2xl font-extrabold text-stone-900">{current.title}</h3>
                      <p className="text-xs text-stone-500 font-bold">Curated Interview Modules</p>
                    </div>
                  </div>

                  <p className="text-stone-600 text-sm leading-relaxed font-medium">{current.desc}</p>

                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">Key Focus Topics</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {current.topics.map((t, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-100/90 border border-stone-200 text-stone-800 text-xs font-bold">
                          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex justify-end">
                    <button
                      onClick={() => navigate(user ? '/questions' : '/register')}
                      className="btn-primary rounded-full px-6 py-3 text-sm font-bold flex items-center gap-2 shadow-md"
                    >
                      Practice {current.title} Questions
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Student Testimonials Section — Circular Infinite Loop Marquee */}
      <section id="testimonials" className="py-14 md:py-20 max-w-7xl mx-auto scroll-mt-14 z-10 overflow-hidden relative">
        <div className="text-center max-w-3xl mx-auto mb-12 px-4 space-y-2">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-900/10 text-amber-900 text-xs font-bold border border-amber-900/15">
            Student Stories & Impact
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900">
            Trusted by Aspirants
          </h2>
          <p className="text-stone-600 text-sm md:text-base font-medium">
            Success stories from aspirants who cleared interview drives.
          </p>
        </div>

        {/* Circular Infinite Marquee Stream Container */}
        <div className="relative w-full overflow-hidden py-4">
          
          {/* Gradient Blur Mask Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent z-20 pointer-events-none" />

          {/* Marquee Track */}
          <div className="flex gap-6 w-max animate-infiniteScroll hover:[animation-play-state:paused] cursor-pointer py-2">
            {[...testimonials, ...testimonials].map((t, idx) => (
              <div
                key={idx}
                className="w-80 sm:w-96 flex-shrink-0 glass-card p-6 rounded-3xl border border-amber-900/15 bg-white/90 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:border-amber-900/30 transition-all transform hover:-translate-y-1"
              >
                <div>
                  {/* Rating Stars & Verification Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(t.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      Verified Placement
                    </span>
                  </div>

                  <p className="text-stone-700 text-xs md:text-sm leading-relaxed font-medium italic mb-6">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200/80 flex items-center gap-3">
                  <div className="relative">
                    <span className="text-2xl p-2.5 rounded-2xl bg-gradient-to-br from-amber-900/15 to-amber-700/10 border border-amber-900/15 inline-block shadow-inner">
                      {t.avatar}
                    </span>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                      ✓
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-stone-900">{t.name}</h4>
                    <p className="text-xs text-amber-900 font-semibold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section id="placement" className="py-14 md:py-20 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-14 z-10">
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-950 via-amber-900 to-amber-800 text-white p-8 md:p-14 overflow-hidden shadow-2xl">
          {/* Subtle glow orb inside CTA */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-600/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-amber-200 text-xs font-bold">
              Ready For Placement Season?
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Start Practicing Today & Clear Placement Drives.
            </h2>

            <p className="text-amber-100 text-base md:text-lg leading-relaxed font-medium">
              Join students using Mockly AI to practice role-specific technical questions, evaluate answers with Gemini, and clear placement gating tests.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate(user ? '/questions' : '/register')}
                className="px-8 py-4 rounded-full bg-white text-amber-950 font-bold text-base hover:bg-amber-100 transition-all duration-200 shadow-lg"
              >
                {user ? 'Go to Placement Hub' : 'Get Started Now — Free'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-300/60 bg-white/50 backdrop-blur-md py-12 px-4 md:px-8 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center text-white font-bold text-sm shadow">
              M
            </div>
            <span className="font-bold text-stone-900 text-base">Mockly AI</span>
            <span className="text-xs text-stone-500 font-medium">| Intelligent Placement & Mock Interview Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-stone-600">
            <span>Powered by Gemini</span>
            <span>•</span>
            <a href="#features" className="hover:text-amber-900">Features</a>
            <a href="#roles" className="hover:text-amber-900">Roles</a>
            <a href="#testimonials" className="hover:text-amber-900">Testimonials</a>
            <Link to="/login" className="hover:text-amber-900">Login</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center md:text-left text-xs text-stone-400 mt-6 pt-6 border-t border-stone-200/60">
          © {new Date().getFullYear()} Mockly AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
