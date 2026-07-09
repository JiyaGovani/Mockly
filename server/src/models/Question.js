import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Question type is required'],
      enum: ['technical', 'behavioral', 'hr', 'aptitude'],
      index: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['easy', 'medium', 'hard'],
      index: true,
    },

    // --- Answer fields (used by AI grading in Phase 2) ---
    expectedAnswer: {
      type: String,
      default: '',
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    expectedAnswerEmbedding: {
      type: [Number],
      default: undefined,
    },

    // --- MCQ fields (only for type === 'aptitude') ---
    options: {
      type: [String],
      default: undefined, // not set for non-MCQ questions
    },
    correctOption: {
      type: Number,
      min: 0,
      max: 3,
      default: undefined,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for common filter combo
questionSchema.index({ role: 1, type: 1, difficulty: 1 });

// Text index for search
questionSchema.index({ text: 'text' });

const Question = mongoose.model('Question', questionSchema);

export default Question;
