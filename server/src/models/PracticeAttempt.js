import mongoose from 'mongoose';

const practiceAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    userAnswer: {
      type: String,
      required: true,
    },
    keywordScore: {
      type: Number,
      required: true,
    },
    embeddingScore: {
      type: Number,
      required: true,
    },
    llmScore: {
      type: Number,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
    },
    matchedKeywords: {
      type: [String],
      default: [],
    },
    missingKeywords: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    missingPoints: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    latency: {
      embedding: {
        type: Number,
        required: true,
      },
      llm: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const PracticeAttempt = mongoose.model('PracticeAttempt', practiceAttemptSchema);

export default PracticeAttempt;
