import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';
import { evaluateAttempt } from '../services/evaluationCoordinator.js';

dotenv.config();

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mockly';
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);

  // Fetch a MERN or SDE question
  const question = await Question.findOne({ type: 'technical' });
  if (!question) {
    console.error('No technical questions found in DB. Please run: npm run seed');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('\n=======================================');
  console.log('Testing Evaluation Coordinator Pipeline');
  console.log('=======================================');
  console.log(`Question ID: ${question._id}`);
  console.log(`Question:    "${question.text}"`);
  console.log(`Expected:    "${question.expectedAnswer}"`);
  console.log(`Key Points:  [${question.keyPoints.join(', ')}]`);
  console.log('=======================================\n');

  // Let's define a mock user answer
  // We'll compose it to match some keypoints and be semantically similar
  const userAnswer = `
    A stack is a linear data structure that operates on a LIFO (Last In First Out) principle. 
    It supports two main operations: push (to add an element to the top) and pop (to remove the top element).
    It is used in function call stacks and back-tracking algorithms.
  `;

  console.log(`User Answer:\n"${userAnswer.trim()}"\n`);
  console.log('Running evaluation (Ollama call might take 5-30s)...');

  try {
    const start = Date.now();
    const result = await evaluateAttempt({
      questionId: question._id.toString(),
      userAnswer,
    });
    const totalDuration = ((Date.now() - start) / 1000).toFixed(2);

    console.log('=======================================');
    console.log('EVALUATION COMPLETED SUCCESSFULLY!');
    console.log(`Total script duration: ${totalDuration}s`);
    console.log('=======================================');
    console.log(JSON.stringify(result, null, 2));
    console.log('=======================================\n');
  } catch (err) {
    console.error('\n❌ Evaluation Pipeline Failed:');
    console.error('Message:', err.message);
    if (err.statusCode) {
      console.error('Mapped StatusCode:', err.statusCode);
    }
    console.error('\nTips:');
    if (err.message.includes('offline') || err.code === 'ECONNREFUSED') {
      console.error('👉 Make sure Ollama background service is running on your host machine:');
      console.error('   run "ollama serve" in a terminal.');
    } else if (err.message.includes('not found') || err.message.includes('404')) {
      console.error('👉 Ensure you have downloaded the required models:');
      console.error('   run "ollama pull llama3" and "ollama pull nomic-embed-text"');
    }
    console.error('=======================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

test().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
