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
      },
      technical: {
        ...roundResultSchema.obj,
        sessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InterviewSession',
          default: null,
        },
        locked: { type: Boolean, default: false },
      },
      hr: {
        ...roundResultSchema.obj,
        sessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InterviewSession',
          default: null,
        },
        locked: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

// A user can only have one active placement attempt per role
threeRoundAttemptSchema.index({ user: 1, role: 1 }, { unique: true });

const ThreeRoundAttempt = mongoose.model(
  'ThreeRoundAttempt',
  threeRoundAttemptSchema
);

export default ThreeRoundAttempt;
