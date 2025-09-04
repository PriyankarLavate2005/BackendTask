const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, isOTPExpired } = require('../utils/otpService');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// JWT Signup
const signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }
    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'user'
    });
    
    // Generate token
    const token = signToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    res.status(201).json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// JWT Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('=== LOGIN ATTEMPT STARTED ===');
    console.log('Email received:', email);
    console.log('Password received:', password ? '*** (hidden)' : 'undefined');
    
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    
    console.log('User found in database:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log(' LOGIN FAILED: No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }
    
    console.log('User details:', {
      id: user._id,
      email: user.email,
      hasPassword: !!user.password
    });
    
    // Check password
    console.log('Comparing passwords...');
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    
    console.log('Password comparison result:', isPasswordCorrect ? 'CORRECT' : 'INCORRECT');
    
    if (!isPasswordCorrect) {
      console.log(' LOGIN FAILED: Password incorrect for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }  
    // Generate token
    const token = signToken(user._id);    
    // Remove password from output
    user.password = undefined;    
    console.log('✅ LOGIN SUCCESSFUL for user:', user.email);
    console.log('Token generated:', token);
    console.log('User data to return:', {
      id: user._id,
      email: user.email,
      name: user.name
    });
    console.log('=== LOGIN COMPLETED ===\n');
    
    res.status(200).json({
      success: true,
      token,
      data: user
    });
    
  } catch (error) {
    console.log('LOGIN ERROR:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const { sendOTPEmail } = require('../utils/emailService');

const sendOTP = async (req, res) => {
  try {
    console.log('=== SEND OTP PROCESS STARTED ===');
    const { email } = req.body;
    
    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      user.otp = { code: otpCode, expiresAt };
      await user.save();
    } else {
      user = await User.create({
        email,
        otp: { code: otpCode, expiresAt }
      });
    }
    
    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otpCode);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });    
  } catch (error) {
    console.error(' Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    console.log('=== OTP VERIFICATION PROCESS STARTED ===');
    console.log('Request body:', req.body);    
    const { email, otp } = req.body;
    console.log('Email extracted:', email);
    console.log('OTP extracted:', otp);
    console.log('OTP length:', otp ? otp.length : 'undefined');
    console.log('OTP type:', typeof otp);
    
    // Validate OTP format first
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      console.log(' OTP VALIDATION FAILED:');
      console.log(' - OTP exists:', !!otp);
      console.log(' - OTP length:', otp ? otp.length : 0);
      console.log(' - OTP is all digits:', otp ? /^\d+$/.test(otp) : false);
      
      return res.status(400).json({
        success: false,
        errors: [{
          type: 'field',
          msg: 'OTP must be 6 digits',
          path: 'otp',
          location: 'body'
        }]
      });
    }
    
    console.log(' OTP format validation passed');
    
    // Find user by email
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email });
    console.log('User found:', user ? `Yes (ID: ${user._id})` : 'No');
    
    if (!user) {
      console.log(' No user found with email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP request'
      });
    }
    
    console.log('User OTP data:', user.otp);
    
    if (!user.otp || !user.otp.code) {
      console.log('User has no OTP data or OTP code');
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP request'
      });
    }

    console.log('Stored OTP code:', user.otp.code);
    console.log('OTP expires at:', user.otp.expiresAt);
    
    // Check if OTP is expired
    const isExpired = isOTPExpired(user.otp.expiresAt);
    console.log('Is OTP expired:', isExpired);
    
    if (isExpired) 
      {
      console.log('OTP has expired');
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    console.log('OTP is not expired');
    
    // Verify OTP
    console.log('Comparing OTPs:');
    console.log(' - Input OTP:', otp);
    console.log(' - Stored OTP:', user.otp.code);
    console.log(' - Match:', user.otp.code === otp);
    
    if (user.otp.code !== otp) {
      console.log('❌ OTP mismatch');
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    console.log('✅ OTP verification successful');
    
    // Check if user needs to complete registration
    console.log('Checking user registration status:');
    console.log(' - User name:', user.name);
    console.log(' - User phone:', user.phone);
    console.log(' - User password:', user.password ? '*** (set)' : 'not set');
    
    const isNewUser = !user.name || !user.phone || !user.password;
    console.log('Is new user (requires registration):', isNewUser);
    
    if (isNewUser) {
      console.log('New user detected, clearing OPT and returning registration flag');
      user.otp = undefined;
      await user.save();
      console.log('✅ OTP cleared from user record');
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        requiresRegistration: true,
        userId: user._id
      });
    }
    
    // For existing users, generate token and login
    console.log('Existing user detected, generating token...');
    const token = signToken(user._id);
    console.log('Token generated:', token ? '*** (hidden)' : 'null');
    
    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();
    console.log(' OTP cleared from user record');
    
    console.log('OTP verification completed successfully');
    console.log('=== OTP VERIFICATION PROCESS COMPLETED ===');
    
    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      requiresRegistration: false
    });
    
  } catch (error) {
    console.log('OTP VERIFICATION ERROR:');
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to check if OTP is expired

// Export all functions
module.exports = {
  signup,
  login,
  sendOTP,
  verifyOTP
};