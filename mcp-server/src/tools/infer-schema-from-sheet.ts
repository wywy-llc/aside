import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import type { FeatureSchema, FieldSchema } from './schema-generator.js';

interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface InferSchemaArgs {
  spreadsheetId: string;
  sheetName: string;
  headers: string[];
  lang?: string;
}

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const TRANSLATE_SCOPE = 'https://www.googleapis.com/auth/cloud-translation';

function columnIndexToLetter(index: number): string {
  let num = index + 1;
  let letters = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters;
}

function toCamelCase(value: string, fallback = 'field'): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9]+/g, ' ');
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 0) return fallback;
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join('')
  );
}

export async function inferSchemaFromSheet(
  args: InferSchemaArgs
): Promise<ToolResult> {
  try {
    const { spreadsheetId, sheetName, headers, lang } = args;
    if (!spreadsheetId || !sheetName) {
      throw new Error('spreadsheetId and sheetName are required');
    }
    if (!headers || headers.length === 0) {
      throw new Error('headers must be a non-empty array');
    }

    const auth = new GoogleAuth({ scopes: [SHEETS_SCOPE, TRANSLATE_SCOPE] });
    const sheets = google.sheets({ version: 'v4', auth });
    const translate = google.translate({ version: 'v2', auth });
    const scanRange = `${sheetName}!A1:Z100`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: scanRange,
      majorDimension: 'ROWS',
    });

    const values = response.data.values || [];
    let headerRowIndex = -1;
    let startColIndex = -1;

    for (let r = 0; r < values.length; r++) {
      const row = values[r] || [];
      for (let c = 0; c < row.length; c++) {
        const slice = row
          .slice(c, c + headers.length)
          .map(v => String(v || '').trim());
        if (headers.every((h, i) => slice[i] === h.trim())) {
          headerRowIndex = r;
          startColIndex = c;
          break;
        }
      }
      if (headerRowIndex !== -1) break;
    }

    if (headerRowIndex === -1 || startColIndex === -1) {
      throw new Error('header row not found in the provided sheet/headers');
    }

    const endColIndex = startColIndex + headers.length - 1;
    const startColLetter = columnIndexToLetter(startColIndex);
    const endColLetter = columnIndexToLetter(endColIndex);

    const headerRowNumber = headerRowIndex + 1; // 1-based
    const headerRange = `${sheetName}!${startColLetter}${headerRowNumber}:${endColLetter}${headerRowNumber}`;
    const dataRange = `${sheetName}!${startColLetter}${headerRowNumber + 1}:${endColLetter}`;

    let translatedHeaders = headers;
    if (lang) {
      try {
        const { data: translationData } = await translate.translations.list({
          q: headers,
          target: 'en',
          source: lang,
          format: 'text',
        });
        translatedHeaders =
          translationData.translations?.map(t => t.translatedText || '') ||
          headers;
      } catch {
        translatedHeaders = headers;
      }
    }

    const fields: FieldSchema[] = translatedHeaders.map((translated, idx) => {
      const original = headers[idx];
      const fallbackName = `field${idx + 1}`;
      const base = translated || original || fallbackName;
      const name = toCamelCase(String(base), fallbackName);
      return {
        name,
        type: 'string',
        column: columnIndexToLetter(startColIndex + idx),
        description: lang ? `source(${lang}): ${original}` : String(original),
      };
    });

    const schema: FeatureSchema = {
      sheetName,
      headerRange,
      fields,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ...schema,
              dataRange,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
