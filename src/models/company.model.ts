import sql from '../config/database';

export interface Company {
  id: string;
  name: string;
  api_key: string;
  api_secret: string;
  created_at: Date;
  is_active: boolean;
}

export const initCompanyModel = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        api_key UUID DEFAULT gen_random_uuid(),
        api_secret UUID DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `;
    console.log('✅ Company table initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Company table:', error);
  }
};

export default { initCompanyModel };