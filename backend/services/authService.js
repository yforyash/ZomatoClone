const { query } = require('../config/db');

async function getUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return result.rows[0];
}

async function createUser(name, email, passwordHash) {
  const result = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, LOWER($2), $3) RETURNING id, name, email',
    [name, email, passwordHash]
  );
  return result.rows[0];
}

async function createPasswordReset(email, token, expiresAt) {
  await query(
    'INSERT INTO password_resets (email, token, expires_at) VALUES (LOWER($1), $2, $3)',
    [email, token, expiresAt]
  );
}

async function getValidResetToken(email, token) {
  const result = await query(
    'SELECT * FROM password_resets WHERE LOWER(email) = LOWER($1) AND token = $2 AND expires_at > NOW()',
    [email, token]
  );
  return result.rows[0];
}

async function updatePassword(email, newPasswordHash) {
  await query('UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)', [newPasswordHash, email]);
}

async function deleteResetTokens(email) {
  await query('DELETE FROM password_resets WHERE LOWER(email) = LOWER($1)', [email]);
}

module.exports = {
  getUserByEmail,
  createUser,
  createPasswordReset,
  getValidResetToken,
  updatePassword,
  deleteResetTokens
};
