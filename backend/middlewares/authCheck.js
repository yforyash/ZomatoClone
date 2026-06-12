function authCheck(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (userId) {
    console.log(`[AUTH] Request authorized for User ID: ${userId}`);
  } else {
    console.log('[AUTH] Public request (No User ID header provided)');
  }
  next();
}

module.exports = authCheck;
