import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM = 'no-reply@tradepplhub.com',
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || 'TRADEPPLHUB',
} = process.env;

// Debug logging for Twilio credentials
console.log('[Notifier] Twilio configuration check:', {
  hasAccountSid: !!TWILIO_ACCOUNT_SID,
  hasAuthToken: !!TWILIO_AUTH_TOKEN,
  accountSidLength: TWILIO_ACCOUNT_SID?.length || 0,
  authTokenLength: TWILIO_AUTH_TOKEN?.length || 0,
  fromNumber: TWILIO_FROM
});

let mailTransporter;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

let twilioClient;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('[Notifier] Twilio client initialized successfully');
  } catch (error) {
    console.error('[Notifier] Failed to initialize Twilio client:', error);
  }
} else {
  console.warn('[Notifier] Twilio credentials missing:', {
    hasAccountSid: !!TWILIO_ACCOUNT_SID,
    hasAuthToken: !!TWILIO_AUTH_TOKEN,
    accountSid: TWILIO_ACCOUNT_SID ? `${TWILIO_ACCOUNT_SID.substring(0, 4)}...` : 'missing',
    authToken: TWILIO_AUTH_TOKEN ? `${TWILIO_AUTH_TOKEN.substring(0, 4)}...` : 'missing'
  });
}

const logCode = (channel, to, code) => {
  console.info(`[${channel.toUpperCase()}] Verification code requested for ${to}: ${code}`);
};

export async function sendEmailVerificationCode(to, code) {
  if (!to || !code) {
    return;
  }

  logCode('email', to, code);

  if (!mailTransporter) {
    console.warn('[EMAIL] SMTP is not configured. Code logged for manual verification.');
    return;
  }

  try {
  await mailTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: 'Your TradePplHub verification code',
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <strong>${code}</strong></p>`,
  });
  } catch (error) {
    console.error('[EMAIL] Failed to send verification email:', error);
    // Don't throw error - allow flow to continue even if email sending fails
    // This is useful when SMTP is not yet configured in production
  }
}

export async function sendSmsVerificationCode(to, code) {
  if (!to || !code) {
    return;
  }

  logCode('sms', to, code);

  if (!twilioClient) {
    console.warn('[SMS] Twilio credentials are not configured. Code logged for manual verification.');
    console.warn('[SMS] Please check that TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in your .env file');
    console.warn('[SMS] Current env check:', {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'present' : 'missing',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'present' : 'missing'
    });
    return;
  }

  try {
    const message = await twilioClient.messages.create({
      to,
      from: TWILIO_FROM,
      body: `Your TradePplHub verification code is ${code}`,
    });
    console.log('[SMS] Message sent successfully:', message.sid);
  } catch (error) {
    console.error('[SMS] Failed to send verification SMS:', error);
    console.error('[SMS] Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    // Don't throw error - allow flow to continue even if SMS sending fails
    // This is useful when Twilio is not yet configured in production
  }
}

export async function sendPasswordResetEmail(to, resetUrl) {
  if (!to || !resetUrl) {
    return;
  }

  console.info(`[EMAIL] Password reset link for ${to}: ${resetUrl}`);

  if (!mailTransporter) {
    console.warn('[EMAIL] SMTP is not configured. Reset link logged for manual verification.');
    return;
  }

  await mailTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: 'Reset your TradePplHub password',
    text: `You requested to reset your password. Click the link to continue: ${resetUrl}`,
    html: `
      <p>You requested to reset your password.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a></p>
      <p>This link will expire soon. If you didn't request a reset, you can ignore this email.</p>
    `,
  });
}

