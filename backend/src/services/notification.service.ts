import { logger } from '../config/logger';

export async function sendOrderConfirmationEmail(to: string, subject: string, html: string, text: string) {
  logger.info('order.email.sent', { to, subject, textPreview: text.slice(0, 120), htmlPreview: html.slice(0, 120) });
  return { delivered: true };
}

export async function sendOrderConfirmationSms(phone: string, message: string) {
  logger.info('order.sms.sent', { phone, message });
  return { delivered: true };
}
