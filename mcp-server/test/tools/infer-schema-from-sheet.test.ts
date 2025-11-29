import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inferSchemaFromSheet } from '../../src/tools/infer-schema-from-sheet.js';

const mockGet = vi.fn();

vi.mock('google-auth-library', () => {
  // コンストラクタとして new GoogleAuth() を許容するモック
  function GoogleAuthMock(this: unknown) {
    return { getClient: vi.fn() };
  }
  return { GoogleAuth: vi.fn(GoogleAuthMock) };
});

vi.mock('googleapis', () => {
  const sheetsMock = vi.fn(() => ({
    spreadsheets: {
      values: {
        get: mockGet,
      },
    },
  }));
  const translateMock = vi.fn(() => ({
    translations: {
      list: vi.fn().mockResolvedValue({
        data: {
          translations: [{ translatedText: 'ID' }, { translatedText: 'Name' }],
        },
      }),
    },
  }));
  return {
    google: {
      sheets: sheetsMock,
      translate: translateMock,
    },
  };
});

const spreadsheetId = 'test-spreadsheet-id';
const sheetName = 'Sheet1';

describe('inferSchemaFromSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ヘッダー行を探索してFeatureSchemaを返す', async () => {
    // テストデータ: A1:B1 に ID, 名前 があるケース
    mockGet.mockResolvedValueOnce({
      data: {
        values: [
          ['ID', '名前'],
          ['1', 'foo'],
        ],
      },
    });

    const result = await inferSchemaFromSheet({
      spreadsheetId,
      sheetName,
      headers: ['ID', '名前'],
      lang: 'ja',
    });

    expect(result.isError).toBeUndefined();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.sheetName).toBe('Sheet1');
    expect(payload.headerRange).toBe('Sheet1!A1:B1');
    expect(payload.dataRange).toBe('Sheet1!A2:B');
    expect(payload.fields).toHaveLength(2);
    expect(payload.fields[0]).toMatchObject({ name: 'id', column: 'A' });
    expect(payload.fields[1]).toMatchObject({ name: 'name', column: 'B' });
  });

  it('ヘッダーが見つからない場合はエラーを返す', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        values: [['X', 'Y']],
      },
    });

    const result = await inferSchemaFromSheet({
      spreadsheetId,
      sheetName,
      headers: ['ID', '名前'],
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('header row not found');
  });
});
