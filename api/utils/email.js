const logger = require('./logger');

/**
 * Email Service Utility
 * 
 * Provides a standardized way to send system notifications.
 * Extension point for SendGrid, Mailgun, or AWS SES.
 */
class EmailService {
  /**
   * Send a general email
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      logger.info('Sending email', { to, subject });

      // TODO: Integrate with a real email provider (e.g., SendGrid)
      // Example:
      // const msg = { to, from: 'noreply@readypi.site', subject, text, html };
      // await sgMail.send(msg);

      if (process.env.NODE_ENV === 'development') {
        logger.info('Email Content (Mock):', { to, subject, text });
      }

      return true;
    } catch (error) {
      logger.error('Email send failed:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail, fullName) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to ReadyPI! 🚀',
      html: `
        <h1>Welcome, ${fullName || 'Developer'}!</h1>
        <p>Thank you for joining ReadyPI, India's first AI API Gateway.</p>
        <p>We've added <strong>50 free credits</strong> to your account to get you started.</p>
        <p><a href="${process.env.DASHBOARD_URL}/dashboard">Go to Dashboard</a></p>
      `
    });
  }

  /**
   * Send low credit alert
   */
  async sendLowCreditAlert(userEmail, balance) {
    return this.sendEmail({
      to: userEmail,
      subject: '⚠️ ReadyPI: Low Credit Alert',
      text: `Your balance is currently ${balance} credits. Please top up soon to avoid service interruption.`
    });
  }
}

module.exports = new EmailService();
