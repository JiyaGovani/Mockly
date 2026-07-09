# Phase 3: Progress Dashboard - Research

This document outlines the technical research, data aggregation pipelines, library selections, and recommendation heuristics for building the student progress dashboard and recommendation engine.

---

## Chart Visualization via Recharts

We will use `recharts`, a composable charting library built on React components.

### 1. Installation
```bash
npm install recharts --workspace client
```

### 2. Line Chart: Chronological Score Progression (D-01)
To plot progress per topic sequentially, the data must group attempts by topic and track their sequential index.
- **Data Structure:**
  ```json
  [
    { "attemptIndex": 1, "technical": 65, "behavioral": 70, "hr": 50, "aptitude": 80 },
    { "attemptIndex": 2, "technical": 80, "behavioral": null, "hr": 60, "aptitude": 85 },
    { "attemptIndex": 3, "technical": 91, "behavioral": 82, "hr": null, "aptitude": null }
  ]
  ```
- **Component Layout:**
  ```jsx
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={lineData}>
      <XAxis dataKey="attemptIndex" label={{ value: 'Attempt Number', position: 'insideBottom', offset: -5 }} />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="technical" stroke="#3b82f6" activeDot={{ r: 8 }} connectNulls />
      <Line type="monotone" dataKey="behavioral" stroke="#10b981" connectNulls />
      <Line type="monotone" dataKey="hr" stroke="#f59e0b" connectNulls />
      <Line type="monotone" dataKey="aptitude" stroke="#8b5cf6" connectNulls />
    </LineChart>
  </ResponsiveContainer>
  ```

### 3. Radar Chart: Topic Mastery (D-02)
Represents average overall score across all four question types.
- **Data Structure:**
  ```json
  [
    { "subject": "Technical", "A": 85, "fullMark": 100 },
    { "subject": "Behavioral", "A": 75, "fullMark": 100 },
    { "subject": "HR", "A": 60, "fullMark": 100 },
    { "subject": "Aptitude", "A": 90, "fullMark": 100 }
  ]
  ```
- **Component Layout:**
  ```jsx
  <ResponsiveContainer width="100%" height={300}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis angle={30} domain={[0, 100]} />
      <Radar name="User Mastery" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
    </RadarChart>
  </ResponsiveContainer>
  ```

---

## Backend Data Aggregation APIs

We will expose two routes under `/api/dashboard`:

### 1. Stats and Charts Aggregation (`GET /api/dashboard/stats`)
- **Query Parameters:** `?range=7days|30days|all`
- **Aggregation Pipeline:**
  1. Filter attempts matching user ID and date threshold (based on `range` parameter).
  2. Compute **Total Questions Practiced** (distinct `question` count).
  3. Compute **Average Score** (mean of `overallScore`).
  4. Aggregate attempts chronologically to construct `lineChartData` and `radarChartData`.

#### MongoDB Query Example for Topic Mastery:
```javascript
const stats = await PracticeAttempt.aggregate([
  { $match: { user: userId, createdAt: { $gte: dateLimit } } },
  {
    $lookup: {
      from: 'questions',
      localField: 'question',
      foreignField: '_id',
      as: 'questionDetails'
    }
  },
  { $unwind: '$questionDetails' },
  {
    $group: {
      _id: '$questionDetails.type',
      avgScore: { $avg: '$overallScore' }
    }
  }
]);
```

---

## Question Recommendation Heuristics (D-05, D-06)

To suggest 3 questions from the user's weakest topics:
1. **Find all topics:** Identify the standard question types: `['technical', 'behavioral', 'hr', 'aptitude']`.
2. **Collect user history:** Fetch all attempts by the user, lookup the question type, and calculate:
   - Topic status: `attempted` vs. `unattempted`
   - If attempted, calculate the `averageScore` for that topic.
3. **Rank Topics (Weakest first):**
   - First priority: `unattempted` topics.
   - Second priority: topics with the lowest `averageScore`.
4. **Distribute Suggestions:** Pick the top 3 weakest topics from the ranked list.
5. **Select Questions:** For each of the top 3 weakest topics:
   - Find all questions of that `type` matching the user's current SDE/DS/PM `role`.
   - Query for questions the user has **never attempted**.
   - If all questions in that topic have been attempted, fallback to recommending the question where the user received their **lowest score**.
   - Select exactly 1 question per topic, returning 3 suggestions in total.

---

## Validation Architecture

To verify the dashboard and recommendations, we must:
1. Add mock `PracticeAttempt` records for a test user across different question types and dates.
2. Verify that `GET /api/dashboard/stats` correctly filters by `range` and computes scores.
3. Verify that `GET /api/dashboard/recommendations` prioritizes unattempted topics, filters by user role, and correctly recommends exactly 3 unique questions.
