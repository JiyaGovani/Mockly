import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dbConnect from './config/db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import rolesRouter from './routes/roles.js';
import questionsRouter from './routes/questions.js';
import evaluationRouter from './routes/evaluation.js';
import dashboardRouter from './routes/dashboard.js';
import sessionsRouter from './routes/sessions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
dbConnect();

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/evaluation', evaluationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/sessions', sessionsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

