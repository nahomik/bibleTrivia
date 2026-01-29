const { Pool } = require('pg');

const pool = new Pool({
  user: 'trivia_user',
  host: 'localhost',
  database: 'bible_trivia',
  password: 'trivia_pass',
  port: 5432,
});


module.exports = pool;
