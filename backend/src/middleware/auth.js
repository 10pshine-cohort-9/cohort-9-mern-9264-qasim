const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

async function protect(req, res, next) {
  let decoded;

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      const err = new Error('Not authorized, no token provided');
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(' ')[1];
    decoded = verifyToken(token);
  } catch (err) {
    err.statusCode = 401;
    return next(err);
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      const err = new Error('Not authorized, user not found');
      err.statusCode = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = protect;
