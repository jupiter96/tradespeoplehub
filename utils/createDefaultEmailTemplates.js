import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailTemplate from '../models/EmailTemplate.js';

dotenv.config();

const defaultTemplates = [
  {
    type: 'verification',
    subject: 'Welcome to Sortars! Please verify your email',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hello {{firstName}}!</h1>
    
    <p>Thank you for joining Sortars! We're thrilled to have you on board.</p>
    
    <p>To complete your registration and ensure the security of your account, please verify your email address by entering the verification code below:</p>
    
    <div style="background-color: #ffffff; border: 2px solid #3498db; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
      <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #3498db; letter-spacing: 5px;">{{code}}</p>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team. We're here to help!</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'code', 'logoUrl'],
  },
  {
    type: 'welcome',
    subject: 'Welcome to Sortars! Your account is ready',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sortars</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #27ae60; margin-top: 0;">🎉 Welcome to Sortars, {{firstName}}!</h1>
    
    <p>Congratulations! Your email and phone number have been successfully verified. Your account is now active and ready to use.</p>
    
    <p>We're excited to have you as part of our community. Here's what you can do next:</p>
    
    <ul style="line-height: 2;">
      <li>Complete your profile to help others get to know you better</li>
      <li>Explore our marketplace and discover amazing services</li>
      <li>Connect with professionals and clients in your area</li>
      <li>Start building your network and growing your business</li>
    </ul>
    
    <div style="background-color: #ffffff; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">Need help getting started?</p>
      <p style="margin: 5px 0 0 0;">Our support team is always here to assist you. Feel free to reach out anytime!</p>
    </div>
    
    <p>Thank you for choosing Sortars. We look forward to helping you succeed!</p>
    
    <p style="margin-top: 30px;">Warm regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'logoUrl'],
  },
  {
    type: 'reminder-verification',
    subject: 'Complete your Sortars account verification',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #e67e22; margin-top: 0;">Hi {{firstName}},</h1>
    
    <p>We noticed that you haven't completed your account verification yet. To fully activate your Sortars account and access all features, please complete the verification process.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">What needs to be verified?</p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Email address</li>
        <li>Phone number</li>
      </ul>
    </div>
    
    <p>Completing verification is quick and easy, and it helps us keep your account secure. It only takes a few minutes!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{verificationLink}}" style="background-color: #3498db; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Complete Verification</a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="{{verificationLink}}" style="color: #3498db;">{{verificationLink}}</a></p>
    
    <p>If you have any questions or need assistance, our support team is here to help!</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'verificationLink', 'logoUrl'],
  },
  {
    type: 'reminder-identity',
    subject: 'Complete your professional account verification',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identity Verification Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #e67e22; margin-top: 0;">Hello {{firstName}},</h1>
    
    <p>Thank you for being part of our professional community! To unlock all the features and benefits of your professional account, we need you to complete your identity verification.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">What you need to submit:</p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Identity verification document (ID card, passport, or driver's license)</li>
      </ul>
    </div>
    
    <p>Completing your identity verification helps build trust with clients and allows you to access premium features. The process is secure and confidential.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{verificationLink}}" style="background-color: #3498db; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Complete Identity Verification</a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="{{verificationLink}}" style="color: #3498db;">{{verificationLink}}</a></p>
    
    <p>If you have any questions about the verification process, please don't hesitate to contact our support team. We're here to help!</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'verificationLink', 'logoUrl'],
  },
  {
    type: 'fully-verified',
    subject: '🎉 Congratulations! Your account is fully verified',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Fully Verified</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
      <h1 style="color: #27ae60; margin-top: 0;">Congratulations, {{firstName}}!</h1>
    </div>
    
    <p>We're thrilled to inform you that your professional account is now fully verified! You've successfully completed all verification steps:</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="color: #27ae60; font-size: 20px; margin-right: 10px;">✓</span>
          <strong>Email Address</strong> - Verified
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="color: #27ae60; font-size: 20px; margin-right: 10px;">✓</span>
          <strong>Phone Number</strong> - Verified
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="color: #27ae60; font-size: 20px; margin-right: 10px;">✓</span>
          <strong>Address</strong> - Verified
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="color: #27ae60; font-size: 20px; margin-right: 10px;">✓</span>
          <strong>Identity Document</strong> - Verified
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="color: #27ae60; font-size: 20px; margin-right: 10px;">✓</span>
          <strong>Payment Method</strong> - Verified
        </li>
        <li style="padding: 10px 0;">
          <span style="color: #27ae60; font-size: 20px; margin-right: 10px;">✓</span>
          <strong>Public Liability Insurance</strong> - Verified
        </li>
      </ul>
    </div>
    
    <p>Your fully verified status means you now have access to:</p>
    
    <ul style="line-height: 2;">
      <li>All premium features and services</li>
      <li>Enhanced visibility in search results</li>
      <li>Priority customer support</li>
      <li>Exclusive business opportunities</li>
    </ul>
    
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #155724;">You're all set!</p>
      <p style="margin: 5px 0 0 0;">Start exploring all the amazing features available to verified professionals.</p>
    </div>
    
    <p>Thank you for being part of our community. We're excited to see what you'll accomplish!</p>
    
    <p style="margin-top: 30px;">Warm regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'logoUrl'],
  },
];

async function createDefaultTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const logoUrl = process.env.EMAIL_LOGO_URL || 'https://sortars.com/logo.png';

    for (const template of defaultTemplates) {
      const existing = await EmailTemplate.findOne({ type: template.type });
      if (existing) {
        console.log(`Template ${template.type} already exists, skipping...`);
        continue;
      }

      const templateData = {
        ...template,
        logoUrl: logoUrl,
        body: template.body.replace(/\{\{logoUrl\}\}/g, logoUrl),
      };

      await EmailTemplate.create(templateData);
      console.log(`Created default template: ${template.type}`);
    }

    console.log('Default email templates created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating default templates:', error);
    process.exit(1);
  }
}

createDefaultTemplates();

