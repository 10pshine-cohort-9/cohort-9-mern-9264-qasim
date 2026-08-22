const jwt = require('jsonwebtoken');

function ensureConfigured() {
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    throw new Error('JWT_SECRET and JWT_EXPIRES_IN environment variables are required');
  }
}

function generateToken(userId) {
  ensureConfigured();
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function verifyToken(token) {
  ensureConfigured();
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
