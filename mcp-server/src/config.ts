/**
 * Spreadsheet configuration utilities for MCP server
 *
 * Spreadsheet IDs are loaded from environment variables:
 * APP_SPREADSHEET_ID_{N}_DEV or APP_SPREADSHEET_ID_{N}_PROD (1-5)
 */
export enum SpreadsheetType {
  TODOS = 1,
}

type SpreadsheetIdMap = Record<number, string>;

function buildSpreadsheetIdMap(): SpreadsheetIdMap {
  const isProduction = process.env.NODE_ENV === 'production';
  const suffix = isProduction ? 'PROD' : 'DEV';
  const map: SpreadsheetIdMap = {};

  for (let i = 1; i <= 5; i++) {
    const key = `APP_SPREADSHEET_ID_${i}_${suffix}`;
    const id = process.env[key];
    if (id && id.trim()) {
      map[i] = id.trim();
    }
  }

  return map;
}

/**
 * Spreadsheet IDを取得
 *
 * @param type - SpreadsheetType enum value
 * @returns Spreadsheet ID string
 * @throws Error when ID is missing
 */
export function getSpreadsheetId(type: SpreadsheetType): string {
  const map = buildSpreadsheetIdMap();
  const id = map[type];

  if (!id) {
    const typeName = SpreadsheetType[type] ?? type;
    throw new Error(
      `Spreadsheet ID for type ${typeName} (${type}) is not configured. ` +
        'Set APP_SPREADSHEET_ID_{N}_DEV/PROD in your environment.'
    );
  }

  return id;
}
