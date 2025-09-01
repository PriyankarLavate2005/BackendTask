const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isOTPExpired = (expiryTime) => {
  return Date.now() > expiryTime;
};

module.exports = { generateOTP, isOTPExpired };