const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Not authorized, no token provided');
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      const err = new Error('Not authorized, user not found');
      err.statusCode = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err) {
    err.statusCode = err.statusCode || 401;
    next(err);
  }
}

module.exports = protect;
