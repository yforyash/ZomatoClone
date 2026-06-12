function requestLogger(req, res, next) {
  const time = new Date().toLocaleTimeString();
  console.log(`[LOG] Time: ${time} | Method: ${req.method} | Path: ${req.url}`);
  next();
}

module.exports = requestLogger;
