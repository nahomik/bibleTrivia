import { useEffect, useState } from 'react';

function App() {
  const [difficulty, setDifficulty] = useState('easy');
  const [questionData, setQuestionData] = useState(null);
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState(null);
  // const [difficulty, setDifficulty] = useState(null);



  // Fetch question whenever difficulty changes
  useEffect(() => {
    fetch(`http://localhost:5000/questions?difficulty=${difficulty}`)
      .then(res => res.json())
      .then(data => {
        setQuestionData(data);
        setResult(null);
      })
      .catch(err => console.error(err));
  }, [difficulty]);

  const submitAnswer = async (answerId) => {
    const res = await fetch('http://localhost:5000/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        question_id: questionData.question.id,
        answer_id: answerId,
        used_hint: false
      })
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>📖 Bible Trivia</h1>

      <label>
        Difficulty:{' '}
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="tough">Tough</option>
        </select>
      </label>

      <hr />

      {!questionData && <p>Loading question...</p>}

      {questionData && (
        <>
          <h2>{questionData.question.text}</h2>

          {questionData.answers.map(a => (
            <button
              key={a.id}
              onClick={() => submitAnswer(a.id)}
              style={{ display: 'block', margin: '0.5rem 0' }}
            >
              {a.text}
            </button>
          ))}
        </>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <h3>{result.correct ? '✅ Correct!' : '❌ Wrong!'}</h3>
          <p>Score awarded: {result.score_awarded}</p>
          <p>Difficulty: {result.difficulty}</p>
        </div>
      )}
    </div>
  );
}

export default App;
