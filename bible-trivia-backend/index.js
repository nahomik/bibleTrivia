const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// 🔥 sanity check — proves THIS file is running
console.log('🔥 CORRECT index.js IS RUNNING 🔥');

// root test
app.get('/', (req, res) => {
  res.send('Bible Trivia API is very very very running');
});

app.get('/questions', async (req, res) => {
  const { difficulty } = req.query;

  if (!difficulty) {
    return res.status(400).json({ error: 'Difficulty is required' });
  }

  try {
    // get random question
    const questionResult = await pool.query(
      `SELECT id, text, difficulty
       FROM questions
       WHERE difficulty = $1
       ORDER BY RANDOM()
       LIMIT 1`,
      [difficulty]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No questions found' });
    }

    const question = questionResult.rows[0];

    // get answers (NO is_correct)
    const answersResult = await pool.query(
      `SELECT id, text
       FROM answers
       WHERE question_id = $1`,
      [question.id]
    );

    res.json({
      question,
      answers: answersResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/answer', async (req, res) => {
  const { user_id, question_id, answer_id, used_hint } = req.body;

  if (!user_id || !question_id || !answer_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // check answer correctness
    const answerResult = await pool.query(
      `SELECT is_correct
       FROM answers
       WHERE id = $1 AND question_id = $2`,
      [answer_id, question_id]
    );

    if (answerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const isCorrect = answerResult.rows[0].is_correct;

    // get difficulty
    const questionResult = await pool.query(
      `SELECT difficulty FROM questions WHERE id = $1`,
      [question_id]
    );

    const difficulty = questionResult.rows[0].difficulty;

    // scoring rules
    let score = 0;
let bonus = 0;

// get current streak
const streakResult = await pool.query(
  `SELECT current_streak FROM users WHERE id = $1`,
  [user_id]
);

let currentStreak = streakResult.rows[0].current_streak;

if (isCorrect) {
  // base score
  if (difficulty === 'easy') score = 10;
  if (difficulty === 'medium') score = 20;
  if (difficulty === 'tough') score = 50;

  if (used_hint) {
    score = Math.floor(score / 2);
  }

  // increment streak
  currentStreak += 1;

  // apply bonus
  if (currentStreak === 3) {
    bonus = 5;
    currentStreak = 0; // reset after bonus
  }
} else {
  // wrong answer resets streak
  currentStreak = 0;
}


    // record score history
    await pool.query(
      `INSERT INTO user_scores (user_id, question_id, score_awarded)
       VALUES ($1, $2, $3)`,
      [user_id, question_id, score]
    );

    // update total score
    await pool.query(
  `UPDATE users
   SET total_score = total_score + $1,
       current_streak = $2
   WHERE id = $3`,
  [score + bonus, currentStreak, user_id]
);


    res.json({
  correct: isCorrect,
  score_awarded: score,
  bonus,
  difficulty,
  streak: currentStreak
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// start server (LAST)
app.listen(5000, () => {
  console.log('🚀 Server running on http://localhost:5000');
});
