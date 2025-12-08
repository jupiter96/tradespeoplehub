import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import EmailTemplate from '../models/EmailTemplate.js';

// Load environment variables first
dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM = 'support@sortars.com',
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || 'TRADEPPLHUB',
} = process.env;

// Debug logging for SMTP credentials
console.log('[Notifier] SMTP configuration check:', {
  hasHost: !!SMTP_HOST,
  hasPort: !!SMTP_PORT,
  hasUser: !!SMTP_USER,
  hasPass: !!SMTP_PASS,
  host: SMTP_HOST || 'missing',
  port: SMTP_PORT || 'missing',
  user: SMTP_USER || 'missing',
  emailFrom: EMAIL_FROM
});

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
  console.log('[Notifier] Initializing SMTP transporter:', {
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    user: SMTP_USER,
    hasPassword: !!SMTP_PASS
  });
  
  try {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log('[Notifier] SMTP transporter created successfully');
    
    // Verify connection
    mailTransporter.verify((error, success) => {
      if (error) {
        console.error('[Notifier] SMTP connection verification failed:', error);
      } else {
        console.log('[Notifier] SMTP connection verified successfully');
      }
    });
  } catch (error) {
    console.error('[Notifier] Failed to create SMTP transporter:', error);
  }
} else {
  console.warn('[Notifier] SMTP configuration incomplete:', {
    hasHost: !!SMTP_HOST,
    hasPort: !!SMTP_PORT,
    hasUser: !!SMTP_USER,
    hasPass: !!SMTP_PASS
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

// Render email template with variables
export function renderEmailTemplate(templateBody, variables) {
  let rendered = templateBody;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  return rendered;
}

// Send email using template
export async function sendTemplatedEmail(to, templateType, variables = {}) {
  console.log('[EMAIL] sendTemplatedEmail called:', {
    to: to || 'missing',
    templateType: templateType || 'missing',
    variables: Object.keys(variables),
    timestamp: new Date().toISOString()
  });

  if (!to || !templateType) {
    console.error('[EMAIL] Missing required parameters:', {
      to: to || 'missing',
      templateType: templateType || 'missing'
    });
    return null;
  }

  try {
    const template = await EmailTemplate.findOne({ 
      type: templateType, 
      isActive: true 
    });

    if (!template) {
      console.error('[EMAIL] Template not found:', {
        templateType,
        isActive: true
      });
      return null;
    }

    console.log('[EMAIL] Template found:', {
      templateType,
      templateId: template._id,
      hasSubject: !!template.subject,
      hasBody: !!template.body
    });

    // Add logo URL to variables if not provided
    const templateVariables = {
      ...variables,
      logoUrl: variables.logoUrl || template.logoUrl || process.env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/drv3pneh8/image/upload/v1765138083/71632be70905a17fd389a8d053249645c4e8a4df_wvs6z6.png',
    };

    const subject = renderEmailTemplate(template.subject, templateVariables);
    const htmlBody = renderEmailTemplate(template.body, templateVariables);

    console.log('[EMAIL] Template rendered:', {
      subject: subject.substring(0, 50) + '...',
      bodyLength: htmlBody.length
    });

    if (!mailTransporter) {
      console.warn('[EMAIL] SMTP is not configured. Email would be sent with template:', {
        to,
        subject,
        templateType
      });
      return null;
    }

    const emailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html: htmlBody,
    };

    console.log('[EMAIL] Attempting to send templated email:', {
      from: emailOptions.from,
      to: emailOptions.to,
      subject: emailOptions.subject,
      templateType,
      timestamp: new Date().toISOString()
    });

    const result = await mailTransporter.sendMail(emailOptions);
    console.log('[EMAIL] Templated email sent successfully:', {
      messageId: result.messageId,
      response: result.response,
      accepted: result.accepted,
      rejected: result.rejected,
      templateType,
      timestamp: new Date().toISOString()
    });
    return result;
  } catch (error) {
    console.error('[EMAIL] Failed to send templated email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
      templateType,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function sendEmailVerificationCode(to, code, firstName = 'User') {
  console.log('[EMAIL] sendEmailVerificationCode called:', {
    to: to || 'missing',
    code: code || 'missing',
    firstName: firstName,
    hasTo: !!to,
    hasCode: !!code,
    codeLength: code?.length || 0,
    timestamp: new Date().toISOString()
  });

  if (!to || !code) {
    console.error('[EMAIL] Missing required parameters:', {
      to: to || 'missing',
      code: code || 'missing'
    });
    return;
  }

  logCode('email', to, code);

  // Try to use template first
  try {
    const result = await sendTemplatedEmail(to, 'verification', {
      firstName: firstName,
      code: code,
    });
    if (result) {
      return result;
    }
  } catch (templateError) {
    console.warn('[EMAIL] Template email failed, falling back to simple email:', templateError.message);
  }

  // Fallback to simple email if template fails
  console.log('[EMAIL] Checking mail transporter:', {
    hasMailTransporter: !!mailTransporter,
    transporterType: mailTransporter ? typeof mailTransporter : 'null'
  });

  if (!mailTransporter) {
    console.warn('[EMAIL] SMTP is not configured. Code logged for manual verification.');
    console.warn('[EMAIL] SMTP configuration status:', {
      SMTP_HOST: SMTP_HOST || 'missing',
      SMTP_PORT: SMTP_PORT || 'missing',
      SMTP_USER: SMTP_USER || 'missing',
      SMTP_PASS: SMTP_PASS ? '***' : 'missing',
      EMAIL_FROM: EMAIL_FROM
    });
    return;
  }

  const emailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Your Sortars verification code',
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <strong>${code}</strong></p>`,
  };

  console.log('[EMAIL] Attempting to send email:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await mailTransporter.sendMail(emailOptions);
    console.log('[EMAIL] Email sent successfully:', {
      messageId: result.messageId,
      response: result.response,
      accepted: result.accepted,
      rejected: result.rejected,
      pending: result.pending,
      timestamp: new Date().toISOString()
    });
    return result;
  } catch (error) {
    console.error('[EMAIL] Failed to send verification email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
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

