export const generateForgetPasswordEmailTemplate = (resetPasswordUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #4a90e2; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">School Management System - Password Reset</h1>
      </div>
      <div style="padding: 30px; color: #333; line-height: 1.6;">
        <h2 style="color: #4a90e2;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for the school portal. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetPasswordUrl}" 
             style="background-color: #4a90e2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
             Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #888; font-size: 12px;">${resetPasswordUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">If you did not request this, please ignore this email. This link is valid for a limited time.</p>
      </div>
    </div>
  `;
};