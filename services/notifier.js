import nodemailer from 'nodemailer';
import twilio from 'twilio';

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
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
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

  await mailTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: 'Your TradePplHub verification code',
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <strong>${code}</strong></p>`,
  });
}

export async function sendSmsVerificationCode(to, code) {
  if (!to || !code) {
    return;
  }

  logCode('sms', to, code);

  if (!twilioClient) {
    console.warn('[SMS] Twilio credentials are not configured. Code logged for manual verification.');
    return;
  }

  await twilioClient.messages.create({
    to,
    from: TWILIO_FROM,
    body: `Your TradePplHub verification code is ${code}`,
  });
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

