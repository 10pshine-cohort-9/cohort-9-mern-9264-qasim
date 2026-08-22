const express = require('express');
const { body } = require('express-validator');

const { register, login } = require('../controllers/auth.controller');

const router = express.Router();

const registerValidation = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

module.exports = router;
