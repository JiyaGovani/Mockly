import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import User from '../models/User.js';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mockly';

async function seedMockAttempts(user, questions) {
  console.log('Seeding mock practice attempts...');
  
  // Clean up any previous test attempts for this user
  await PracticeAttempt.deleteMany({ user: user._id });

  // Define some attempts across different types and dates
  const now = new Date();
  const daysAgo = (num) => new Date(now.getTime() - num * 24 * 60 * 60 * 1000);

  const mockData = [
    // Technical attempts
    {
      questionType: 'technical',
      overallScore: 85,
      createdAt: daysAgo(2),
    },
    {
      questionType: 'technical',
      overallScore: 92,
      createdAt: daysAgo(1),
    },
    // Behavioral attempts
    {
      questionType: 'behavioral',
      overallScore: 70,
      createdAt: daysAgo(5),
    },
    {
      questionType: 'behavioral',
      overallScore: 78,
      createdAt: daysAgo(3),
    },
    // HR attempts (only 1 attempt)
    {
      questionType: 'hr',
      overallScore: 60,
      createdAt: daysAgo(8), // > 7 days ago
    },
    // Aptitude attempts: unattempted (0 attempts)
  ];

  for (const item of mockData) {
    // Find a question of this type
    const q = questions.find(question => question.type === item.questionType);
    if (!q) continue;

    const attempt = new PracticeAttempt({
      user: user._id,
      question: q._id,
      userAnswer: 'Mock answer explanation for testing dashboard charts.',
      keywordScore: item.overallScore - 5,
      embeddingScore: item.overallScore + 5,
      llmScore: item.overallScore,
      overallScore: item.overallScore,
      latency: { embedding: 100, llm: 200, total: 300 },
    });

    await attempt.save();
    
    // Force set the createdAt date to test date filters
    attempt.createdAt = item.createdAt;
    await attempt.save();
  }

  console.log('Mock attempts seeded successfully.\n');
}

async function testStats(userId) {
  console.log('=======================================');
  console.log('Testing Stats & Charts Aggregation');
  console.log('=======================================');

  const ranges = ['7days', '30days', 'all'];

  for (const range of ranges) {
    console.log(`\nRange: ${range.toUpperCase()}`);

    let dateLimit = new Date(0); // Default to all-time (epoch 0)
    const now = new Date();
    if (range === '7days') {
      dateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30days') {
      dateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 1. Basic Stats (Total questions practiced, Avg Score)
    const attempts = await PracticeAttempt.find({
      user: userId,
      createdAt: { $gte: dateLimit }
    });

    const totalQuestionsPracticed = new Set(attempts.map(a => a.question.toString())).size;
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.overallScore, 0) / attempts.length)
      : 0;

    console.log(`- Total Questions: ${totalQuestionsPracticed}`);
    console.log(`- Average Score:   ${avgScore}%`);

    // 2. Radar Chart (Average score per topic/type)
    const rawMastery = await PracticeAttempt.aggregate([
      { $match: { user: userId, createdAt: { $gte: dateLimit } } },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'qDetails'
        }
      },
      { $unwind: '$qDetails' },
      {
        $group: {
          _id: '$qDetails.type',
          avgScore: { $avg: '$overallScore' }
        }
      }
    ]);

    const radarChartData = ['technical', 'behavioral', 'hr', 'aptitude'].map(type => {
      const match = rawMastery.find(m => m._id === type);
      return {
        subject: type.charAt(0).toUpperCase() + type.slice(1),
        A: match ? Math.round(match.avgScore) : 0,
        fullMark: 100
      };
    });

    console.log('- Radar Chart Data:', JSON.stringify(radarChartData));

    // 3. Line Chart (Sequential scores per topic)
    const chronologicalAttempts = await PracticeAttempt.aggregate([
      { $match: { user: userId, createdAt: { $gte: dateLimit } } },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'qDetails'
        }
      },
      { $unwind: '$qDetails' },
      { $sort: { createdAt: 1 } }
    ]);

    // Build index arrays to track chronological count per type
    const typeIndexes = { technical: 0, behavioral: 0, hr: 0, aptitude: 0 };
    const attemptsData = [];

    for (const attempt of chronologicalAttempts) {
      const type = attempt.qDetails.type;
      typeIndexes[type]++;
      
      const attemptNumber = typeIndexes[type];
      
      // Look for existing object or create new one
      let dataPoint = attemptsData.find(d => d.attemptIndex === attemptNumber);
      if (!dataPoint) {
        dataPoint = {
          attemptIndex: attemptNumber,
          technical: null,
          behavioral: null,
          hr: null,
          aptitude: null
        };
        attemptsData.push(dataPoint);
      }
      
      dataPoint[type] = attempt.overallScore;
    }

    // Sort chronologically by attemptIndex
    attemptsData.sort((a, b) => a.attemptIndex - b.attemptIndex);

    console.log('- Line Chart Data:', JSON.stringify(attemptsData));
  }
}

async function testRecommendations(user) {
  console.log('\n=======================================');
  console.log('Testing Recommendations Engine');
  console.log('=======================================');

  const allTypes = ['technical', 'behavioral', 'hr', 'aptitude'];

  // 1. Gather all attempts for user and find average scores per topic
  const attempts = await PracticeAttempt.find({ user: user._id }).populate('question');
  
  const topicStats = allTypes.map(type => {
    const typeAttempts = attempts.filter(a => a.question && a.question.type === type);
    const count = typeAttempts.length;
    const avgScore = count > 0
      ? typeAttempts.reduce((sum, a) => sum + a.overallScore, 0) / count
      : 0;

    return { type, count, avgScore };
  });

  // 2. Rank topics: unattempted first, then lowest average score
  topicStats.sort((a, b) => {
    if (a.count === 0 && b.count > 0) return -1;
    if (b.count === 0 && a.count > 0) return 1;
    return a.avgScore - b.avgScore;
  });

  console.log('Ranked Topics (Weakest to Strongest):');
  console.log(topicStats.map((t, idx) => `${idx + 1}. ${t.type.toUpperCase()} (attempts: ${t.count}, avgScore: ${Math.round(t.avgScore)}%)`).join('\n'));

  // 3. Recommend 1 unattempted question per top 3 weakest topics
  const weakestTopics = topicStats.slice(0, 3).map(t => t.type);
  const recommendedQuestions = [];

  for (const topic of weakestTopics) {
    // Find all active questions for target SDE role and this topic
    const questions = await Question.find({
      role: 'SDE',
      type: topic,
      isActive: true
    });

    const attemptedQuestionIds = attempts
      .filter(a => a.question && a.question.type === topic)
      .map(a => a.question._id.toString());

    // Find unattempted question
    let suggested = questions.find(q => !attemptedQuestionIds.includes(q._id.toString()));

    if (!suggested && questions.length > 0) {
      // Fallback: suggest lowest scored attempted question
      const typeAttempts = attempts.filter(a => a.question && a.question.type === topic);
      typeAttempts.sort((a, b) => a.overallScore - b.overallScore);
      suggested = questions.find(q => q._id.toString() === typeAttempts[0].question._id.toString());
    }

    if (suggested) {
      recommendedQuestions.push(suggested);
    }
  }

  console.log('\nRecommended Questions:');
  recommendedQuestions.forEach((q, idx) => {
    console.log(`${idx + 1}. [${q.type.toUpperCase()}] "${q.text.substring(0, 60)}..." (ID: ${q._id})`);
  });
}

async function run() {
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);

  // 1. Fetch user or create mock dashboard user
  let user = await User.findOne({ email: 'dashboard-test-user@example.com' });
  if (!user) {
    console.log('Creating mock user dashboard-test-user@example.com...');
    user = new User({
      name: 'Dashboard Test User',
      email: 'dashboard-test-user@example.com',
      password: 'Password123',
      role: 'student',
    });
    await user.save();
  }

  // 2. Fetch seeded questions
  const questions = await Question.find({ isActive: true });
  if (questions.length === 0) {
    console.error('No questions found in database. Please run seed script first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // 3. Seed mock practice attempts
  await seedMockAttempts(user, questions);

  const args = process.argv.slice(2);
  if (args.includes('--stats') || args.length === 0) {
    await testStats(user._id);
  }
  if (args.includes('--recommendations') || args.length === 0) {
    await testRecommendations(user);
  }

  await mongoose.disconnect();
  console.log('\nVerification completed.');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
