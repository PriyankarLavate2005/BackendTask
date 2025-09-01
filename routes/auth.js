const express = require('express');
const {
  signup,
  login,
  sendOTP,
  verifyOTP
} = require('../controllers/authController');
const { validateUser, validateLogin, validateOTP } = require('../middleware/validation');

const router = express.Router();

router.post('/signup', validateUser, signup);
router.post('/login', validateLogin, login);
router.post('/otp/send', sendOTP);
router.post('/otp/verify', validateOTP, verifyOTP);

module.exports = router;