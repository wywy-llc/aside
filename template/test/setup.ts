import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.TEST_SPREADSHEET_ID) {
  console.warn(
    '⚠️ TEST_SPREADSHEET_ID is not set. Tests hitting real APIs will fail.'
  );
}
