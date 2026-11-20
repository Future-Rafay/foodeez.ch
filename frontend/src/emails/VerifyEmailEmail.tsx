import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerifyEmailProps {
  verifyUrl: string;
}

export const VerifyEmailEmail = ({ verifyUrl }: VerifyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Confirm your Foodeez email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Confirm your email</Heading>
          <Section style={section}>
            <Text style={text}>
              Welcome to Foodeez! Confirm this email address to finish creating your account. The link works for 48 hours.
            </Text>
            <Button href={verifyUrl} style={button}>
              Confirm email
            </Button>
            <Text style={text}>
              If you did not create a Foodeez account, ignore this email and no account will be activated.
            </Text>
          </Section>
          <Text style={footer}>
            This is an automated message, please do not reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const section = {
  padding: '0 48px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  padding: '0 48px',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#4F46E5',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 20px',
  margin: '24px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '0 48px',
  marginTop: '32px',
};

export default VerifyEmailEmail; 