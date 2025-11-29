import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import type { sheets_v4, translate_v2 } from 'googleapis';
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
  /** ヘッダー開始セル（例: "A3" または "シート名!A3"）。終了列は headers 長から算出。 */
  headerStartCell: string;
}

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const SHEETS_SCOPE_FULL = 'https://www.googleapis.com/auth/spreadsheets';
const TRANSLATE_SCOPE = 'https://www.googleapis.com/auth/cloud-translation';

// ============================================================================
// Internal Type Definitions
// ============================================================================

/** Sheet metadata resolution result */
interface SheetMetadata {
  exactSheetName: string;
  sheetId?: number;
}

/** Parsed header cell reference */
interface HeaderCellReference {
  sheet: string;
  startCol: string;
  startRow: number;
}

/** Range strings for Sheets API */
interface RangeStrings {
  headerRange: string;
  dataRange: string;
}

// ============================================================================
// Utility Functions (Pure, No Side Effects)
// ============================================================================

/**
 * Formats sheet name for A1 notation range strings
 * @remarks Escapes single quotes and wraps in quotes if contains special chars
 */
function formatSheetNameForRange(sheetName: string): string {
  const normalized = sheetName.trim();
  const needsQuote = /[^A-Za-z0-9_]/.test(normalized);
  const escaped = normalized.replace(/'/g, "''");
  return needsQuote ? `'${escaped}'` : normalized;
}

/**
 * Converts 0-based column index to Excel-style letter (0='A', 25='Z', 26='AA')
 */
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

/**
 * Converts Excel-style column letter to 0-based index ('A'=0, 'Z'=25, 'AA'=26)
 */
function columnLetterToIndex(column: string): number {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Converts header string to camelCase for field names
 * @param value - Original header text
 * @param fallback - Fallback name if conversion fails
 */
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

// ============================================================================
// Extracted Business Logic Functions
// ============================================================================

/**
 * Validates input arguments for schema inference
 * @throws {Error} If required parameters are missing or invalid
 */
function validateInferSchemaArgs(args: InferSchemaArgs): void {
  const { spreadsheetId, sheetName, headers, headerStartCell } = args;

  if (!spreadsheetId || !sheetName) {
    throw new Error('spreadsheetId and sheetName are required');
  }
  if (!headers || headers.length === 0) {
    throw new Error('headers must be a non-empty array');
  }
  if (!headerStartCell) {
    throw new Error('headerStartCell is required');
  }
}

/**
 * Resolves exact sheet name and ID from spreadsheet metadata
 * @returns Sheet metadata with exact name (case-sensitive) and optional sheetId
 * @throws {Error} If sheet not found in spreadsheet
 */
async function resolveSheetMetadata(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  debug: Record<string, unknown>
): Promise<SheetMetadata> {
  try {
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    debug.metadataFetched = 'success';

    const sheet = metadata.data.sheets?.find(
      s => s.properties?.title === sheetName
    );

    if (!sheet?.properties?.title) {
      debug.sheetNotFound = true;
      const availableSheets =
        metadata.data.sheets?.map(s => s.properties?.title).join(', ') ||
        'none';
      debug.availableSheets = availableSheets;

      throw new Error(
        `Sheet "${sheetName}" not found in the spreadsheet. ` +
          `Available sheets: ${availableSheets}. ` +
          `Please verify the spreadsheetId (${spreadsheetId}) and sheetName are correct.`
      );
    }

    const result: SheetMetadata = {
      exactSheetName: sheet.properties.title,
    };

    if (
      sheet.properties.sheetId !== null &&
      sheet.properties.sheetId !== undefined
    ) {
      result.sheetId = sheet.properties.sheetId;
      debug.sheetId = sheet.properties.sheetId;
    }

    debug.exactSheetName = result.exactSheetName;
    return result;
  } catch (err) {
    // Re-throw sheet not found errors
    if (
      err instanceof Error &&
      err.message.includes('not found in the spreadsheet')
    ) {
      throw err;
    }
    // Non-fatal metadata errors: log warning and use provided sheet name
    debug.metadataWarning = err instanceof Error ? err.message : String(err);
    return { exactSheetName: sheetName };
  }
}

/**
 * Parses header start cell reference into components
 * @param headerStartCell - Cell reference like "A3" or "Sheet!A3"
 * @param fallbackSheetName - Sheet name to use if not specified in cell reference
 * @throws {Error} If cell reference format is invalid
 */
function parseHeaderStartCell(
  headerStartCell: string,
  fallbackSheetName: string
): HeaderCellReference {
  const cellWithSheet = headerStartCell.includes('!')
    ? headerStartCell
    : `${fallbackSheetName}!${headerStartCell}`;

  const match = cellWithSheet.match(
    /^(?<sheet>[^!]+)!(?<startCol>[A-Z]+)(?<startRow>\d+)$/
  );

  if (!match?.groups) {
    throw new Error('invalid headerStartCol format');
  }

  return {
    sheet: match.groups.sheet,
    startCol: match.groups.startCol,
    startRow: Number(match.groups.startRow),
  };
}

/**
 * Fetches header row values from spreadsheet with fallback handling
 * @returns 2D array of cell values
 */
async function fetchHeaderRange(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  primaryRange: string,
  fallbackRange: string,
  debug: Record<string, unknown>
): Promise<string[][]> {
  debug.headerRangeInput = primaryRange;

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: primaryRange,
      majorDimension: 'ROWS',
    });
    return res.data.values || [];
  } catch (err) {
    debug.headerRangeError = err instanceof Error ? err.message : String(err);
    debug.headerRangeFallback = fallbackRange;

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fallbackRange,
        majorDimension: 'ROWS',
      });
      delete debug.headerRangeError; // Clear error on successful fallback
      return res.data.values || [];
    } catch (err2) {
      debug.headerRangeErrorFallback =
        err2 instanceof Error ? err2.message : String(err2);
      return [];
    }
  }
}

/**
 * Validates that fetched header row matches expected headers
 * @throws {Error} If headers don't match or are missing
 */
function validateHeaderMatch(
  expectedHeaders: string[],
  fetchedValues: string[][],
  startColIndex: number,
  startRow: number
): void {
  if (startColIndex === -1 || startRow === -1) {
    throw new Error('header row not found in the provided sheet/headers');
  }

  const normalizedExpected = expectedHeaders.map(h => h.trim());
  const headerRow = fetchedValues[0] || [];
  const headerSlice = headerRow
    .slice(0, normalizedExpected.length)
    .map(h => String(h || '').trim());

  const isMatch =
    headerSlice.length === normalizedExpected.length &&
    normalizedExpected.every((h, i) => h === headerSlice[i]);

  if (!isMatch) {
    throw new Error('header row not found in the provided sheet/headers');
  }
}

/**
 * Generates A1 notation range strings for header and data rows
 */
function generateRangeStrings(
  formattedSheetName: string,
  startColIndex: number,
  headerRowIndex: number,
  headerLength: number
): RangeStrings {
  const endColIndex = startColIndex + headerLength - 1;
  const startColLetter = columnIndexToLetter(startColIndex);
  const endColLetter = columnIndexToLetter(endColIndex);
  const headerRowNumber = headerRowIndex + 1; // Convert to 1-based

  return {
    headerRange: `${formattedSheetName}!${startColLetter}${headerRowNumber}:${endColLetter}${headerRowNumber}`,
    dataRange: `${formattedSheetName}!${startColLetter}${headerRowNumber + 1}:${endColLetter}`,
  };
}

/**
 * Translates headers to English if language is specified
 * @returns Translated headers or original if translation fails/skipped
 */
async function translateHeaders(
  translate: translate_v2.Translate,
  headers: string[],
  lang?: string
): Promise<string[]> {
  if (!lang) return headers;

  try {
    const response = await translate.translations.list({
      q: headers,
      target: 'en',
      source: lang,
      format: 'text',
    });

    const translations = response.data.translations;
    if (!translations) return headers;

    return translations.map(t => t.translatedText ?? '').filter(Boolean)
      .length > 0
      ? translations.map(t => t.translatedText ?? '')
      : headers;
  } catch {
    // Silently fall back to original headers on translation failure
    return headers;
  }
}

/**
 * Builds FieldSchema array from translated and original headers
 */
function buildFieldSchemas(
  translatedHeaders: string[],
  originalHeaders: string[],
  startColIndex: number,
  lang?: string
): FieldSchema[] {
  const headerLength = translatedHeaders.length;
  const columnLetters = Array.from({ length: headerLength }, (_, i) =>
    columnIndexToLetter(startColIndex + i)
  );

  return translatedHeaders.map((translated, idx) => {
    const original = originalHeaders[idx];
    const fallbackName = `field${idx + 1}`;
    const base = translated || original || fallbackName;
    const name = toCamelCase(base, fallbackName);

    return {
      name,
      type: 'string',
      column: columnLetters[idx],
      description: lang ? `source(${lang}): ${original}` : original,
    };
  });
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Infers TypeScript schema from Google Sheets structure
 * @remarks Orchestrates validation, API calls, translation, and schema generation
 */
export async function inferSchemaFromSheet(
  args: InferSchemaArgs
): Promise<ToolResult> {
  let debug: Record<string, unknown> = {};

  try {
    // 1. Validate input
    validateInferSchemaArgs(args);

    const { spreadsheetId, sheetName, headers, lang, headerStartCell } = args;

    // 2. Initialize Google API clients
    const auth = new GoogleAuth({
      scopes: [SHEETS_SCOPE, SHEETS_SCOPE_FULL, TRANSLATE_SCOPE],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const translate = google.translate({ version: 'v2', auth });

    // 3. Resolve exact sheet metadata
    const { exactSheetName } = await resolveSheetMetadata(
      sheets,
      spreadsheetId,
      sheetName,
      debug
    );

    // 4. Parse header start cell reference
    const parsed = parseHeaderStartCell(headerStartCell, exactSheetName);
    const startColIndex = columnLetterToIndex(parsed.startCol);
    const headerRowIndex = parsed.startRow - 1; // Convert to 0-based

    // 5. Build range strings for API call
    const endCol = columnIndexToLetter(startColIndex + headers.length - 1);
    const formattedSheetName = formatSheetNameForRange(parsed.sheet);
    const headerRangeFull = `${formattedSheetName}!${parsed.startCol}${parsed.startRow}:${endCol}${parsed.startRow}`;
    const fallbackRange = `${parsed.sheet}!${parsed.startCol}${parsed.startRow}:${endCol}${parsed.startRow}`;

    // 6. Fetch header row values
    const values = await fetchHeaderRange(
      sheets,
      spreadsheetId,
      headerRangeFull,
      fallbackRange,
      debug
    );

    // 7. Validate header match
    validateHeaderMatch(headers, values, startColIndex, headerRowIndex);

    // 8. Generate range strings for schema
    const { headerRange, dataRange } = generateRangeStrings(
      formatSheetNameForRange(sheetName),
      startColIndex,
      headerRowIndex,
      headers.length
    );

    debug = {
      ...debug,
      headerRange,
      dataRange,
      headerRowIndex,
      startColIndex,
    };

    // 9. Translate headers (if lang specified)
    const translatedHeaders = await translateHeaders(translate, headers, lang);

    // 10. Build field schemas
    const fields = buildFieldSchemas(
      translatedHeaders,
      headers,
      startColIndex,
      lang
    );

    // 11. Construct final schema
    const schema: FeatureSchema = {
      sheetName,
      headerRange,
      fields,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ...schema, dataRange }, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const debugInfo =
      Object.keys(debug).length > 0
        ? `\nDebug: ${JSON.stringify(debug, null, 2)}`
        : '';

    return {
      content: [{ type: 'text', text: `Error: ${message}${debugInfo}` }],
      isError: true,
    };
  }
}
