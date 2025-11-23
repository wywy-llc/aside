import cleanup from 'rollup-plugin-cleanup';
import prettier from 'rollup-plugin-prettier';
import typescript from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Determine environment (prod or dev)
const isProduction = process.env.NODE_ENV === 'production';
const suffix = isProduction ? 'PROD' : 'DEV';

// Build spreadsheet ID map from environment variables
const spreadsheetIdMap = {};
for (let i = 1; i <= 5; i++) {
  const key = `APP_SPREADSHEET_ID_${i}_${suffix}`;
  const id = process.env[key];
  if (id && id.trim()) {
    spreadsheetIdMap[i] = id.trim();
  }
}

const spreadsheetIdMapJson = JSON.stringify(spreadsheetIdMap);

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  external: ['googleapis', 'path', 'google-auth-library'],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      exclude: ['test/**/*', '**/*.test.ts'],
    }),
    // Replace environment variables at build time (must run after TypeScript)
    replace({
      preventAssignment: true,
      delimiters: ['', ''],
      values: {
        "'__BUILD_SPREADSHEET_ID_MAP__'": spreadsheetIdMapJson,
      },
    }),
    cleanup({ comments: 'none', extensions: ['.ts', '.js'] }),
    prettier({ parser: 'typescript' }),
  ],
  context: 'this',
};
