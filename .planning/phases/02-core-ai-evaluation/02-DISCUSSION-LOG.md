# Phase 2: Core AI Evaluation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 2-Core AI Evaluation
**Areas discussed:** Ollama Configuration, Embedding model and caching, Keyword matching mechanics, Practice UI loading states

---

## Ollama Configuration

Deciding on URL, timeouts, and LLM model for local evaluation.

**Options considered:**
- Option A: URL `http://localhost:11434`, Timeout `30s`, Model `llama3` (All configurable via server `.env`) [✓ Selected]
- Option B: URL `http://localhost:11434`, Timeout `60s` (Safer if local PC is slow), Model `llama3`

---

## Embedding Model & Caching

Choosing vector embedding model and deciding if expected answers' embeddings are cached.

**Options considered:**
- Option A: Embed model `nomic-embed-text` (fast & lightweight), Caching expected answer's embeddings directly in Question database schema. [✓ Selected]
- Option B: Embed model `llama3` (same as LLM), Caching none (dynamic calculation on each request).

---

## Keyword Matching Mechanics

Deciding on keyPoint matching algorithm.

**Options considered:**
- Option A: Simple case-insensitive matching: User answer has keyword as a substring.
- Option B: Stemming & NLP: `natural` library to match verb forms, plural/singular variations. [✓ Selected]

---

## Practice UI Loading States

Designing the loading interface during local LLM latency.

**Options considered:**
- Option A: Polished loading card with skeleton loaders, processing steps, and dynamic mock interview tips. [✓ Selected]
- Option B: Simple blocking overlay with dim background and center loading spinner.
