require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER.trim(),
    pass: process.env.EMAIL_PASS.trim(),
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Error explicitly from Gmail Verification:", error.message);
  } else {
    console.log("Server is ready to take our messages");
  }
});
