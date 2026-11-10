import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }

  interface User {
    /** Password fingerprint, set by credentials sign-in only. */
    pwf?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    pwf?: string;
    pwCheckedAt?: number;
  }
}

export interface VisitorsAccount {
  VISITORS_ACCOUNT_ID: bigint;
  CREATION_DATETIME?: Date;
  EMAIL_ADDRESS?: string;
  PASSWORD?: string;
  FIRST_NAME?: string;
  LAST_NAME?: string;
  LANGUAGE?: string;
  PIC?: string;
  RESET_TOKEN?: string;
  RESET_TOKEN_EXPIRY?: Date;
}
