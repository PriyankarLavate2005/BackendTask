const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};
const validateUser = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Please enter a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required'),
  handleValidationErrors
];
const validateOTP = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  handleValidationErrors
];

module.exports = { validateUser, validateLogin, validateOTP };