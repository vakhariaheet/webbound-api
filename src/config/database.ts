import postgres from 'postgres';
import OTPModal from '../models/otp.model';
const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/webbound', {
    connection: {
        TimeZone:"Asia/kolkata"
    }
});

export default sql;