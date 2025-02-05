import sql from '../config/database';

export interface OTP {
  id: string;
  phone: string;
  otp: string;
  expires_at: Date;
  created_at: Date;
  is_used: boolean;
}

export const initOTPModel = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_used BOOLEAN DEFAULT FALSE
      )
    `;
    console.log('✅ OTP table initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing OTP table:', error);
  }
};

export default { initOTPModel };

