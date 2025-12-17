import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import EmailTemplate from '../models/EmailTemplate.js';
import SmtpConfig from '../models/SmtpConfig.js';
import EmailCategorySmtp from '../models/EmailCategorySmtp.js';

// Load environment variables first
dotenv.config();

// Global SMTP config (host, port, pass only)
let SMTP_HOST, SMTP_PORT, SMTP_PASS;

// Category-specific SMTP users (loaded from database)
const categorySmtpUsers = new Map();

let deferredDbLoadAttached = false;

function loadFromEnvFallback() {
  // Fallback to environment variables for global config
  SMTP_HOST = process.env.SMTP_HOST;
  SMTP_PORT = process.env.SMTP_PORT;
  SMTP_PASS = process.env.SMTP_PASS;

  // Initialize category SMTP users from environment variables
  const categories = ['verification', 'listing', 'orders', 'notification', 'support', 'no-reply'];
  for (const category of categories) {
    let envValue = null;

    if (category === 'support') {
      envValue = process.env.SMTP_USER;
    } else if (category === 'no-reply') {
      envValue = process.env.SMTP_USER_NO_REPLY || process.env.SMTP_USER;
    } else {
      const envVarName = `SMTP_USER_${category.toUpperCase()}`;
      envValue = process.env[envVarName] || process.env.SMTP_USER;
    }

    if (envValue) categorySmtpUsers.set(category, envValue);
  }
}

function ensureDbLoadAfterConnect() {
  if (deferredDbLoadAttached) return;
  deferredDbLoadAttached = true;

  mongoose.connection.once('connected', () => {
    // Retry loading from DB once MongoDB is ready (non-blocking)
    loadSmtpConfig().catch((err) => {
      console.error('[Notifier] Deferred SMTP config load failed:', err);
    });
  });
}

async function loadSmtpConfig() {
  // IMPORTANT: avoid Mongoose buffering timeouts at startup.
  // If MongoDB isn't connected yet, don't hit the DB—use env and retry after connect.
  if (mongoose.connection.readyState !== 1) {
    loadFromEnvFallback();
    console.log('[Notifier] MongoDB not connected yet - using environment variables (will retry after connect)');
    ensureDbLoadAfterConnect();
    return;
  }

  try {
    // Load global SMTP config (host, port, pass)
    let smtpConfig = await SmtpConfig.findOne();
    if (smtpConfig) {
      SMTP_HOST = smtpConfig.smtpHost;
      SMTP_PORT = smtpConfig.smtpPort;
      SMTP_PASS = smtpConfig.smtpPass;
      console.log('[Notifier] Using global SMTP configuration from database');
    } else {
      // Initialize from environment variables if available
      if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_PASS) {
        smtpConfig = await SmtpConfig.create({
          smtpHost: process.env.SMTP_HOST,
          smtpPort: parseInt(process.env.SMTP_PORT) || 587,
          smtpPass: process.env.SMTP_PASS,
        });
        SMTP_HOST = smtpConfig.smtpHost;
        SMTP_PORT = smtpConfig.smtpPort;
        SMTP_PASS = smtpConfig.smtpPass;
        console.log('[Notifier] Initialized global SMTP config from environment variables');
      } else {
        // Fallback to environment variables
        SMTP_HOST = process.env.SMTP_HOST;
        SMTP_PORT = process.env.SMTP_PORT;
        SMTP_PASS = process.env.SMTP_PASS;
        console.log('[Notifier] Using global SMTP configuration from environment variables');
      }
    }

    // Load category-specific SMTP users
    const categories = ['verification', 'listing', 'orders', 'notification', 'support', 'no-reply'];
    for (const category of categories) {
      let categorySmtp = await EmailCategorySmtp.findOne({ category });
      
      // Migrate old 'team' to 'no-reply' if exists
      if (category === 'no-reply' && !categorySmtp) {
        const oldTeamSmtp = await EmailCategorySmtp.findOne({ category: 'team' });
        if (oldTeamSmtp) {
          categorySmtp = await EmailCategorySmtp.create({
            category: 'no-reply',
            smtpUser: oldTeamSmtp.smtpUser,
          });
          console.log(`[Notifier] Migrated 'team' to 'no-reply' SMTP user`);
        }
      }
      
      if (!categorySmtp) {
        let envValue = null;
        
        // Support category uses SMTP_USER directly
        if (category === 'support') {
          envValue = process.env.SMTP_USER;
          if (envValue) {
            categorySmtp = await EmailCategorySmtp.create({
              category,
              smtpUser: envValue,
            });
            console.log(`[Notifier] Initialized ${category} SMTP user from SMTP_USER`);
          }
        } else if (category === 'no-reply') {
          // No-reply category uses SMTP_USER_NO_REPLY
          envValue = process.env.SMTP_USER_NO_REPLY;
          if (envValue) {
            categorySmtp = await EmailCategorySmtp.create({
              category,
              smtpUser: envValue,
            });
            console.log(`[Notifier] Initialized ${category} SMTP user from SMTP_USER_NO_REPLY`);
          } else {
            // Fallback to default SMTP_USER if available
            const defaultUser = process.env.SMTP_USER;
            if (defaultUser) {
              categorySmtp = await EmailCategorySmtp.create({
                category,
                smtpUser: defaultUser,
              });
              console.log(`[Notifier] Initialized ${category} SMTP user from default SMTP_USER`);
            }
          }
        } else {
          // Other categories use SMTP_USER_{CATEGORY}
          const envVarName = `SMTP_USER_${category.toUpperCase()}`;
          envValue = process.env[envVarName];
          
          if (envValue) {
            categorySmtp = await EmailCategorySmtp.create({
              category,
              smtpUser: envValue,
            });
            console.log(`[Notifier] Initialized ${category} SMTP user from environment variable ${envVarName}`);
          } else {
            // Fallback to default SMTP_USER if available
            const defaultUser = process.env.SMTP_USER;
            if (defaultUser) {
              categorySmtp = await EmailCategorySmtp.create({
                category,
                smtpUser: defaultUser,
              });
              console.log(`[Notifier] Initialized ${category} SMTP user from default SMTP_USER`);
            }
          }
        }
      }
      
      if (categorySmtp) {
        categorySmtpUsers.set(category, categorySmtp.smtpUser);
      }
    }
    
    console.log('[Notifier] Category SMTP users loaded:', Object.fromEntries(categorySmtpUsers));
  } catch (error) {
    console.error('[Notifier] Error loading SMTP config from database, using environment variables:', error);
    loadFromEnvFallback();
    console.log('[Notifier] Category SMTP users loaded from environment variables (fallback):', Object.fromEntries(categorySmtpUsers));
  }
}

// Get SMTP user for a category
function getSmtpUserForCategory(category) {
  return categorySmtpUsers.get(category) || process.env.SMTP_USER || '';
}

// Load SMTP config on module initialization (non-blocking)
loadSmtpConfig().catch((err) => {
  console.error('[Notifier] Initial SMTP config load failed:', err);
});

// Function to reload SMTP config (useful when admin updates settings)
export async function reloadSmtpConfig() {
  await loadSmtpConfig();
  // Recreate transporters with new config
  await initializeTransporters();
}

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || 'TRADEPPLHUB',
  TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER, // Actual Twilio phone number for countries that don't support alphanumeric sender IDs
} = process.env;

// Debug logging for SMTP credentials
console.log('[Notifier] SMTP configuration check:', {
  hasHost: !!SMTP_HOST,
  hasPort: !!SMTP_PORT,
  hasPass: !!SMTP_PASS,
  host: SMTP_HOST || 'missing',
  port: SMTP_PORT || 'missing',
  categoryUsers: Object.fromEntries(categorySmtpUsers)
});

// Debug logging for Twilio credentials
console.log('[Notifier] Twilio configuration check:', {
  hasAccountSid: !!TWILIO_ACCOUNT_SID,
  hasAuthToken: !!TWILIO_AUTH_TOKEN,
  accountSidLength: TWILIO_ACCOUNT_SID?.length || 0,
  authTokenLength: TWILIO_AUTH_TOKEN?.length || 0,
  fromNumber: TWILIO_FROM,
  phoneNumber: TWILIO_PHONE_NUMBER || 'not configured (required for US/Canada)'
});

let mailTransporter;
let verificationMailTransporter;

// Function to create transporter for a specific user
function createTransporterForUser(smtpUser) {
  if (!SMTP_HOST || !SMTP_PORT || !smtpUser || !SMTP_PASS) {
    return null;
  }
  
  try {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: smtpUser,
        pass: SMTP_PASS,
      },
    });
  } catch (error) {
    console.error('[Notifier] Failed to create SMTP transporter:', error);
    return null;
  }
}

// Function to initialize transporters (deprecated - now using dynamic transporters)
async function initializeTransporters() {
  // This function is kept for backward compatibility but transporters are now created dynamically
  console.log('[Notifier] Transporter initialization skipped - using dynamic transporters per category');
}

// Initialize transporters on module load
await initializeTransporters();

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

/**
 * Send email using template with category-specific SMTP configuration
 * 
 * @param {string} to - Recipient email address
 * @param {string} templateType - Template type (e.g., 'welcome', 'verification', 'verification-approved')
 * @param {object} variables - Template variables for rendering
 * @param {string} category - Email category that determines SMTP user:
 *   - 'verification': Uses SMTP_USER_VERIFICATION (for verification codes, approval/rejection emails)
 *   - 'no-reply': Uses SMTP_USER_NO_REPLY (for welcome emails, notifications)
 *   - 'listing': Uses SMTP_USER_LISTING
 *   - 'orders': Uses SMTP_USER_ORDERS
 *   - 'notification': Uses SMTP_USER_NOTIFICATION
 *   - 'support': Uses SMTP_USER
 * @returns {Promise<object|null>} - Email sending result or null if failed
 */
export async function sendTemplatedEmail(to, templateType, variables = {}, category = null) {
  console.log('[EMAIL] sendTemplatedEmail called:', {
    to: to || 'missing',
    templateType: templateType || 'missing',
    variables: Object.keys(variables),
    category: category || 'auto-detect',
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
    // Find email template
    // If category is provided, try to find template with that category first
    let template;
    
    if (category) {
      // First try to find template with the specified category
      template = await EmailTemplate.findOne({ 
        type: templateType,
        category: category,
        isActive: true 
      });
      
      // If not found with category, try without category (for backward compatibility)
      if (!template) {
        template = await EmailTemplate.findOne({ 
          type: templateType, 
          isActive: true 
        });
        if (template) {
          console.log(`[EMAIL] Template found without category, using provided category: ${category}`);
        }
      }
    } else {
      // Auto-detect: find template by type only
      template = await EmailTemplate.findOne({ 
        type: templateType, 
        isActive: true 
      });
    }

    if (!template) {
      console.error('[EMAIL] Template not found:', {
        templateType,
        category: category || 'auto-detect',
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

    // Determine the category to use for SMTP configuration
    // Priority: 1) Provided category parameter, 2) Template's category, 3) Default to 'verification'
    const emailCategory = category || template.category || 'verification';
    const smtpUser = getSmtpUserForCategory(emailCategory);
    
    if (!smtpUser) {
      console.warn(`[EMAIL] No SMTP user configured for category ${emailCategory}. Email cannot be sent:`, {
        to,
        subject,
        templateType,
        category: emailCategory
      });
      return null;
    }

    // Create transporter dynamically for this category's SMTP user
    const transporter = createTransporterForUser(smtpUser);
    
    if (!transporter) {
      console.warn(`[EMAIL] Failed to create SMTP transporter for category ${emailCategory}. Email cannot be sent:`, {
        to,
        subject,
        templateType,
        category: emailCategory,
        smtpUser
      });
      return null;
    }

    // Use the category-specific SMTP user as 'from' email address
    const emailOptions = {
      from: smtpUser,
      to,
      subject,
      html: htmlBody,
    };

    console.log(`[EMAIL] Sending email with category ${emailCategory} (from: ${smtpUser}):`, {
      to: emailOptions.to,
      subject: emailOptions.subject.substring(0, 50) + '...',
      templateType,
      category: emailCategory,
      timestamp: new Date().toISOString()
    });

    const result = await transporter.sendMail(emailOptions);
    console.log(`[EMAIL] Email sent successfully (category: ${emailCategory}):`, {
      messageId: result.messageId,
      from: smtpUser,
      to: result.accepted,
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

/**
 * Send email verification code to user during registration
 * Uses SMTP_USER_VERIFICATION (category: verification) as 'from' address
 * 
 * @param {string} to - Recipient email address
 * @param {string} code - Verification code
 * @param {string} firstName - User's first name
 * @returns {Promise<object|void>} - Email sending result or void if failed
 */
export async function sendEmailVerificationCode(to, code, firstName = 'User') {
  console.log('[EMAIL] sendEmailVerificationCode called:', {
    to: to || 'missing',
    code: code || 'missing',
    firstName: firstName,
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

  // Try to use template first (category: verification)
  try {
    const result = await sendTemplatedEmail(to, 'verification', {
      firstName: firstName,
      code: code,
    }, 'verification'); // Use verification category SMTP user
    if (result) {
      return result;
    }
  } catch (templateError) {
    console.warn('[EMAIL] Template email failed, falling back to simple email:', templateError.message);
  }

  // Fallback to simple email if template fails (use verification category SMTP user)
  const verificationSmtpUser = getSmtpUserForCategory('verification');
  
  if (!verificationSmtpUser) {
    console.warn('[EMAIL] Verification SMTP user is not configured. Code logged for manual verification.');
    console.warn('[EMAIL] Verification SMTP configuration status:', {
      SMTP_HOST: SMTP_HOST || 'missing',
      SMTP_PORT: SMTP_PORT || 'missing',
      verificationSmtpUser: verificationSmtpUser || 'missing',
      SMTP_PASS: SMTP_PASS ? '***' : 'missing'
    });
    return;
  }

  // Create transporter for verification category
  const transporter = createTransporterForUser(verificationSmtpUser);
  
  if (!transporter) {
    console.warn('[EMAIL] Failed to create verification SMTP transporter. Code logged for manual verification.');
    return;
  }

  const emailOptions = {
    from: verificationSmtpUser,
    to,
    subject: 'Your Sortars verification code',
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <strong>${code}</strong></p>`,
  };

  console.log('[EMAIL] Attempting to send verification email:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await transporter.sendMail(emailOptions);
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
  console.log('[SMS] Step 1: Starting sendSmsVerificationCode function');
  console.log('[SMS] Step 1.1: Input parameters:', { to: to ? 'provided' : 'missing', code: code ? 'provided' : 'missing' });
  
  if (!to || !code) {
    console.warn('[SMS] Step 1.2: Validation failed - Missing phone number or code');
    throw new Error('Phone number and code are required');
  }
  console.log('[SMS] Step 1.3: Validation passed');

  console.log('[SMS] Step 2: Logging code for manual verification');
  logCode('sms', to, code);
  console.log('[SMS] Step 2.1: Code logged successfully');

  console.log('[SMS] Step 3: Checking Twilio client configuration');
  if (!twilioClient) {
    console.warn('[SMS] Step 3.1: Twilio credentials are not configured. Code logged for manual verification.');
    console.warn('[SMS] Step 3.2: Please check that TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in your .env file');
    console.warn('[SMS] Step 3.3: Current env check:', {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'present' : 'missing',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'present' : 'missing'
    });
    throw new Error('Twilio is not configured');
  }
  console.log('[SMS] Step 3.4: Twilio client is configured');

  try {
    console.log('[SMS] Step 4: Attempting to send verification code to:', to);
    
    // Determine the appropriate sender ID based on the destination country
    // Alphanumeric sender IDs (like 'TRADEPPLHUB') don't work for all countries
    // For US/Canada (+1), we need to use an actual Twilio phone number
    console.log('[SMS] Step 4.1: Determining sender number');
    let fromNumber = TWILIO_FROM;
    console.log('[SMS] Step 4.2: Default from number:', fromNumber);
    
    // Check if the destination is US/Canada (+1)
    const isUSCanada = to.trim().startsWith('+1');
    console.log('[SMS] Step 4.3: Is US/Canada destination?', isUSCanada);
    
    if (isUSCanada && TWILIO_PHONE_NUMBER) {
      fromNumber = TWILIO_PHONE_NUMBER;
      console.log('[SMS] Step 4.4: Using Twilio phone number for US/Canada destination:', fromNumber);
    } else if (isUSCanada && !TWILIO_PHONE_NUMBER) {
      console.warn('[SMS] Step 4.5: Warning: US/Canada destination detected but TWILIO_PHONE_NUMBER not configured. Using alphanumeric sender ID may fail.');
    } else {
      console.log('[SMS] Step 4.6: Using alphanumeric sender ID for non-US/Canada destination');
    }
    
    console.log('[SMS] Step 5: Preparing Twilio API call');
    console.log('[SMS] Step 5.1: From:', fromNumber, 'To:', to);
    console.log('[SMS] Step 5.2: Message body will contain verification code');
    
    console.log('[SMS] Step 6: Calling Twilio API - messages.create()');
    const message = await twilioClient.messages.create({
      to,
      from: fromNumber,
      body: `Your SORTARS verification code is ${code}`,
    });
    
    console.log('[SMS] Step 7: Twilio API call successful');
    console.log('[SMS] Step 7.1: Message sent successfully:', {
      sid: message.sid,
      to: message.to,
      from: message.from,
      status: message.status,
      dateCreated: message.dateCreated,
      dateUpdated: message.dateUpdated
    });
    
    console.log('[SMS] Step 8: Returning success result');
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('[SMS] Step ERROR: Failed to send verification SMS');
    console.error('[SMS] Step ERROR.1: Error object:', error);
    console.error('[SMS] Step ERROR.2: Error type:', error.constructor.name);
    console.error('[SMS] Step ERROR.3: Error message:', error.message);
    console.error('[SMS] Step ERROR.4: Error code:', error.code);
    console.error('[SMS] Step ERROR.5: Error status:', error.status);
    console.error('[SMS] Step ERROR.6: Error moreInfo:', error.moreInfo);
    console.error('[SMS] Step ERROR.7: Error stack:', error.stack);
    console.error('[SMS] Step ERROR.8: Full error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      statusCode: error.statusCode,
      to: to,
      from: TWILIO_FROM,
      twilioErrorCode: error.code,
      twilioErrorMessage: error.message,
      twilioErrorMoreInfo: error.moreInfo
    });
    
    // Create a detailed error message for the user
    let userErrorMessage = 'Failed to send SMS verification code. ';
    if (error.code) {
      userErrorMessage += `Twilio Error Code: ${error.code}. `;
    }
    if (error.message) {
      userErrorMessage += `Error: ${error.message}. `;
    }
    if (error.moreInfo) {
      userErrorMessage += `Details: ${error.moreInfo}.`;
    }
    
    // Attach user-friendly error message to the error object
    error.userMessage = userErrorMessage;
    error.twilioErrorCode = error.code;
    error.twilioErrorMessage = error.message;
    error.twilioErrorMoreInfo = error.moreInfo;
    
    throw error;
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
    from: SMTP_USER,
    to,
    subject: 'Reset your SORTARS password',
    text: `You requested to reset your password. Click the link to continue: ${resetUrl}`,
    html: `
      <p>You requested to reset your password.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a></p>
      <p>This link will expire soon. If you didn't request a reset, you can ignore this email.</p>
    `,
  });
}

