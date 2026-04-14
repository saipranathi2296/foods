const twilio = require('twilio');

const sendSMS = async (to, messageBody) => {
  try {
    // If credentials are not set, just mock the implementation to prevent crashes.
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn('⚠️ Twilio credentials missing. SMS skipped.');
      console.warn(`[Mock SMS] To: ${to} | Message: ${messageBody}`);
      return;
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Twilio requires typical E.164 formatting (e.g. +1234567890). 
    // We append a basic country code if not present, but you might want robust validation later.
    let formattedTo = to;
    if (!formattedTo.startsWith('+')) {
      // Assuming India +91 as default for SRMAP
      formattedTo = '+91' + formattedTo; 
    }

    const result = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo
    });

    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Don't crash the auth stream if SMS fails, just log it.
  }
};

module.exports = sendSMS;
