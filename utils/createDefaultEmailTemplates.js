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
    category: 'no-reply', // Welcome emails are sent from no-reply address
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
  {
    type: 'verification-approved',
    subject: '✅ Your {{verificationType}} Has Been Approved',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
      <h1 style="color: #27ae60; margin-top: 0;">Great News, {{firstName}}!</h1>
    </div>
    
    <p>We're pleased to inform you that your <strong>{{verificationType}}</strong> has been successfully approved!</p>
    
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #155724;">✓ Verification Status: Approved</p>
      <p style="margin: 5px 0 0 0; color: #155724;">Your {{verificationType}} has been reviewed and verified by our team.</p>
    </div>
    
    <p>This is an important step toward completing your professional account verification. You're making great progress!</p>
    
    <p>If you have any questions or need assistance with the next steps, please don't hesitate to contact our support team. We're here to help!</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d;"><strong>What's next?</strong></p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f8c8d;">Continue completing the remaining verification steps to unlock all features of your professional account.</p>
    </div>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'verificationType', 'verificationStep', 'logoUrl'],
  },
  {
    type: 'verification-rejected',
    subject: '⚠️ Action Required: Your {{verificationType}} Needs Attention',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">⚠️</div>
      <h1 style="color: #e67e22; margin-top: 0;">Hello {{firstName}},</h1>
    </div>
    
    <p>We've reviewed your <strong>{{verificationType}}</strong> submission, and unfortunately, we need some additional information or corrections.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">Verification Status: Requires Action</p>
      <p style="margin: 5px 0 0 0; color: #856404;">Your {{verificationType}} could not be approved at this time.</p>
    </div>
    
    <div style="background-color: #ffffff; border: 2px solid #e67e22; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Rejection Reason</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333; line-height: 1.8;">{{rejectionReason}}</p>
    </div>
    
    <p>Please review the reason above and resubmit your {{verificationType}} with the necessary corrections or additional information.</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d;"><strong>What to do next:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #7f8c8d; font-size: 14px;">
        <li>Review the rejection reason carefully</li>
        <li>Make the necessary corrections or gather additional documents</li>
        <li>Resubmit your {{verificationType}} through your account dashboard</li>
        <li>If you have questions, contact our support team for assistance</li>
      </ul>
    </div>
    
    <p>We're here to help you complete the verification process successfully. If you have any questions about the rejection reason or need guidance on what's required, please don't hesitate to reach out to our support team.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'verificationType', 'verificationStep', 'rejectionReason', 'logoUrl'],
  },
  {
    type: 'listing-submitted',
    category: 'listing',
    subject: '✅ Your Listing Has Been Submitted for Review',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listing Submitted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">📋</div>
      <h1 style="color: #3498db; margin-top: 0;">Thank You, {{firstName}}!</h1>
    </div>
    
    <p>We've successfully received your listing submission for <strong>{{serviceTitle}}</strong>.</p>
    
    <div style="background-color: #e3f2fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #1565c0;">✓ Submission Status: Received</p>
      <p style="margin: 5px 0 0 0; color: #1565c0;">Your listing is now in our review queue and will be processed shortly.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Listing Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Service:</strong> {{serviceTitle}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Category:</strong> {{categoryName}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Submitted:</strong> {{submittedDate}}</p>
    </div>
    
    <p>Our team will review your listing to ensure it meets our quality standards. You'll receive an email notification once the review is complete, typically within 1-2 business days.</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d;"><strong>What happens next?</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #7f8c8d; font-size: 14px;">
        <li>Our team will review your listing</li>
        <li>You'll receive an email once the review is complete</li>
        <li>If approved, your listing will go live immediately</li>
        <li>If modifications are needed, we'll provide specific feedback</li>
      </ul>
    </div>
    
    <p>Thank you for choosing Sortars to showcase your services. We're excited to help you grow your business!</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'serviceTitle', 'serviceId', 'serviceSlug', 'categoryName', 'submittedDate', 'logoUrl'],
  },
  {
    type: 'listing-approved',
    category: 'listing',
    subject: '🎉 Congratulations! Your Listing Has Been Approved',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listing Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
      <h1 style="color: #27ae60; margin-top: 0;">Great News, {{firstName}}!</h1>
    </div>
    
    <p>We're thrilled to inform you that your listing <strong>{{serviceTitle}}</strong> has been approved and is now live on Sortars!</p>
    
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #155724;">✓ Listing Status: Approved & Live</p>
      <p style="margin: 5px 0 0 0; color: #155724;">Your listing is now visible to potential customers and ready to receive orders.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Listing Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Service:</strong> {{serviceTitle}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Category:</strong> {{categoryName}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Approved:</strong> {{approvedDate}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Reviewed by:</strong> {{reviewedBy}}</p>
    </div>
    
    <p>Your listing is now live and visible to customers searching for services in your category. This is an exciting step toward growing your business on Sortars!</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d;"><strong>What you can do now:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #7f8c8d; font-size: 14px;">
        <li>Share your listing with your network</li>
        <li>Respond promptly to customer inquiries</li>
        <li>Keep your listing updated with current information</li>
        <li>Collect reviews from satisfied customers</li>
      </ul>
    </div>
    
    <p>Thank you for being part of the Sortars community. We're here to support your success!</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'serviceTitle', 'serviceId', 'serviceSlug', 'categoryName', 'approvedDate', 'reviewedBy', 'logoUrl'],
  },
  {
    type: 'listing-rejected',
    category: 'listing',
    subject: '⚠️ Your Listing Requires Attention',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listing Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">⚠️</div>
      <h1 style="color: #e67e22; margin-top: 0;">Hello {{firstName}},</h1>
    </div>
    
    <p>We've reviewed your listing submission for <strong>{{serviceTitle}}</strong>, and unfortunately, we're unable to approve it at this time.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">Listing Status: Not Approved</p>
      <p style="margin: 5px 0 0 0; color: #856404;">Your listing did not meet our quality standards or guidelines.</p>
    </div>
    
    <div style="background-color: #ffffff; border: 2px solid #e67e22; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Rejection Reason</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333; line-height: 1.8;">{{rejectionReason}}</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Listing Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Service:</strong> {{serviceTitle}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Category:</strong> {{categoryName}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Rejected:</strong> {{rejectedDate}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Reviewed by:</strong> {{reviewedBy}}</p>
    </div>
    
    <p>We encourage you to review our listing guidelines and create a new listing that addresses the concerns mentioned above.</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d;"><strong>What to do next:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #7f8c8d; font-size: 14px;">
        <li>Review the rejection reason carefully</li>
        <li>Review our listing guidelines and quality standards</li>
        <li>Create a new listing that addresses the concerns</li>
        <li>If you have questions, contact our support team for assistance</li>
      </ul>
    </div>
    
    <p>We're here to help you succeed on Sortars. If you have any questions about the rejection reason or need guidance on creating a compliant listing, please don't hesitate to reach out to our support team.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'serviceTitle', 'serviceId', 'serviceSlug', 'categoryName', 'rejectedDate', 'rejectionReason', 'reviewedBy', 'logoUrl'],
  },
  {
    type: 'listing-modification-required',
    category: 'listing',
    subject: '📝 Action Required: Your Listing Needs Modifications',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listing Modification Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">📝</div>
      <h1 style="color: #f39c12; margin-top: 0;">Hello {{firstName}},</h1>
    </div>
    
    <p>We've reviewed your listing submission for <strong>{{serviceTitle}}</strong>, and we need a few modifications before we can approve it.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">Listing Status: Modifications Required</p>
      <p style="margin: 5px 0 0 0; color: #856404;">Please make the requested changes and resubmit your listing for review.</p>
    </div>
    
    <div style="background-color: #ffffff; border: 2px solid #f39c12; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Modification Request</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333; line-height: 1.8;">{{modificationReason}}</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Listing Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Service:</strong> {{serviceTitle}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Category:</strong> {{categoryName}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Requested:</strong> {{modificationDate}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Reviewed by:</strong> {{reviewedBy}}</p>
    </div>
    
    <p>Please review the modification request above and update your listing accordingly. Once you've made the changes, your listing will be automatically resubmitted for review.</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d;"><strong>What to do next:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #7f8c8d; font-size: 14px;">
        <li>Review the modification request carefully</li>
        <li>Edit your listing and make the necessary changes</li>
        <li>Save your changes - your listing will be automatically resubmitted</li>
        <li>You'll receive another email once the review is complete</li>
      </ul>
    </div>
    
    <p>We're here to help you create a successful listing. If you have any questions about the requested modifications or need assistance, please don't hesitate to contact our support team.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'serviceTitle', 'serviceId', 'serviceSlug', 'categoryName', 'modificationDate', 'modificationReason', 'reviewedBy', 'logoUrl'],
  },
  {
    type: 'bank-transfer-approved',
    category: 'no-reply',
    subject: '✅ Your Bank Transfer Has Been Approved',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bank Transfer Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
      <h1 style="color: #27ae60; margin-top: 0;">Great News, {{firstName}}!</h1>
    </div>
    
    <p>We're pleased to inform you that your bank transfer has been approved and your wallet has been credited.</p>
    
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #155724;">✓ Transfer Status: Approved</p>
      <p style="margin: 5px 0 0 0; color: #155724;">Your funds have been successfully added to your wallet balance.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Transaction Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Amount Deposited:</strong> £{{depositAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Processing Fee:</strong> £{{fee}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Total Amount:</strong> £{{totalAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Reference Number:</strong> {{referenceNumber}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>New Wallet Balance:</strong> £{{walletBalance}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Approved Date:</strong> {{approvedDate}}</p>
    </div>
    
    <p>Your wallet balance has been updated and you can now use these funds for your transactions on Sortars.</p>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'depositAmount', 'fee', 'totalAmount', 'referenceNumber', 'walletBalance', 'approvedDate', 'logoUrl'],
  },
  {
    type: 'bank-transfer-rejected',
    category: 'no-reply',
    subject: '⚠️ Your Bank Transfer Has Been Rejected',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bank Transfer Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">⚠️</div>
      <h1 style="color: #e67e22; margin-top: 0;">Hello {{firstName}},</h1>
    </div>
    
    <p>We've reviewed your bank transfer request, and unfortunately, we're unable to approve it at this time.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">Transfer Status: Rejected</p>
      <p style="margin: 5px 0 0 0; color: #856404;">Your transfer request could not be processed.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Transaction Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Amount:</strong> £{{totalAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Reference Number:</strong> {{referenceNumber}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Rejected Date:</strong> {{rejectedDate}}</p>
    </div>
    
    {{#if rejectionReason}}
    <div style="background-color: #ffffff; border: 2px solid #e67e22; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Rejection Reason</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333; line-height: 1.8;">{{rejectionReason}}</p>
    </div>
    {{/if}}
    
    <p>If you believe this is an error or have questions about the rejection, please contact our support team for assistance.</p>
    
    <p>You can submit a new transfer request once you've addressed any issues mentioned above.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'totalAmount', 'referenceNumber', 'rejectedDate', 'rejectionReason', 'logoUrl'],
  },
  {
    type: 'card-transaction-successful',
    category: 'no-reply',
    subject: '✅ Card Payment Successful - Wallet Funded',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Card Payment Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
      <h1 style="color: #27ae60; margin-top: 0;">Card Payment Successful, {{firstName}}!</h1>
    </div>
    
    <p>Your card payment has been processed successfully and your wallet has been funded.</p>
    
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #155724;">✓ Payment Status: Successful</p>
      <p style="margin: 5px 0 0 0; color: #155724;">Your funds have been added to your wallet balance.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Transaction Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Payment Method:</strong> Card (Stripe)</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Amount Deposited:</strong> £{{depositAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Processing Fee:</strong> £{{fee}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Total Charged:</strong> £{{totalAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Transaction ID:</strong> {{transactionId}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>New Wallet Balance:</strong> £{{walletBalance}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Payment Date:</strong> {{paymentDate}}</p>
    </div>
    
    <p>Your wallet balance has been updated and you can now use these funds for your transactions on Sortars.</p>
    
    <p>If you have any questions or notice any discrepancies, please contact our support team immediately.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'depositAmount', 'fee', 'totalAmount', 'transactionId', 'walletBalance', 'paymentDate', 'logoUrl'],
  },
  {
    type: 'paypal-transaction-successful',
    category: 'no-reply',
    subject: '✅ PayPal Payment Successful - Wallet Funded',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PayPal Payment Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
      <h1 style="color: #27ae60; margin-top: 0;">PayPal Payment Successful, {{firstName}}!</h1>
    </div>
    
    <p>Your PayPal payment has been processed successfully and your wallet has been funded.</p>
    
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #155724;">✓ Payment Status: Successful</p>
      <p style="margin: 5px 0 0 0; color: #155724;">Your funds have been added to your wallet balance.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Transaction Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Payment Method:</strong> PayPal</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Amount Deposited:</strong> £{{depositAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Processing Fee:</strong> £{{fee}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Total Charged:</strong> £{{totalAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Transaction ID:</strong> {{transactionId}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>PayPal Order ID:</strong> {{paypalOrderId}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>New Wallet Balance:</strong> £{{walletBalance}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Payment Date:</strong> {{paymentDate}}</p>
    </div>
    
    <p>Your wallet balance has been updated and you can now use these funds for your transactions on Sortars.</p>
    
    <p>If you have any questions or notice any discrepancies, please contact our support team immediately.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'depositAmount', 'fee', 'totalAmount', 'transactionId', 'paypalOrderId', 'walletBalance', 'paymentDate', 'logoUrl'],
  },
  {
    type: 'card-transaction-failed',
    category: 'no-reply',
    subject: '❌ Card Payment Failed',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Card Payment Failed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">❌</div>
      <h1 style="color: #e74c3c; margin-top: 0;">Payment Failed, {{firstName}}</h1>
    </div>
    
    <p>Unfortunately, your card payment could not be processed at this time.</p>
    
    <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #721c24;">Payment Status: Failed</p>
      <p style="margin: 5px 0 0 0; color: #721c24;">Your wallet has not been funded. No charges were made to your card.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Transaction Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Amount Attempted:</strong> £{{amount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Transaction ID:</strong> {{transactionId}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Failed Date:</strong> {{failedDate}}</p>
    </div>
    
    <div style="background-color: #ffffff; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Failure Reason</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333; line-height: 1.8;">{{failureReason}}</p>
    </div>
    
    <p>Common reasons for payment failures include:</p>
    <ul style="line-height: 2;">
      <li>Insufficient funds in your account</li>
      <li>Card has expired or been cancelled</li>
      <li>Bank declined the transaction</li>
      <li>Incorrect card details</li>
    </ul>
    
    <p>Please check your payment method and try again. If the problem persists, please contact your bank or card issuer, or reach out to our support team for assistance.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'amount', 'transactionId', 'failedDate', 'failureReason', 'logoUrl'],
  },
  {
    type: 'bank-transfer-initiated',
    category: 'no-reply',
    subject: '📋 Bank Transfer Request Received',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bank Transfer Initiated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 10px;">📋</div>
      <h1 style="color: #3498db; margin-top: 0;">Thank You, {{firstName}}!</h1>
    </div>
    
    <p>We've received your bank transfer request. Please complete the transfer using the details below.</p>
    
    <div style="background-color: #e3f2fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #1565c0;">Transfer Status: Pending</p>
      <p style="margin: 5px 0 0 0; color: #1565c0;">Your request is awaiting your bank transfer and admin approval.</p>
    </div>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Transfer Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Amount to Deposit:</strong> £{{depositAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Processing Fee:</strong> £{{fee}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Total to Transfer:</strong> £{{totalAmount}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Reference Number:</strong> {{referenceNumber}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Request Date:</strong> {{requestDate}}</p>
    </div>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">Important: Use Your Reference Number</p>
      <p style="margin: 5px 0 0 0; color: #856404;">Please include the reference number <strong>{{referenceNumber}}</strong> when making your bank transfer. This ensures your payment is processed quickly and accurately.</p>
    </div>
    
    <p>Once you've completed the bank transfer, our team will review and approve your request. You'll receive an email notification once your wallet has been credited, typically within 1-2 business days.</p>
    
    <p>If you have any questions or need assistance, please contact our support team.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'lastName', 'depositAmount', 'fee', 'totalAmount', 'referenceNumber', 'requestDate', 'logoUrl'],
  },
  {
    type: 'abandoned-cart',
    category: 'notification',
    subject: '🧺 You left items in your cart',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abandoned Cart</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    
    <p>It looks like you left some items in your cart. Ready to complete your booking?</p>
    
    <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Your Cart</p>
      {{cartItems}}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{cartLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Return to Cart</a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="{{cartLink}}" style="color: #3498db;">{{cartLink}}</a></p>
    
    <p>If you have any questions, our support team is here to help.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'cartItems', 'cartLink', 'logoUrl'],
  },
  {
    type: 'order-created-client',
    category: 'orders',
    subject: '✅ Your order {{orderNumber}} has been created',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Created</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #27ae60; margin-top: 0;">Hi {{firstName}},</h1>
    
    <p>Your order has been created successfully. Here are the details:</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Order Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Order Number:</strong> {{orderNumber}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Total:</strong> £{{orderTotal}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="{{orderLink}}" style="color: #3498db;">{{orderLink}}</a></p>
    
    <p>Thank you for choosing Sortars!</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderTotal', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-received-professional',
    category: 'orders',
    subject: '📥 New order received: {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Received</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    
    <p>You just received a new order. Here are the details:</p>
    
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Order Details</p>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #333;"><strong>Order Number:</strong> {{orderNumber}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;"><strong>Total:</strong> £{{orderTotal}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="{{orderLink}}" style="color: #3498db;">{{orderLink}}</a></p>
    
    <p>Please review the order and proceed with the next steps.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderTotal', 'orderLink', 'logoUrl'],
  },
  {
    type: 'extension-request-sent-client',
    category: 'orders',
    subject: '⏱️ Time extension requested for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The professional has requested a time extension for order <strong>{{orderNumber}}</strong>.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;"><strong>Requested new delivery date:</strong> {{newDeliveryDate}}</p>
      <p style="margin: 5px 0 0 0;">Reason: {{reason}}</p>
    </div>
    <p>Please review and approve or reject this request in your order details.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'newDeliveryDate', 'reason', 'orderLink', 'logoUrl'],
  },
  {
    type: 'extension-request-sent-professional',
    category: 'orders',
    subject: '✅ Your time extension request was submitted',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension Request Submitted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>Your time extension request for order <strong>{{orderNumber}}</strong> has been submitted successfully.</p>
    <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Requested new delivery date:</strong> {{newDeliveryDate}}</p>
      <p style="margin: 5px 0 0 0;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <p>The client will be notified and can approve or reject your request. You will receive an email once they respond.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'newDeliveryDate', 'reason', 'orderLink', 'logoUrl'],
  },
  {
    type: 'extension-request-approved-client',
    category: 'orders',
    subject: '✅ You approved the time extension for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #27ae60; margin-top: 0;">Hi {{firstName}},</h1>
    <p>You have approved the time extension request for order <strong>{{orderNumber}}</strong>. The new delivery date has been updated.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'orderLink', 'logoUrl'],
  },
  {
    type: 'extension-request-approved-professional',
    category: 'orders',
    subject: '✅ Client approved your time extension for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #27ae60; margin-top: 0;">Hi {{firstName}},</h1>
    <p>Good news! The client has approved your time extension request for order <strong>{{orderNumber}}</strong>. The new delivery date is now in effect.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'orderLink', 'logoUrl'],
  },
  {
    type: 'extension-request-rejected-client',
    category: 'orders',
    subject: 'Extension request rejected for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>You have rejected the time extension request for order <strong>{{orderNumber}}</strong>. The original delivery date remains in place.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'orderLink', 'logoUrl'],
  },
  {
    type: 'extension-request-rejected-professional',
    category: 'orders',
    subject: 'Extension request was rejected for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The client has rejected your time extension request for order <strong>{{orderNumber}}</strong>. The original delivery date remains in place. Please deliver by the original deadline.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'orderLink', 'logoUrl'],
  },
  {
    type: 'cancellation-requested-requester',
    category: 'orders',
    subject: 'Your cancellation request for order {{orderNumber}} was submitted',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancellation Request Submitted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>Your cancellation request for order <strong>{{orderNumber}}</strong> has been submitted successfully.</p>
    <div style="background-color: #e3f2fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">The other party will be notified and can accept or reject your request. You will receive an email once they respond.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'cancellation-requested-responder',
    category: 'orders',
    subject: 'Cancellation requested for order {{orderNumber}} – please accept or reject',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancellation Requested</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The {{requestedByRole}} has requested to cancel order <strong>{{orderNumber}}</strong>.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">Please accept or reject this cancellation request in your order details. If you do not respond by {{responseDeadline}}, the order may be cancelled automatically.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order & Respond</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'requestedByRole', 'responseDeadline', 'orderLink', 'logoUrl'],
  },
  {
    type: 'cancellation-accepted',
    category: 'orders',
    subject: 'Cancellation accepted for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancellation Accepted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The cancellation request for order <strong>{{orderNumber}}</strong> has been accepted. The order is now cancelled.</p>
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'cancellation-rejected',
    category: 'orders',
    subject: 'Cancellation rejected for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancellation Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The cancellation request for order <strong>{{orderNumber}}</strong> has been rejected. The order will continue as normal.</p>
    <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'cancellation-withdrawn',
    category: 'orders',
    subject: 'Cancellation request withdrawn for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancellation Request Withdrawn</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The {{withdrawnByRole}} has withdrawn the cancellation request for order <strong>{{orderNumber}}</strong>. The order will continue as normal.</p>
    <div style="background-color: #e3f2fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'withdrawnByRole', 'orderLink', 'logoUrl'],
  },
  {
    type: 'cancellation-reminder',
    category: 'orders',
    subject: 'Reminder: Accept or reject cancellation for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancellation Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #e67e22; margin-top: 0;">Hi {{firstName}},</h1>
    <p>This is a reminder that a cancellation request for order <strong>{{orderNumber}}</strong> is still pending your response.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">Please accept or reject the cancellation request. If you do not respond by {{responseDeadline}}, the order may be cancelled automatically.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order & Respond</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'responseDeadline', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-delivered-client',
    category: 'orders',
    subject: 'Order {{orderNumber}} has been delivered – please review',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The professional has marked order <strong>{{orderNumber}}</strong> as delivered.</p>
    <div style="background-color: #e3f2fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">Please review the delivery and either approve it (mark as complete) or request a revision if needed.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order & Respond</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-delivered-professional',
    category: 'orders',
    subject: 'You marked order {{orderNumber}} as delivered',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>You have marked order <strong>{{orderNumber}}</strong> as delivered. The client will be notified and can approve the delivery or request a revision.</p>
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-delivery-rejected-client',
    category: 'orders',
    subject: 'You requested a revision for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revision Requested</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>You have requested a revision (rejected the current delivery) for order <strong>{{orderNumber}}</strong>. The professional will be notified and can respond with updates.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'reason', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-delivery-rejected-professional',
    category: 'orders',
    subject: 'Client requested a revision for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revision Requested</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The client has requested a revision (rejected the current delivery) for order <strong>{{orderNumber}}</strong>.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;"><strong>Reason:</strong> {{reason}}</p>
    </div>
    <p>Please review the revision request and respond with updated work or message the client.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order & Respond</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'reason', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-delivery-approved',
    category: 'orders',
    subject: 'Order {{orderNumber}} completed – delivery approved',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Completed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #27ae60; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The delivery for order <strong>{{orderNumber}}</strong> has been approved and the order is now completed.</p>
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-delivery-reminder',
    category: 'orders',
    subject: 'Reminder: Please review delivery for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Review Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #e67e22; margin-top: 0;">Hi {{firstName}},</h1>
    <p>This is a reminder that order <strong>{{orderNumber}}</strong> has been delivered and is waiting for your review.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">Please approve the delivery (mark as complete) or request a revision if you need changes.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order & Respond</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'order-review-reminder',
    category: 'orders',
    subject: 'Leave a review for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>Your order <strong>{{orderNumber}}</strong> is complete. How was your experience?</p>
    <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">Your rating and review help other clients and support professionals on Sortars.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Leave a Review</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'dispute-initiated-claimant',
    category: 'orders',
    subject: 'Dispute opened for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispute Initiated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>You have opened a dispute for order <strong>{{orderNumber}}</strong>. The other party will be notified and can respond by {{responseDeadline}}.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">You can view the dispute and add messages or offers from your account.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dispute</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'responseDeadline', 'orderLink', 'logoUrl'],
  },
  {
    type: 'dispute-initiated-respondent',
    category: 'orders',
    subject: 'Dispute opened for order {{orderNumber}} – please respond',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispute Initiated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #e67e22; margin-top: 0;">Hi {{firstName}},</h1>
    <p>A dispute has been opened for order <strong>{{orderNumber}}</strong> by the other party.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">Please respond by <strong>{{responseDeadline}}</strong>. You can view the dispute details and submit your response from your account.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dispute & Respond</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'responseDeadline', 'orderLink', 'logoUrl'],
  },
  {
    type: 'dispute-responded-claimant',
    category: 'orders',
    subject: 'Response received on dispute for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispute Response</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The other party has responded to the dispute for order <strong>{{orderNumber}}</strong>. The dispute is now in negotiation.</p>
    <div style="background-color: #e3f2fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">You can continue the discussion, make or accept offers to resolve the dispute.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dispute</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'dispute-responded-respondent',
    category: 'orders',
    subject: 'Your dispute response was submitted for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispute Response</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Hi {{firstName}},</h1>
    <p>Your response to the dispute for order <strong>{{orderNumber}}</strong> has been submitted. The dispute is now in negotiation.</p>
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">The other party will be notified. You can continue the discussion or make/accept offers.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dispute</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'orderLink', 'logoUrl'],
  },
  {
    type: 'dispute-resolved',
    category: 'orders',
    subject: 'Dispute resolved for order {{orderNumber}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispute Resolved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="Sortars Logo" style="max-width: 200px; height: auto;">
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #27ae60; margin-top: 0;">Hi {{firstName}},</h1>
    <p>The dispute for order <strong>{{orderNumber}}</strong> has been resolved.</p>
    <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Service:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0 0 0;">Agreed amount: £{{agreedAmount}}. The order is now completed.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{orderLink}}" style="background-color: #FE8A0F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    <p style="margin-top: 30px;">Best regards,<br>The Sortars Team</p>
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Sortars. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    variables: ['firstName', 'orderNumber', 'serviceName', 'agreedAmount', 'orderLink', 'logoUrl'],
  },
];

async function createDefaultTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // console.log('Connected to MongoDB');

    const logoUrl = process.env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/drv3pneh8/image/upload/v1765138083/71632be70905a17fd389a8d053249645c4e8a4df_wvs6z6.png';

    for (const template of defaultTemplates) {
      // For listing templates, check by both type and category to avoid duplicates
      const query = template.category 
        ? { type: template.type, category: template.category }
        : { type: template.type };
      
      const existing = await EmailTemplate.findOne(query);
      
      if (existing) {
        // Special handling for welcome template: update category to 'no-reply' if it's not already set
        if (template.type === 'welcome' && template.category === 'no-reply' && existing.category !== 'no-reply') {
          existing.category = 'no-reply';
          await existing.save();
          // console.log(`Updated welcome template category to 'no-reply'`);
        } else {
          // console.log(`Template ${template.type} (category: ${template.category || 'default'}) already exists, skipping...`);
        }
        continue;
      }

      const templateData = {
        ...template,
        logoUrl: logoUrl,
        body: template.body.replace(/\{\{logoUrl\}\}/g, logoUrl),
      };

      // Ensure category is set (default to 'verification' if not specified)
      if (!templateData.category) {
        templateData.category = 'verification';
      }

      await EmailTemplate.create(templateData);
      // console.log(`Created default template: ${template.type} (category: ${templateData.category})`);
    }

    // console.log('Default email templates created successfully!');
    process.exit(0);
  } catch (error) {
    // console.error('Error creating default templates:', error);
    process.exit(1);
  }
}

createDefaultTemplates();



