const twilio = require('twilio');
require('dotenv').config();

async function sendSMSOTP(phoneNumber, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNum = process.env.TWILIO_FROM_NUMBER;

  const hasTwilioConfig = twilio && sid && token && fromNum && 
                         sid !== 'your_twilio_sid' && 
                         token !== 'your_twilio_auth_token' && 
                         fromNum !== 'your_twilio_phone_number';

  if (hasTwilioConfig) {
    try {
      const client = twilio(sid, token);
      
      // Ensure the phone number starts with a country code (default to +91 for India if not specified)
      let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
      if (!formattedPhone.startsWith('+')) {
        const digits = formattedPhone.replace(/\D/g, '');
        if (digits.length === 10) {
          formattedPhone = `+91${digits}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
          formattedPhone = `+${digits}`;
        } else {
          formattedPhone = `+91${digits}`;
        }
      }

      await client.messages.create({
        body: `Your Zomato Clone secure card payment OTP is: ${otp}. Do not share this with anyone.`,
        from: fromNum,
        to: formattedPhone
      });
      console.log(`📱 [SMS SENT VIA TWILIO] to: ${formattedPhone} (OTP: ${otp})`);
    } catch (err) {
      console.error('Failed to send SMS via Twilio, falling back to console log:', err.message);
      logSMSFallback(phoneNumber, otp);
    }
  } else {
    logSMSFallback(phoneNumber, otp);
  }
}

function logSMSFallback(phoneNumber, otp) {
  console.log('\n=========================================');
  console.log(`📱 [SMS LOG (MOCK)] to: ${phoneNumber}`);
  console.log(`Your card payment verification OTP is: ${otp}`);
  console.log('=========================================\n');
}

module.exports = { sendSMSOTP };
