const nodemailer = require('nodemailer');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use APP PASSWORD here
  },
});
// Verify connection configuration
transporter.verify(function (error, success) {
  if (error)
  {
    console.log(' Email transporter error:', error);
  } else 
  {
    console.log(' Email server is ready to take our messages');
  }
});
// Send OTP email function
const sendOTPEmail = async (email, otpCode) => {
  try {
    console.log('Attempting to send OTP to:', email);
    
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verification Code</h2>
          <p>Your OTP code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; margin: 0; font-size: 32px;">${otpCode}</h1>
          </div>
          <p>This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Email sent successfully! Message ID:', info.messageId);
    console.log(' Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
    
  } catch (error) {
    console.error(' Email sending error:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

module.exports = { sendOTPEmail, transporter };