import { Resend } from 'resend';
import { render } from '@react-email/render';
import ContactEmail from '@/emails/ContactEmail';
import ReservationEmail from '@/emails/ReservationEmail';
import NewsletterEmail from '@/emails/NewsletterEmail';
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import GuestOrderConfirmationEmail, { type GuestOrderConfirmationData } from '@/emails/GuestOrderConfirmationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailTemplateType = 'contact' | 'reservation' | 'newsletter' | 'passwordReset' | 'guestOrderConfirmation';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ReservationFormData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  occasion?: string;
  specialRequests?: string;
  businessName: string;
}

interface NewsletterData {
  email: string;
}

interface PasswordResetData {
  resetUrl: string;
}

export const sendEmail = async (
  to: string,
  template: EmailTemplateType,
  data: ContactFormData | ReservationFormData | NewsletterData | PasswordResetData | GuestOrderConfirmationData
) => {
  try {
    let emailComponent;
    let subject;

    switch (template) {
      case 'contact':
        emailComponent = ContactEmail(data as ContactFormData);
        subject = `New Contact Form Submission: ${(data as ContactFormData).subject}`;
        break;
      case 'reservation':
        emailComponent = ReservationEmail(data as ReservationFormData);
        subject = `New Reservation Request at ${(data as ReservationFormData).businessName}`;
        break;
      case 'newsletter':
        emailComponent = NewsletterEmail(data as NewsletterData);
        subject = 'Welcome to Foodeez Newsletter!';
        break;
      case 'passwordReset':
        emailComponent = PasswordResetEmail(data as PasswordResetData);
        subject = 'Reset Your Password';
        break;
      case 'guestOrderConfirmation':
        emailComponent = GuestOrderConfirmationEmail(data as GuestOrderConfirmationData);
        subject = `Your Foodeez order ${(data as GuestOrderConfirmationData).orderNumber}`;
        break;
      default:
        throw new Error('Invalid email template type');
    }

    const html = await render(emailComponent);

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Foodeez <info@foodeez.ch>',
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};
