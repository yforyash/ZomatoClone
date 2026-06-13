const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendResetEmail(email, resetLink) {
  const hasSMTPConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSMTPConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for others
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Zomato Clone" <no-reply@zomatoclone.com>',
        to: email,
        subject: 'Reset Your Password - Zomato Clone',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 2rem; max-width: 600px; margin: auto; border: 1px solid #ffffff14; border-radius: 12px; background-color: #121215; color: #f3f4f6;">
            <h2 style="color: #e23744; font-family: 'Outfit', sans-serif;">Zomato Clone Password Reset</h2>
            <p>Hello,</p>
            <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
            <p>Please click the button below or copy and paste the URL into your browser within 1 hour to complete the process:</p>
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #e23744 0%, #b31d28 100%); color: white; padding: 0.8rem 1.8rem; border-radius: 30px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #9ca3af; font-size: 0.85rem;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📬 [EMAIL SENT VIA SMTP] to: ${email}`);
    } catch (err) {
      console.error('Failed to send email via SMTP, falling back to console log:', err.message);
      logFallback(email, resetLink);
    }
  } else {
    logFallback(email, resetLink);
  }
}

function logFallback(email, resetLink) {
  console.log('\n=========================================');
  console.log(`📬 [EMAIL LOG (MOCK)] to: ${email}`);
  console.log(`Reset link: ${resetLink}`);
  console.log('=========================================\n');
}

module.exports = { sendResetEmail };
