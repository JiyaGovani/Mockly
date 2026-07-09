import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  userAnswer: {
    type: String,
    default: '',
  },
  // Evaluation results (populated after session submit)
  keywordScore: { type: Number, default: null },
  embeddingScore: { type: Number, default: null },
  llmScore: { type: Number, default: null },
  overallScore: { type: Number, default: null },
  matchedKeywords: { type: [String], default: [] },
  missingKeywords: { type: [String], default: [] },
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  missingPoints: { type: [String], default: [] },
  suggestions: { type: [String], default: [] },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Target role is required'],
      uppercase: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    answers: [answerSchema],
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    overallScore: {
      type: Number,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
  },
  { timestamps: true }
);

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
