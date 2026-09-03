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
      user: { id: user._id, email: user.email, name: user.name || '' },
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
      user: { id: user._id, email: user.email, name: user.name || '' },
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    checkValidation(req);

    const { name, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (newPassword !== undefined) {
      if (!currentPassword) {
        const err = new Error('Current password is required to set a new password');
        err.statusCode = 400;
        throw err;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        const err = new Error('Current password is incorrect');
        err.statusCode = 401;
        throw err;
      }

      user.password = newPassword;
    }

    if (name !== undefined) {
      user.name = String(name).trim();
    }

    await user.save();

    res.json({
      user: { id: user._id, email: user.email, name: user.name || '' },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, updateProfile };
