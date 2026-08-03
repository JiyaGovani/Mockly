import mongoose from 'mongoose';

/**
 * Tracks a user's progress through the 3-Round Placement Interview flow.
 * Rounds: Aptitude (MCQ) → Technical (hybrid scored) → HR (LLM-heavy)
 * Each round allows up to 3 attempts before locking.
 */

const roundResultSchema = new mongoose.Schema(
  {
    attemptsCount: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    score: { type: Number, default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const aptitudeAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: Number, default: null }, // 0-3 index
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Per-trial audit log — records every individual submission attempt
 * within a round (up to MAX_ATTEMPTS = 3).
 */
const trialSchema = new mongoose.Schema(
  {
    trialNumber: { type: Number, required: true }, // 1, 2, or 3
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      default: null,
    },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const threeRoundAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      uppercase: true,
    },
    /**
     * Overall status of the placement attempt.
     * - in_progress: user is actively going through rounds
     * - passed: all 3 rounds cleared
     * - failed: locked out of a round after 3 failed attempts
     */
    status: {
      type: String,
      enum: ['in_progress', 'passed', 'failed'],
      default: 'in_progress',
    },
    rounds: {
      aptitude: {
        ...roundResultSchema.obj,
        answers: { type: [aptitudeAnswerSchema], default: [] },
        questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
        locked: { type: Boolean, default: false },
        trials: { type: [trialSchema], default: [] },
      },
      technical: {
        ...roundResultSchema.obj,
        sessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InterviewSession',
          default: null,
        },
        locked: { type: Boolean, default: false },
        trials: { type: [trialSchema], default: [] },
      },
      hr: {
        ...roundResultSchema.obj,
        sessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InterviewSession',
          default: null,
        },
        locked: { type: Boolean, default: false },
        trials: { type: [trialSchema], default: [] },
      },
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Non-unique index for fast lookup of user placement attempts per role
threeRoundAttemptSchema.index({ user: 1, role: 1, isLatest: 1 });

const ThreeRoundAttempt = mongoose.model(
  'ThreeRoundAttempt',
  threeRoundAttemptSchema
);

// Safely drop pre-existing unique index from MongoDB collection if present
ThreeRoundAttempt.collection.dropIndex('user_1_role_1').catch(() => {
  // Ignore error if index does not exist in MongoDB
});

export default ThreeRoundAttempt;
