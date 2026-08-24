const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

function checkValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array()[0].msg);
    err.statusCode = 400;
    throw err;
  }
}

async function register(req, res, next) {
  try {
    checkValidation(req);

    const email = String(req.body.email).toLowerCase().trim();
    const { password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('Email is already registered');
      err.statusCode = 409;
      throw err;
    }

    let user;
    try {
      user = await User.create({ email, password });
    } catch (err) {
      if (err.code === 11000) {
        const duplicateErr = new Error('Email is already registered');
        duplicateErr.statusCode = 409;
        throw duplicateErr;
      }
      throw err;
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    checkValidation(req);

    const email = String(req.body.email).toLowerCase().trim();
    const { password } = req.body;

    const user = await User.findOne({ email });
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
