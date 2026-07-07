/**
 * Seed script — populates MongoDB with roles and sample questions.
 *
 * Usage:  node src/scripts/seed.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/Role.js';
import Question from '../models/Question.js';

dotenv.config();

const ROLES = [
  {
    name: 'SDE',
    displayName: 'Software Development Engineer',
    description:
      'Builds and maintains software systems — data structures, algorithms, system design, and coding.',
  },
  {
    name: 'DATA SCIENTIST',
    displayName: 'Data Scientist',
    description:
      'Extracts insights from data using statistics, machine learning, and analytical reasoning.',
  },
  {
    name: 'PM',
    displayName: 'Product Manager',
    description:
      'Drives product strategy, prioritization, and cross-functional execution.',
  },
  {
    name: 'DATA ANALYST',
    displayName: 'Data Analyst',
    description:
      'Analyzes structured data to inform business decisions using SQL, Excel, and visualization tools.',
  },
];

const QUESTIONS = [
  // ───── SDE (5) ─────
  {
    text: 'Explain the difference between a stack and a queue. When would you use each?',
    role: 'SDE',
    type: 'technical',
    difficulty: 'easy',
    expectedAnswer:
      'A stack is a LIFO (Last In, First Out) data structure — the last element added is the first removed. A queue is FIFO (First In, First Out) — the first element added is the first removed. Use a stack for undo operations, recursion, and expression evaluation. Use a queue for BFS traversal, task scheduling, and buffering.',
    keyPoints: ['LIFO', 'FIFO', 'stack', 'queue', 'undo', 'BFS', 'recursion', 'scheduling'],
  },
  {
    text: 'What is the time complexity of searching in a balanced binary search tree vs an unsorted array?',
    role: 'SDE',
    type: 'technical',
    difficulty: 'medium',
    expectedAnswer:
      'Searching in a balanced BST is O(log n) because at each step you eliminate half the remaining nodes. Searching in an unsorted array is O(n) because you may need to check every element. A balanced BST maintains O(log n) height by ensuring left and right subtree heights differ by at most 1.',
    keyPoints: ['O(log n)', 'O(n)', 'balanced BST', 'binary search', 'height', 'unsorted'],
  },
  {
    text: 'Design a URL shortening service like bit.ly. Describe the key components and trade-offs.',
    role: 'SDE',
    type: 'technical',
    difficulty: 'hard',
    expectedAnswer:
      'Key components: 1) A hash/encoding function (Base62) to convert long URLs to short codes. 2) A database mapping short codes to original URLs. 3) A redirect service that looks up the code and returns a 301/302 redirect. Trade-offs include hash collisions (use counter-based IDs or check-and-retry), read-heavy workload (cache popular URLs in Redis), and analytics (log redirects asynchronously).',
    keyPoints: ['Base62', 'hash', 'database', 'redirect', '301', 'cache', 'Redis', 'collision', 'analytics'],
  },
  {
    text: 'Tell me about a time you had a disagreement with a teammate about a technical approach. How did you resolve it?',
    role: 'SDE',
    type: 'behavioral',
    difficulty: 'medium',
    expectedAnswer:
      'A strong answer describes a specific situation, the differing viewpoints, active listening, data-driven comparison of approaches, reaching consensus, and the positive outcome. It shows collaboration, empathy, and willingness to compromise when evidence supports the other approach.',
    keyPoints: ['disagreement', 'collaboration', 'data-driven', 'compromise', 'active listening', 'outcome'],
  },
  {
    text: 'Which data structure would you use to implement an LRU cache?\n\nA) Array\nB) HashMap + Doubly Linked List\nC) Binary Search Tree\nD) Stack',
    role: 'SDE',
    type: 'aptitude',
    difficulty: 'medium',
    options: [
      'Array',
      'HashMap + Doubly Linked List',
      'Binary Search Tree',
      'Stack',
    ],
    correctOption: 1,
    expectedAnswer: 'HashMap + Doubly Linked List provides O(1) lookup via the map and O(1) eviction/insertion via the doubly linked list.',
    keyPoints: ['HashMap', 'Doubly Linked List', 'O(1)', 'eviction'],
  },

  // ───── DATA SCIENTIST (5) ─────
  {
    text: 'Explain the bias-variance trade-off in machine learning.',
    role: 'DATA SCIENTIST',
    type: 'technical',
    difficulty: 'medium',
    expectedAnswer:
      'Bias is error from overly simplistic model assumptions (underfitting). Variance is error from sensitivity to small fluctuations in training data (overfitting). The trade-off means reducing bias increases variance and vice versa. The goal is to find a model complexity that minimizes total error. Techniques like cross-validation, regularization, and ensemble methods help balance this.',
    keyPoints: ['bias', 'variance', 'underfitting', 'overfitting', 'cross-validation', 'regularization', 'ensemble'],
  },
  {
    text: 'What is the difference between supervised and unsupervised learning? Give one example of each.',
    role: 'DATA SCIENTIST',
    type: 'technical',
    difficulty: 'easy',
    expectedAnswer:
      'Supervised learning uses labeled data — the model learns a mapping from inputs to known outputs. Example: spam email classification. Unsupervised learning works with unlabeled data — the model finds hidden patterns or groupings. Example: customer segmentation using k-means clustering.',
    keyPoints: ['labeled', 'unlabeled', 'supervised', 'unsupervised', 'classification', 'clustering', 'k-means'],
  },
  {
    text: 'How would you handle a highly imbalanced dataset where the minority class is only 2% of the data?',
    role: 'DATA SCIENTIST',
    type: 'technical',
    difficulty: 'hard',
    expectedAnswer:
      'Strategies include: 1) Resampling — oversample minority (SMOTE) or undersample majority. 2) Use appropriate metrics — precision, recall, F1, AUC-ROC instead of accuracy. 3) Cost-sensitive learning — assign higher misclassification costs to the minority class. 4) Ensemble methods — balanced random forests. 5) Collect more minority samples if possible.',
    keyPoints: ['SMOTE', 'oversampling', 'undersampling', 'F1', 'AUC-ROC', 'cost-sensitive', 'imbalanced'],
  },
  {
    text: 'Describe a project where your analysis led to a meaningful business decision.',
    role: 'DATA SCIENTIST',
    type: 'behavioral',
    difficulty: 'medium',
    expectedAnswer:
      'A strong answer includes the business context, the data used, the analytical approach, the key insight discovered, how it was communicated to stakeholders, and the measurable business impact (revenue, cost savings, efficiency gains).',
    keyPoints: ['business impact', 'data analysis', 'stakeholders', 'insight', 'measurable outcome'],
  },
  {
    text: 'Which metric is most appropriate for evaluating a model on an imbalanced binary classification task?\n\nA) Accuracy\nB) F1 Score\nC) Mean Squared Error\nD) R-squared',
    role: 'DATA SCIENTIST',
    type: 'aptitude',
    difficulty: 'easy',
    options: ['Accuracy', 'F1 Score', 'Mean Squared Error', 'R-squared'],
    correctOption: 1,
    expectedAnswer: 'F1 Score balances precision and recall, making it suitable for imbalanced datasets where accuracy can be misleading.',
    keyPoints: ['F1', 'precision', 'recall', 'imbalanced', 'accuracy misleading'],
  },

  // ───── PM (5) ─────
  {
    text: 'How would you prioritize features for a new product with limited engineering resources?',
    role: 'PM',
    type: 'technical',
    difficulty: 'medium',
    expectedAnswer:
      'Use a prioritization framework like RICE (Reach, Impact, Confidence, Effort) or MoSCoW (Must, Should, Could, Won\'t). Start by identifying the core user problem, map features to user value and business goals, estimate engineering effort, and rank by value-to-effort ratio. Validate assumptions with user research. Communicate trade-offs transparently with stakeholders.',
    keyPoints: ['RICE', 'MoSCoW', 'prioritization', 'user value', 'effort', 'stakeholders', 'trade-offs'],
  },
  {
    text: 'What metrics would you track to measure the success of a social media feed feature?',
    role: 'PM',
    type: 'technical',
    difficulty: 'easy',
    expectedAnswer:
      'Key metrics: DAU/MAU (engagement), time spent in feed, scroll depth, click-through rate on posts, like/comment/share rate (interaction), content creation rate, retention (D1/D7/D30), and negative signals like hide/report rates. Segment by user cohort and content type.',
    keyPoints: ['DAU', 'MAU', 'engagement', 'retention', 'click-through', 'scroll depth', 'cohort'],
  },
  {
    text: 'Your engineering team says a feature will take 3 months, but your VP wants it in 6 weeks. How do you handle this?',
    role: 'PM',
    type: 'behavioral',
    difficulty: 'hard',
    expectedAnswer:
      'Break the feature into an MVP scope that can ship in 6 weeks and a follow-up iteration. Present the VP with options: reduced scope in 6 weeks vs full scope in 3 months. Use data to show which features drive the most value. Negotiate by finding the smallest viable version that addresses the VP\'s underlying goal. Protect team from burnout.',
    keyPoints: ['MVP', 'scope reduction', 'negotiation', 'stakeholder management', 'burnout', 'iteration'],
  },
  {
    text: 'Explain the concept of product-market fit and how you would measure it.',
    role: 'PM',
    type: 'hr',
    difficulty: 'medium',
    expectedAnswer:
      'Product-market fit means your product satisfies a strong market demand. Measure via: Sean Ellis survey ("How would you feel if you could no longer use this product?" — 40%+ "very disappointed" indicates PMF), retention curves (flattening = PMF), NPS, organic growth rate, and engagement depth.',
    keyPoints: ['product-market fit', 'Sean Ellis', 'retention', 'NPS', 'organic growth', '40%'],
  },
  {
    text: 'What does "MVP" stand for in product management?\n\nA) Most Valuable Product\nB) Minimum Viable Product\nC) Maximum Value Proposition\nD) Minimum Validated Prototype',
    role: 'PM',
    type: 'aptitude',
    difficulty: 'easy',
    options: [
      'Most Valuable Product',
      'Minimum Viable Product',
      'Maximum Value Proposition',
      'Minimum Validated Prototype',
    ],
    correctOption: 1,
    expectedAnswer: 'MVP stands for Minimum Viable Product — the smallest version of a product that delivers enough value to early adopters and validates learning.',
    keyPoints: ['Minimum Viable Product', 'early adopters', 'validation'],
  },

  // ───── DATA ANALYST (5) ─────
  {
    text: 'What is the difference between INNER JOIN and LEFT JOIN in SQL? Give an example use case for each.',
    role: 'DATA ANALYST',
    type: 'technical',
    difficulty: 'easy',
    expectedAnswer:
      'INNER JOIN returns only rows with matching values in both tables. LEFT JOIN returns all rows from the left table and matched rows from the right (NULL for non-matches). Use INNER JOIN when you only want records with relationships (e.g., orders with customers). Use LEFT JOIN when you want all records from one table regardless of matches (e.g., all customers including those with zero orders).',
    keyPoints: ['INNER JOIN', 'LEFT JOIN', 'matching rows', 'NULL', 'all rows', 'left table'],
  },
  {
    text: 'How would you investigate a sudden 20% drop in daily active users for an e-commerce platform?',
    role: 'DATA ANALYST',
    type: 'technical',
    difficulty: 'hard',
    expectedAnswer:
      'Systematic investigation: 1) Verify data pipeline integrity — is it a tracking bug? 2) Segment by platform, geography, user type to isolate the drop. 3) Check for external factors — holidays, competitor launches, news events. 4) Check for internal changes — deployments, pricing changes, UI updates. 5) Analyze funnel — where are users dropping off? 6) Compare cohorts — new vs returning users.',
    keyPoints: ['data pipeline', 'segmentation', 'external factors', 'deployments', 'funnel analysis', 'cohorts'],
  },
  {
    text: 'Explain what a pivot table is and when you would use one.',
    role: 'DATA ANALYST',
    type: 'technical',
    difficulty: 'medium',
    expectedAnswer:
      'A pivot table summarizes and reorganizes data by grouping rows into categories and applying aggregate functions (sum, count, average) to values. Use it to quickly summarize large datasets, compare categories, identify trends, and create cross-tabulations. Common in Excel and supported in SQL via PIVOT or CASE statements.',
    keyPoints: ['pivot table', 'aggregate', 'summarize', 'grouping', 'cross-tabulation', 'Excel', 'CASE'],
  },
  {
    text: 'Tell me about a time when your data analysis contradicted what stakeholders expected. How did you present it?',
    role: 'DATA ANALYST',
    type: 'behavioral',
    difficulty: 'medium',
    expectedAnswer:
      'A strong answer describes validating the data first to ensure accuracy, then presenting findings with clear visualizations, acknowledging the surprise, explaining the methodology transparently, and offering actionable next steps. Shows integrity and communication skills.',
    keyPoints: ['validate data', 'visualization', 'methodology', 'stakeholder communication', 'integrity'],
  },
  {
    text: 'Which SQL clause is used to filter groups of rows after aggregation?\n\nA) WHERE\nB) GROUP BY\nC) HAVING\nD) ORDER BY',
    role: 'DATA ANALYST',
    type: 'aptitude',
    difficulty: 'easy',
    options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'],
    correctOption: 2,
    expectedAnswer: 'HAVING filters groups after GROUP BY aggregation, while WHERE filters individual rows before aggregation.',
    keyPoints: ['HAVING', 'GROUP BY', 'aggregation', 'filter groups'],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mockly';

  console.log(`\n🌱 Connecting to MongoDB at ${uri}…`);
  await mongoose.connect(uri);

  // Clear existing data
  console.log('🗑  Clearing existing roles and questions…');
  await Role.deleteMany({});
  await Question.deleteMany({});

  // Seed roles
  const roles = await Role.insertMany(ROLES);
  console.log(`✅ Seeded ${roles.length} roles`);

  // Seed questions
  const questions = await Question.insertMany(QUESTIONS);
  console.log(`✅ Seeded ${questions.length} questions`);

  // Summary
  console.log('\n📊 Breakdown:');
  for (const role of ROLES) {
    const count = QUESTIONS.filter((q) => q.role === role.name).length;
    console.log(`   ${role.displayName}: ${count} questions`);
  }

  console.log('\n✨ Seeding complete!\n');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
