import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ClaimCodeEmailProps {
  code: string;
  businessName: string;
}

export const ClaimCodeEmail = ({ code, businessName }: ClaimCodeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Foodeez verification code for {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Confirm your claim</Heading>
          <Section style={section}>
            <Text style={text}>
              Someone asked to manage {businessName} on Foodeez. If that was you, enter this code on Foodeez. It expires in 15 minutes.
            </Text>
            <Text style={{ ...text, fontSize: '32px', fontWeight: 700, letterSpacing: '8px', textAlign: 'center' as const }}>{code}</Text>
            <Text style={text}>
              If you did not ask for this, ignore this email. Nobody gets access without this code and a check by the Foodeez team.
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

export default ClaimCodeEmail;

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

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '0 48px',
  marginTop: '32px',
};
