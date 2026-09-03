const express = require('express');
const { body } = require('express-validator');

const { register, login, updateProfile } = require('../controllers/auth.controller');
const protect = require('../middleware/auth');

const router = express.Router();

const PASSWORD_SPECIAL_CHAR = /[!@#$%^&*(),.?":{}|<>]/;

const registerValidation = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(PASSWORD_SPECIAL_CHAR)
    .withMessage('Password must include at least one special character'),
];

const loginValidation = [
  body('email').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Name must be 60 characters or fewer'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(PASSWORD_SPECIAL_CHAR)
    .withMessage('New password must include at least one special character'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.put('/profile', protect, updateProfileValidation, updateProfile);

module.exports = router;
